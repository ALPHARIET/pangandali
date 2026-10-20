from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.agent.runner import PESAN_CONSENT, PESAN_TIDAK_TERDAFTAR, sistem_notifier
from app.config import get_settings
from app.llm.client import LLMError
from app.matching import proses_kedaluwarsa
from app.models import AuditLog, LaporanPanen, Message, Penawaran, Pengiriman, Pesanan, Petani, User
from tests.conftest import ScriptedLLM, aksi, kirim_pesan, panggil

SLAMET = "6281300001111"
ANDI = "6281234567890"  # truk 2.000 kg
RUDI = "6281234560002"  # pikap 1.000 kg
BUDI = "6281299998888"  # distributor


def _validasi(db, lap_id, **kw):
    """Simulasikan validasi admin langsung di DB (jalur API diuji di test_api)."""
    lap = db.get(LaporanPanen, lap_id)
    if kw.get("kg_per_satuan"):
        lap.kg_per_satuan = kw["kg_per_satuan"]
        lap.jumlah_kg = lap.jumlah * kw["kg_per_satuan"]
    lap.sisa_kg = lap.jumlah_kg
    lap.status = "tersedia"
    db.commit()
    return lap


def _penerima(db, msgs):
    return {db.get(Message, m.id).conversation.phone for m in msgs}


def test_laporan_butuh_konfirmasi_lalu_menunggu_validasi(db, scripted):
    llm = scripted(
        [
            [("simpan_laporan_panen", {"komoditas": "kol", "jumlah": 300, "satuan": "kilo", "tanggal_panen": "besok", "harga_harapan_per_kg": 6000})],
            "Betul 300 kg kubis dari Lubuk Ubar, panen besok, harapan Rp6.000/kg?",
        ]
    )
    kirim_pesan(db, SLAMET, "kol 300 kilo besok, maunya 6 ribu", llm)
    assert db.scalar(select(LaporanPanen)) is None, "belum boleh tersimpan sebelum konfirmasi"
    assert "Lubuk Ubar" in llm.tool_results(1)[0]["ringkasan"]

    llm2 = scripted([[("konfirmasi_aksi", {})], "Siap Pak, sudah tercatat dan akan diperiksa petugas."])
    kirim_pesan(db, SLAMET, "iya betul", llm2)
    lap = db.scalar(select(LaporanPanen))
    assert lap.komoditas == "Kubis" and lap.jumlah_kg == 300 and lap.harga_harapan_per_kg == 6000
    assert lap.status == "menunggu_validasi" and lap.lokasi.nama == "Lubuk Ubar"
    assert any(m["role"] == "assistant" and "300 kg" in (m["content"] or "") for m in llm2.calls[0]), "riwayat dikirim ke LLM"
    assert db.scalar(select(AuditLog).where(AuditLog.aksi == "simpan_laporan_panen")) is not None


def test_satuan_lokal_tidak_dikonversi_tanpa_kesepakatan(db):
    hasil, _ = aksi(db, SLAMET, "simpan_laporan_panen", {"komoditas": "cabe", "jumlah": 6, "satuan": "karung"})
    lap = db.get(LaporanPanen, hasil["laporan_id"])
    assert lap.jumlah_kg is None and lap.satuan == "karung"
    hasil, _ = aksi(db, SLAMET, "simpan_laporan_panen", {"komoditas": "cabe", "jumlah": 6, "satuan": "karung", "kg_per_satuan": 45})
    assert db.get(LaporanPanen, hasil["laporan_id"]).jumlah_kg == 270


def test_konfirmasi_di_giliran_sama_ditolak(db, scripted):
    llm = scripted([[("simpan_laporan_panen", {"komoditas": "kol", "jumlah": 200, "satuan": "kg"})], [("konfirmasi_aksi", {})], "Betul?"])
    kirim_pesan(db, SLAMET, "kol 200 kilo", llm)
    assert "belum menjawab" in llm.tool_results(2)[-1]["error"]
    assert db.scalar(select(LaporanPanen)) is None


def test_nomor_tidak_terdaftar_tidak_dilayani(db, scripted):
    llm = scripted([])
    h = kirim_pesan(db, "6285711112222", "panen kubis 1 ton", llm)
    assert h.balasan[0].text == PESAN_TIDAK_TERDAFTAR
    assert db.scalar(select(Petani).where(Petani.phone == "6285711112222")) is None
    assert llm.calls == []


def test_petani_terdaftar_wajib_consent(db, scripted):
    db.add(Petani(phone="6285711113333", name="Pak Joko", desa="Kampung Baru"))
    db.commit()
    llm = scripted([])
    assert kirim_pesan(db, "6285711113333", "halo", llm).balasan[0].text == PESAN_CONSENT
    kirim_pesan(db, "6285711113333", "ya setuju", llm)
    assert db.scalar(select(Petani).where(Petani.phone == "6285711113333")).consent_at is not None
    assert llm.calls == []


def _stok_kubis(db, kg=600):
    hasil, _ = aksi(db, SLAMET, "simpan_laporan_panen", {"komoditas": "kubis", "jumlah": kg, "satuan": "kg", "tanggal_panen": "besok"})
    return _validasi(db, hasil["laporan_id"])


def test_alur_lengkap_pesanan_penawaran_dan_dampak(db, client, admin_headers):
    lap = _stok_kubis(db)

    stok, _ = panggil(db, BUDI, "cari_stok", {"komoditas": "kol"})
    assert stok["total_tersedia_kg"] == 600 and SLAMET not in str(stok) and "Slamet" not in str(stok)

    # Distributor mengajukan permintaan: volume dikunci, petani dikabari
    hasil, h = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 600, "harga_tawar_per_kg": 5500})
    db.refresh(lap)
    assert hasil["status"] == "menunggu_petani" and lap.sisa_kg == 0 and lap.status == "dipesan"
    assert SLAMET in _penerima(db, h.notifikasi)
    assert db.scalar(select(Pengiriman)) is None, "pengiriman baru dibuat setelah petani menerima"

    # Petani menerima → order angkutan + penawaran ke kandidat terbaik (pikap 1.000 kg, tingkat isian lebih tinggi)
    hasil, h = aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": hasil["pesanan_id"]})
    kirim = db.scalar(select(Pengiriman))
    pen1 = db.scalar(select(Penawaran).where(Penawaran.status == "ditawarkan"))
    rudi = db.scalar(select(User).where(User.phone == RUDI))
    assert pen1.driver_id == rudi.id and pen1.detail["km_deviasi"] == 26  # (9 + 97 + 5) - 85 km, jarak CONTOH di seed
    assert {BUDI, RUDI} <= _penerima(db, h.notifikasi)
    assert kirim.driver_id is None, "rekomendasi belum menjadi penugasan"

    # Rudi menolak → diteruskan ke Andi
    _, h = panggil(db, RUDI, "tolak_penawaran", {"alasan": "bak masih kotor"})
    pen2 = db.scalar(select(Penawaran).where(Penawaran.status == "ditawarkan"))
    assert pen2.driver.phone == ANDI and pen2.urutan == 2
    assert ANDI in _penerima(db, h.notifikasi)

    aksi(db, ANDI, "terima_penawaran", {"kode": kirim.kode})
    db.refresh(kirim)
    assert kirim.status == "diambil" and kirim.driver.phone == ANDI and kirim.km_deviasi == 26
    assert kirim.perjalanan.kapasitas_tersedia_kg == 1400

    llm = ScriptedLLM([[("update_status_pengiriman", {"kode": kirim.kode, "status": "dimuat", "berat_muat_kg": 600}),
                        ("update_status_pengiriman", {"kode": kirim.kode, "status": "dalam_perjalanan"})], "Oke."])
    h = kirim_pesan(db, ANDI, "udah dimuat, otw", llm)
    ke_petani = [m for m in h.notifikasi if db.get(Message, m.id).conversation.phone == SLAMET]
    assert len(ke_petani) == 1 and "dimuat" in ke_petani[0].text and "dalam perjalanan" in ke_petani[0].text
    hasil, _ = panggil(db, ANDI, "update_status_pengiriman", {"kode": kirim.kode, "status": "menuju_jemput"})
    assert "mundur" in hasil["error"]
    hasil, _ = panggil(db, ANDI, "update_status_pengiriman", {"kode": kirim.kode, "status": "selesai"})
    assert hasil["data_dampak_belum_lengkap"]
    aksi(db, ANDI, "catat_data_perjalanan", {"kode": kirim.kode, "km_aktual": 105, "bbm_liter": 13})
    hasil, _ = aksi(db, BUDI, "catat_penerimaan", {"kode": kirim.kode, "berat_terima_kg": 588, "berat_ditolak_kg": 10, "alasan_tolak_mutu": "busuk"})
    assert hasil["susut_persen"] == 0.33  # tiba 588 + 10 ditolak = 598; susut 2 kg dari 600
    assert db.scalar(select(Pesanan)).status == "selesai"

    r = client.get("/api/dampak/ringkasan", headers=admin_headers).json()
    rinci = r["rincian"][0]
    # Pembanding: Curup→Kota Bengkulu 85 km + angkutan khusus Lubuk Ubar→Panorama 97 km pulang-pergi = 279 km
    assert rinci["km_pembanding"] == 279 and rinci["km_hemat"] == 174
    assert rinci["bbm_pembanding_liter"] == 34.88 and rinci["bbm_hemat_liter"] == 21.88
    assert r["susut"]["persen"] == 0.33 and r["susut"]["total_kg"] == 2 and r["susut"]["ditolak_mutu_kg"] == 10
    assert r["emisi"]["status"] == "belum_dihitung"
    assert r["utilisasi_muatan_balik"]["berisi_muatan"] >= 1


def test_petani_menolak_melepas_kunci(db):
    lap = _stok_kubis(db, 500)
    hasil, _ = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 300})
    db.refresh(lap)
    assert lap.sisa_kg == 200
    _, h = aksi(db, SLAMET, "tolak_pesanan", {"pesanan_id": hasil["pesanan_id"], "alasan": "harga kurang"})
    db.refresh(lap)
    assert lap.sisa_kg == 500 and lap.status == "tersedia"
    assert BUDI in _penerima(db, h.notifikasi)


def test_pemesanan_ganda_dicegah(db):
    lap = _stok_kubis(db, 500)
    aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 500})
    hasil, _ = panggil(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 100})
    assert "error" in hasil


def test_kedaluwarsa_pesanan_dan_penawaran(db):
    lap = _stok_kubis(db, 500)
    hasil, _ = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 500})
    nanti = datetime.now(timezone.utc) + timedelta(days=2)
    proses_kedaluwarsa(db, sistem_notifier(db), now=nanti)
    db.commit()
    db.refresh(lap)
    assert db.get(Pesanan, hasil["pesanan_id"]).status == "kedaluwarsa" and lap.sisa_kg == 500

    hasil, _ = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 500})
    aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": hasil["pesanan_id"]})
    pertama = db.scalar(select(Penawaran).where(Penawaran.status == "ditawarkan"))
    proses_kedaluwarsa(db, sistem_notifier(db), now=nanti)
    db.commit()
    db.refresh(pertama)
    kedua = db.scalar(select(Penawaran).where(Penawaran.status == "ditawarkan"))
    assert pertama.status == "kedaluwarsa" and kedua.driver_id != pertama.driver_id


def test_tidak_ada_kandidat_lalu_perjalanan_baru(db):
    lap = _stok_kubis(db, 2500)  # melebihi kapasitas semua perjalanan
    hasil, _ = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 2500})
    aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": hasil["pesanan_id"]})
    kirim = db.scalar(select(Pengiriman))
    assert kirim.status == "perlu_admin"

    andi = db.scalar(select(User).where(User.phone == ANDI))
    andi.kapasitas_kg = 3000
    db.commit()
    hasil, _ = aksi(db, ANDI, "umumkan_perjalanan", {"asal": "curup", "tujuan": "bengkulu", "tanggal": "besok", "kapasitas_kg": 3000})
    assert hasil["order_dicocokkan_ulang"] >= 1
    db.refresh(kirim)
    assert kirim.status == "menunggu_driver"
    assert db.scalar(select(Penawaran).where(Penawaran.status == "ditawarkan")).driver_id == andi.id


def test_batas_deviasi_menyaring_kandidat(db, monkeypatch):
    monkeypatch.setattr(get_settings(), "maks_deviasi_km", 10.0)
    lap = _stok_kubis(db, 500)
    hasil, _ = aksi(db, BUDI, "buat_pesanan", {"laporan_id": lap.id, "jumlah_kg": 500})
    aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": hasil["pesanan_id"]})
    assert db.scalar(select(Pengiriman)).status == "perlu_admin"


def test_tool_lintas_peran_ditolak(db):
    hasil, _ = panggil(db, SLAMET, "ambil_muatan", {"kode": "TRK-1001"})
    assert "tidak tersedia untuk peran" in hasil["error"]


def test_llm_gangguan_fallback_rule_based(db, scripted):
    h = kirim_pesan(db, SLAMET, "panen wortel 5 kwintal desa lubuk ubar", scripted([LLMError("HTTP 503")]))
    assert "gangguan" in h.balasan[0].text
    lap = db.scalar(select(LaporanPanen))
    assert lap.status == "perlu_review" and lap.jumlah_kg == 500 and lap.sumber == "fallback"
    kirim_pesan(db, SLAMET, "cabe 6 karung", scripted([LLMError("HTTP 503")]))
    assert db.scalars(select(LaporanPanen).order_by(LaporanPanen.id.desc())).first().jumlah_kg is None


def test_idempotensi_wa_message_id(db, scripted):
    llm = scripted(["Halo Pak."])
    assert kirim_pesan(db, SLAMET, "halo", llm, wa_message_id="wamid.1") is not None
    assert kirim_pesan(db, SLAMET, "halo", llm, wa_message_id="wamid.1") is None


def test_ringkasan_harga_tanpa_salah_tanda_baca(db, scripted):
    llm = scripted([[("simpan_laporan_panen", {"komoditas": "kol", "jumlah": 1, "satuan": "ton", "tanggal_panen": "besok", "harga_harapan_per_kg": 6500})], "Betul?"])
    kirim_pesan(db, SLAMET, "kol 1 ton", llm)
    ringkasan = llm.tool_results(1)[0]["ringkasan"]
    assert ", harga harapan Rp6.500/kg" in ringkasan and ". harga" not in ringkasan


def test_cek_harga_menyertakan_sumber(db):
    hasil, _ = panggil(db, SLAMET, "cek_harga", {"komoditas": "kol"})
    assert "contoh" in hasil["harga"][0]["sumber"]
