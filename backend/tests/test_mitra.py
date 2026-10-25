"""Endpoint portal web Mitra Logistik & Distributor (memakai tools agent yang sama dengan WhatsApp)."""
from sqlalchemy import select

from app.models import AuditLog, LaporanPanen, Message, Penawaran, Pengiriman, Pesanan, Petani, User
from app.security import create_access_token
from tests.conftest import aksi

SLAMET = "6281300001111"
ANDI = "6281234567890"
RUDI = "6281234560002"
BUDI = "6281299998888"


def _hdr(db, phone=None, user=None):
    u = user or db.scalar(select(User).where(User.phone == phone))
    return {"Authorization": f"Bearer {create_access_token(u.id, u.role)}"}


def _stok(db, kg=600, komoditas="Kubis"):
    p = db.scalar(select(Petani).where(Petani.phone == SLAMET))
    lap = LaporanPanen(petani_id=p.id, komoditas=komoditas, jumlah=kg, satuan="kg", jumlah_kg=kg, sisa_kg=kg, desa="Lubuk Ubar", status="tersedia")
    from app.geo import cari_lokasi

    lap.lokasi_id = cari_lokasi(db, "Lubuk Ubar").id
    db.add(lap)
    db.commit()
    return lap


def _register(client, role="driver", email="baru@contoh.id"):
    r = client.post("/api/auth/register", json={"email": email, "password": "rahasia123", "name": "Mitra Baru", "role": role})
    assert r.status_code == 201, r.text
    tok = client.post("/api/auth/login", json={"email": email, "password": "rahasia123"}).json()["access_token"]
    return r.json(), {"Authorization": f"Bearer {tok}"}


# ---------------- RBAC ----------------


def test_rbac_peran_dan_verifikasi(client, db, admin_headers):
    budi, andi = _hdr(db, BUDI), _hdr(db, ANDI)
    assert client.get("/api/driver/tugas").status_code == 401
    assert client.get("/api/driver/tugas", headers=budi).status_code == 403
    assert client.get("/api/distributor/pesanan", headers=andi).status_code == 403
    assert client.get("/api/distributor/stok", headers=admin_headers).status_code == 403
    _, baru = _register(client)
    r = client.get("/api/driver/penawaran", headers=baru)
    assert r.status_code == 403 and "diverifikasi" in r.json()["detail"]
    assert client.get("/api/akun/lokasi", headers=baru).status_code == 200, "lokasi boleh dibaca saat mengisi profil"


# ---------------- Distributor → petani → driver ----------------


def test_alur_web_distributor_dan_driver(client, db):
    lap = _stok(db)
    budi, andi, rudi = _hdr(db, BUDI), _hdr(db, ANDI), _hdr(db, RUDI)

    stok = client.get("/api/distributor/stok", headers=budi).json()
    assert [s["laporan_id"] for s in stok] == [lap.id] and stok[0]["komoditas"] == "Kubis"
    assert SLAMET not in str(stok) and "Slamet" not in str(stok), "data petani tidak dibagikan ke distributor"
    assert client.get("/api/distributor/stok", params={"komoditas": "cabe"}, headers=budi).json() == []

    # Melebihi sisa stok ditolak oleh logika tool
    r = client.post("/api/distributor/pesanan", headers=budi, json={"laporan_id": lap.id, "jumlah_kg": 900})
    assert r.status_code == 409 and "hanya" in r.json()["detail"]

    r = client.post("/api/distributor/pesanan", headers=budi, json={"laporan_id": lap.id, "jumlah_kg": 600, "harga_tawar_per_kg": 5500})
    assert r.status_code == 201 and r.json()["status"] == "menunggu_petani"
    pid = r.json()["pesanan_id"]
    db.refresh(lap)
    assert lap.sisa_kg == 0 and lap.status == "dipesan", "volume dikunci"
    assert any(m.conversation.phone == SLAMET and f"#{pid}" in m.text for m in db.scalars(select(Message).where(Message.is_notification.is_(True))))
    assert db.scalar(select(AuditLog).where(AuditLog.aksi == "buat_pesanan")).data["kanal"] == "web"

    psn = client.get("/api/distributor/pesanan", headers=budi).json()
    assert psn[0]["pesanan_id"] == pid and psn[0]["bisa_batal"] and psn[0]["pengiriman"] is None

    # Petani menerima lewat WhatsApp → order angkutan + penawaran ke kandidat pertama (pikap Rudi)
    aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": pid})
    assert client.get("/api/driver/penawaran", headers=andi).json() == [], "belum ditawarkan ke Andi"
    pen = client.get("/api/driver/penawaran", headers=rudi).json()
    assert len(pen) == 1 and pen[0]["jumlah_kg"] == 600 and pen[0]["jemput_mulai"] and pen[0]["berlaku_sampai"]

    # Penawaran milik driver lain tidak bisa diterima
    assert client.post(f"/api/driver/penawaran/{pen[0]['penawaran_id']}/terima", headers=andi).status_code == 409

    r = client.post(f"/api/driver/penawaran/{pen[0]['penawaran_id']}/tolak", headers=rudi, json={"alasan": "bak kotor"})
    assert r.status_code == 200 and r.json()["status"] == "ditolak"
    pen2 = client.get("/api/driver/penawaran", headers=andi).json()
    assert len(pen2) == 1, "penolakan diteruskan ke kandidat berikutnya"

    r = client.post(f"/api/driver/penawaran/{pen2[0]['penawaran_id']}/terima", headers=andi)
    assert r.status_code == 200 and r.json()["status"] == "diambil"
    kode = r.json()["kode"]

    tugas = client.get("/api/driver/tugas", headers=andi).json()
    assert tugas[0]["kode"] == kode and tugas[0]["status_berikut"] == "menuju_jemput"

    # Pembatalan setelah armada ditetapkan harus lewat petugas
    assert client.get("/api/distributor/pesanan", headers=budi).json()[0]["bisa_batal"] is False
    assert client.post(f"/api/distributor/pesanan/{pid}/batal", headers=budi).status_code == 409

    # Distributor belum bisa catat penerimaan sebelum barang dimuat
    assert client.post(f"/api/distributor/pengiriman/{kode}/penerimaan", headers=budi, json={"berat_terima_kg": 500}).status_code == 409

    r = client.post(f"/api/driver/tugas/{kode}/status", headers=andi, json={"status": "dimuat", "berat_muat_kg": 600})
    assert r.status_code == 200 and r.json()["status"] == "dimuat"
    r = client.post(f"/api/driver/tugas/{kode}/status", headers=andi, json={"status": "menuju_jemput"})
    assert r.status_code == 409 and "mundur" in r.json()["detail"]
    assert client.post(f"/api/driver/tugas/{kode}/status", headers=rudi, json={"status": "selesai"}).status_code == 409
    r = client.post(f"/api/driver/tugas/{kode}/status", headers=andi, json={"status": "selesai"})
    assert r.json()["data_dampak_belum_lengkap"]

    r = client.post(f"/api/driver/tugas/{kode}/data", headers=andi, json={"km_aktual": 105, "bbm_liter": 13})
    assert r.status_code == 200 and r.json()["km_aktual"] == 105
    assert client.post(f"/api/driver/tugas/{kode}/data", headers=andi, json={}).status_code == 409

    r = client.post(
        f"/api/distributor/pengiriman/{kode}/penerimaan",
        headers=budi,
        json={"berat_terima_kg": 588, "berat_ditolak_kg": 10, "alasan_tolak_mutu": "busuk"},
    )
    # susut = muat − (terima + ditolak) = 600 − 598 = 2 kg
    assert r.status_code == 200 and r.json()["susut_persen"] == 0.33
    psn = client.get("/api/distributor/pesanan", headers=budi).json()[0]
    assert psn["status"] == "selesai" and psn["pengiriman"]["berat_terima_kg"] == 588 and psn["pengiriman"]["driver_nama"] == "Andi Pratama"
    kirim = db.scalar(select(Pengiriman).where(Pengiriman.kode == kode))
    db.refresh(kirim)
    assert kirim.km_aktual == 105 and kirim.bbm_liter == 13 and kirim.berat_terima_kg == 588


def test_distributor_batalkan_pesanan_melepas_kunci(client, db):
    lap = _stok(db, 500)
    budi = _hdr(db, BUDI)
    pid = client.post("/api/distributor/pesanan", headers=budi, json={"laporan_id": lap.id, "jumlah_kg": 300}).json()["pesanan_id"]
    db.refresh(lap)
    assert lap.sisa_kg == 200
    r = client.post(f"/api/distributor/pesanan/{pid}/batal", headers=budi)
    assert r.status_code == 200 and r.json()["status"] == "dibatalkan"
    db.refresh(lap)
    assert lap.sisa_kg == 500 and lap.status == "tersedia"
    # pesanan distributor lain tidak terlihat / tidak bisa dibatalkan
    lain = User(email="dist2@contoh.id", password_hash="x", name="Dist 2", role="distributor", verification_status="disetujui")
    db.add(lain)
    db.commit()
    assert client.get("/api/distributor/pesanan", headers=_hdr(db, user=lain)).json() == []
    assert client.post(f"/api/distributor/pesanan/{pid}/batal", headers=_hdr(db, user=lain)).status_code == 409


# ---------------- Perjalanan & cari muatan ----------------


def test_driver_perjalanan_dan_ambil_muatan(client, db):
    andi = _hdr(db, ANDI)
    awal = client.get("/api/driver/perjalanan", headers=andi).json()
    assert len(awal) == 1 and awal[0]["asal"] == "Curup"

    r = client.post("/api/driver/perjalanan", headers=andi, json={"asal": "curup", "tujuan": "bengkulu", "tanggal": "besok", "kapasitas_kg": 1500})
    assert r.status_code == 201
    baru = r.json()["perjalanan_id"]
    assert client.post("/api/driver/perjalanan", headers=andi, json={"asal": "Atlantis", "tujuan": "bengkulu"}).status_code == 409
    assert client.post("/api/driver/perjalanan", headers=andi, json={"asal": "curup", "tujuan": "bengkulu", "kapasitas_kg": 9000}).status_code == 409

    r = client.post(f"/api/driver/perjalanan/{baru}/batal", headers=andi)
    assert r.status_code == 200 and r.json()["status"] == "dibatalkan"
    assert client.post(f"/api/driver/perjalanan/{baru}/batal", headers=andi).status_code == 409

    # Order yang perlu petugas (tanpa penawaran aktif) bisa diambil sendiri
    lap = _stok(db, 500)
    pid = client.post("/api/distributor/pesanan", headers=_hdr(db, BUDI), json={"laporan_id": lap.id, "jumlah_kg": 500}).json()["pesanan_id"]
    aksi(db, SLAMET, "terima_pesanan", {"pesanan_id": pid})
    kirim = db.scalar(select(Pengiriman))
    pen = db.scalar(select(Penawaran).where(Penawaran.pengiriman_id == kirim.id, Penawaran.status == "ditawarkan"))
    pen.status = "kedaluwarsa"
    kirim.status = "perlu_admin"
    db.commit()

    muatan = client.get("/api/driver/muatan", headers=andi).json()["muatan"]
    assert [m["kode"] for m in muatan] == [kirim.kode]
    r = client.post(f"/api/driver/muatan/{kirim.kode}/ambil", headers=andi)
    assert r.status_code == 200 and r.json()["status"] == "diambil"
    assert db.scalar(select(Pesanan)).status in ("menunggu_angkutan", "dalam_pengiriman")


# ---------------- Profil & verifikasi ----------------


def test_profil_mitra_lalu_disetujui_admin(client, db, admin_headers):
    user, hdr = _register(client)
    assert client.get("/api/auth/me", headers=hdr).json()["verification_status"] == "belum"

    data = {"phone": "0812 7777 6666", "jenis_kendaraan": "Pikap", "plat_nomor": "bd 1234 xy", "kapasitas_kg": 1200, "komoditas_cocok": ["kol"]}
    assert client.post("/api/akun/profil", headers=hdr, json={**data, "plat_nomor": None}).status_code == 422
    assert client.post("/api/akun/profil", headers=hdr, json={**data, "phone": SLAMET}).status_code == 409, "nomor petani tidak boleh dipakai"
    assert client.post("/api/akun/profil", headers=hdr, json={**data, "komoditas_cocok": ["durian"]}).status_code == 422

    r = client.post("/api/akun/profil", headers=hdr, json=data)
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["verification_status"] == "menunggu" and me["phone"] == "6281277776666"
    assert me["plat_nomor"] == "BD 1234 XY" and me["komoditas_cocok"] == ["Kubis"]
    assert client.get("/api/driver/penawaran", headers=hdr).status_code == 403, "belum disetujui"

    client.patch(f"/api/admin/users/{user['id']}/verification", params={"status": "disetujui"}, headers=admin_headers)
    assert client.get("/api/driver/penawaran", headers=hdr).status_code == 200
    assert client.post("/api/akun/profil", headers=hdr, json=data).status_code == 409, "data terverifikasi diubah lewat petugas"


def test_profil_distributor_wajib_nama_usaha(client):
    _, hdr = _register(client, "distributor", "toko@contoh.id")
    assert client.post("/api/akun/profil", headers=hdr, json={"phone": "081355554444"}).status_code == 422
    r = client.post("/api/akun/profil", headers=hdr, json={"phone": "081355554444", "nama_usaha": "UD Sayur Segar"})
    assert r.status_code == 200 and r.json()["nama_usaha"] == "UD Sayur Segar" and r.json()["verification_status"] == "menunggu"
