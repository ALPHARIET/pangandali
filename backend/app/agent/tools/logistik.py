from datetime import date, datetime, timezone

from sqlalchemy import func, select

from ...audit import catat
from ...geo import cari_lokasi, tambahan_jarak
from ...matching import fmt_kg, kabari_pihak, keandalan, penawaran_aktif, tawarkan_berikutnya, terima_penawaran, tolak_penawaran
from ...models import Lokasi, Penawaran, Pengiriman, Perjalanan
from ...normalize import hari_ini, normalisasi_tanggal
from ...operasional import get_operasional
from .base import ToolContext, ToolError, obj, tool

DRIVER = ("driver",)
# Urutan status yang boleh dilewati driver (hanya maju).
ALUR = ["diambil", "menuju_jemput", "sampai_jemput", "dimuat", "dalam_perjalanan", "selesai"]
LABEL_STATUS = {
    "diambil": "sudah diambil mitra logistik",
    "menuju_jemput": "driver sedang menuju titik jemput",
    "sampai_jemput": "driver sudah sampai di titik jemput",
    "dimuat": "barang sudah dimuat",
    "dalam_perjalanan": "barang dalam perjalanan",
    "selesai": "barang sudah sampai tujuan",
}


def _driver(ctx: ToolContext):
    if ctx.actor.role != "driver" or ctx.actor.user is None:
        raise ToolError("Tool ini khusus mitra logistik.")
    u = ctx.actor.user
    if u.verification_status != "disetujui":
        raise ToolError("Akun mitra logistik belum diverifikasi admin, belum bisa menerima muatan.")
    return u


def _lokasi_wajib(ctx: ToolContext, teks: str | None, label: str) -> Lokasi:
    lok = cari_lokasi(ctx.db, teks)
    if lok is None:
        daftar = ", ".join(l.nama for l in ctx.db.scalars(select(Lokasi).order_by(Lokasi.nama)).all()[:15])
        raise ToolError(f"Lokasi {label} '{teks}' belum terdaftar. Lokasi yang dikenal: {daftar or '-'}.")
    return lok


def _cari_kirim(ctx: ToolContext, kode) -> Pengiriman:
    k = (str(kode or "")).strip().upper()
    if k.isdigit():
        k = f"TRK-{k}"
    kirim = ctx.db.scalar(select(Pengiriman).where(Pengiriman.kode == k))
    if kirim is None:
        raise ToolError(f"Order {kode} tidak ditemukan.")
    return kirim


def _tugas_milik(ctx: ToolContext, kode) -> Pengiriman:
    u = _driver(ctx)
    k = _cari_kirim(ctx, kode)
    if k.driver_id != u.id:
        raise ToolError(f"Order {k.kode} bukan tugas driver ini.")
    return k


# ---------------- Perjalanan ----------------


def _prep_perjalanan(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    asal = _lokasi_wajib(ctx, args.get("asal"), "asal")
    tujuan = _lokasi_wajib(ctx, args.get("tujuan"), "tujuan")
    tgl = normalisasi_tanggal(args.get("tanggal") or "hari ini")
    if tgl is None:
        raise ToolError("Tanggal perjalanan tidak bisa dipahami.")
    if tgl < hari_ini():
        raise ToolError("Tanggal perjalanan sudah lewat.")
    kap = args.get("kapasitas_kg") or u.kapasitas_kg
    try:
        kap = float(kap)
    except (TypeError, ValueError):
        raise ToolError("Sisa kapasitas truk (kg) belum diketahui. Tanyakan ke driver.") from None
    if kap <= 0 or (u.kapasitas_kg and kap > u.kapasitas_kg):
        raise ToolError(f"Kapasitas tidak masuk akal (maks. armada {fmt_kg(u.kapasitas_kg)}).")
    balik = args.get("perjalanan_balik")
    balik = True if balik is None else bool(balik)
    d = {"asal_id": asal.id, "tujuan_id": tujuan.id, "tanggal": tgl.isoformat(), "kapasitas_kg": kap, "balik": balik}
    jenis = "perjalanan balik (kosong)" if balik else "perjalanan"
    return f"Umumkan {jenis} {asal.nama} ke {tujuan.nama} tanggal {tgl.isoformat()}, sisa kapasitas {fmt_kg(kap)}", d


@tool(
    "umumkan_perjalanan",
    "Mitra logistik mengumumkan perjalanan (terutama perjalanan pulang yang kosong) supaya bisa direkomendasikan muatan balik. "
    "Butuh konfirmasi.",
    obj(
        {
            "asal": {"type": "string", "description": "Titik berangkat, mis. Curup"},
            "tujuan": {"type": "string", "description": "Tujuan akhir, mis. Kota Bengkulu"},
            "tanggal": {"type": "string", "description": "Kapan berangkat: hari ini, besok, kamis, 20/10"},
            "kapasitas_kg": {"type": "number", "description": "Sisa kapasitas truk dalam kg"},
            "perjalanan_balik": {"type": "boolean", "description": "true bila ini perjalanan pulang yang biasanya kosong"},
        },
        ["asal", "tujuan"],
    ),
    DRIVER,
    prepare=_prep_perjalanan,
)
def umumkan_perjalanan(ctx: ToolContext, d: dict):
    u = _driver(ctx)
    perj = Perjalanan(
        driver_id=u.id,
        asal_lokasi_id=d["asal_id"],
        tujuan_lokasi_id=d["tujuan_id"],
        tanggal=date.fromisoformat(d["tanggal"]),
        kapasitas_tersedia_kg=d["kapasitas_kg"],
        is_balik=d["balik"],
    )
    ctx.db.add(perj)
    ctx.db.flush()
    # Order yang tadinya tidak punya kandidat dicoba dicocokkan lagi dengan perjalanan baru ini.
    dicoba = 0
    for kirim in ctx.db.scalars(select(Pengiriman).where(Pengiriman.status.in_(("menunggu_driver", "perlu_admin")))).all():
        if penawaran_aktif(ctx.db, kirim) is None:
            tawarkan_berikutnya(ctx.db, kirim, ctx.notify)
            dicoba += 1
    return {"perjalanan_id": perj.id, "status": perj.status, "order_dicocokkan_ulang": dicoba}


@tool("lihat_perjalanan_saya", "Lihat perjalanan aktif driver beserta sisa kapasitasnya.", obj({}), DRIVER)
def lihat_perjalanan_saya(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    rows = ctx.db.scalars(select(Perjalanan).where(Perjalanan.driver_id == u.id).order_by(Perjalanan.id.desc()).limit(10)).all()
    return {
        "perjalanan": [
            {
                "perjalanan_id": p.id,
                "asal": p.asal.nama,
                "tujuan": p.tujuan.nama,
                "tanggal": p.tanggal.isoformat(),
                "sisa_kapasitas_kg": p.kapasitas_tersedia_kg,
                "status": p.status,
            }
            for p in rows
        ]
    }


def _prep_batal_perjalanan(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    perj = ctx.db.get(Perjalanan, int(args.get("perjalanan_id") or 0))
    if perj is None or perj.driver_id != u.id or perj.status != "aktif":
        raise ToolError("Perjalanan aktif itu tidak ditemukan.")
    ada_muatan = ctx.db.scalar(
        select(func.count()).where(Pengiriman.perjalanan_id == perj.id, Pengiriman.status.not_in(("selesai", "dibatalkan")))
    )
    if ada_muatan:
        raise ToolError("Perjalanan ini sudah membawa order; pembatalan harus lewat petugas.")
    return f"Batalkan perjalanan #{perj.id} ({perj.asal.nama} ke {perj.tujuan.nama}, {perj.tanggal.isoformat()})", {"perjalanan_id": perj.id}


@tool(
    "batalkan_perjalanan",
    "Batalkan perjalanan yang sudah diumumkan dan belum membawa order. Butuh konfirmasi.",
    obj({"perjalanan_id": {"type": "integer"}}, ["perjalanan_id"]),
    DRIVER,
    prepare=_prep_batal_perjalanan,
)
def batalkan_perjalanan(ctx: ToolContext, d: dict):
    perj = ctx.db.get(Perjalanan, d["perjalanan_id"])
    perj.status = "dibatalkan"
    for pen in ctx.db.scalars(select(Penawaran).where(Penawaran.perjalanan_id == perj.id, Penawaran.status == "ditawarkan")).all():
        pen.status = "dibatalkan"
        tawarkan_berikutnya(ctx.db, pen.pengiriman, ctx.notify)
    return {"perjalanan_id": perj.id, "status": perj.status}


# ---------------- Penawaran ----------------


def _penawaran_milik(ctx: ToolContext, args: dict) -> Penawaran:
    u = _driver(ctx)
    q = select(Penawaran).where(Penawaran.driver_id == u.id, Penawaran.status == "ditawarkan")
    if args.get("penawaran_id"):
        q = q.where(Penawaran.id == int(args["penawaran_id"]))
    elif args.get("kode"):
        q = q.join(Pengiriman).where(Pengiriman.kode == _cari_kirim(ctx, args["kode"]).kode)
    rows = ctx.db.scalars(q).all()
    if not rows:
        raise ToolError("Tidak ada penawaran aktif yang cocok untuk driver ini.")
    if len(rows) > 1:
        raise ToolError("Ada beberapa penawaran aktif; tanyakan kode order yang dimaksud.")
    return rows[0]


@tool("lihat_penawaran", "Lihat rekomendasi muatan balik yang sedang ditawarkan ke driver ini.", obj({}), DRIVER)
def lihat_penawaran(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    rows = ctx.db.scalars(select(Penawaran).where(Penawaran.driver_id == u.id, Penawaran.status == "ditawarkan")).all()
    return {
        "penawaran": [
            {
                "penawaran_id": p.id,
                "kode": p.pengiriman.kode,
                "komoditas": p.pengiriman.laporan.komoditas,
                "jumlah_kg": p.pengiriman.jumlah_kg,
                "jemput": p.pengiriman.asal,
                "antar": p.pengiriman.tujuan,
                "tambahan_km": (p.detail or {}).get("km_deviasi"),
                "skor": p.skor,
                "berlaku_sampai": p.expires_at.isoformat() if p.expires_at else None,
            }
            for p in rows
        ]
    }


def _prep_terima_penawaran(ctx: ToolContext, args: dict):
    pen = _penawaran_milik(ctx, args)
    k = pen.pengiriman
    return (
        f"Terima order {k.kode}: {k.laporan.komoditas} {fmt_kg(k.jumlah_kg)}, jemput di {k.asal}, antar ke {k.tujuan}",
        {"penawaran_id": pen.id},
    )


@tool(
    "terima_penawaran",
    "Driver menyetujui rekomendasi muatan. Baru menjadi penugasan setelah ini. Butuh konfirmasi.",
    obj({"penawaran_id": {"type": "integer"}, "kode": {"type": "string"}}),
    DRIVER,
    prepare=_prep_terima_penawaran,
)
def terima_penawaran_tool(ctx: ToolContext, d: dict):
    pen = ctx.db.get(Penawaran, d["penawaran_id"])
    if pen is None or pen.status != "ditawarkan":
        raise ToolError("Penawaran ini sudah tidak berlaku (mungkin sudah lewat batas waktu).")
    kirim = terima_penawaran(ctx.db, pen, ctx.notify)
    return {"kode": kirim.kode, "status": kirim.status, "jemput": kirim.asal, "tujuan": kirim.tujuan}


@tool(
    "tolak_penawaran",
    "Driver menolak rekomendasi muatan; sistem meneruskan ke kandidat berikutnya. Langsung diproses tanpa konfirmasi.",
    obj({"penawaran_id": {"type": "integer"}, "kode": {"type": "string"}, "alasan": {"type": "string"}}),
    DRIVER,
)
def tolak_penawaran_tool(ctx: ToolContext, args: dict):
    pen = _penawaran_milik(ctx, args)
    kode = pen.pengiriman.kode
    tolak_penawaran(ctx.db, pen, (args.get("alasan") or "").strip(), ctx.notify)
    return {"kode": kode, "status": "ditolak"}


# ---------------- Cari & ambil muatan sendiri ----------------


@tool(
    "cari_muatan_balik",
    "Cari order yang menunggu armada dan cocok dengan perjalanan aktif driver, diurutkan skor kecocokan "
    "(tambahan jarak, tingkat isian, keandalan).",
    obj({"kapasitas_kg": {"type": "number", "description": "Sisa kapasitas truk dalam kg bila belum mengumumkan perjalanan"}}),
    DRIVER,
)
def cari_muatan_balik(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    op = get_operasional(ctx.db)
    trips = ctx.db.scalars(select(Perjalanan).where(Perjalanan.driver_id == u.id, Perjalanan.status == "aktif")).all()
    andal = keandalan(ctx.db, u.id)
    hasil = []
    for k in ctx.db.scalars(select(Pengiriman).where(Pengiriman.status.in_(("menunggu_driver", "perlu_admin")))).all():
        aktif = penawaran_aktif(ctx.db, k)
        if aktif and aktif.driver_id != u.id:
            continue  # sedang ditawarkan ke kandidat lain
        if u.komoditas_cocok and k.laporan.komoditas not in u.komoditas_cocok:
            continue
        terbaik = None
        for perj in trips or [None]:
            kap = perj.kapasitas_tersedia_kg if perj else (args.get("kapasitas_kg") or u.kapasitas_kg)
            if not kap or k.jumlah_kg > kap:
                continue
            if perj and ((k.jemput_mulai and perj.tanggal < k.jemput_mulai) or (k.jemput_sampai and perj.tanggal > k.jemput_sampai)):
                continue
            dev = tambahan_jarak(ctx.db, perj.asal, k.jemput_lokasi, k.tujuan_lokasi, perj.tujuan) if perj else {"km_deviasi": None}
            if dev["km_deviasi"] is not None and dev["km_deviasi"] > op.maks_deviasi_km:
                continue
            s_jarak = 0.3 if dev["km_deviasi"] is None else 1 - min(dev["km_deviasi"] / op.maks_deviasi_km, 1.0)
            skor = round(100 * (0.5 * s_jarak + 0.3 * min(1.0, k.jumlah_kg / kap) + 0.2 * andal), 1)
            if terbaik is None or skor > terbaik["skor_kecocokan"]:
                terbaik = {
                    "kode": k.kode,
                    "komoditas": k.laporan.komoditas,
                    "jumlah_kg": k.jumlah_kg,
                    "asal": k.asal,
                    "tujuan": k.tujuan,
                    "jemput_paling_lambat": k.jemput_sampai.isoformat() if k.jemput_sampai else None,
                    "tambahan_km": dev["km_deviasi"],
                    "perjalanan_id": perj.id if perj else None,
                    "skor_kecocokan": skor,
                }
        if terbaik:
            hasil.append(terbaik)
    hasil.sort(key=lambda x: x["skor_kecocokan"], reverse=True)
    catatan = None if trips else "Driver belum mengumumkan perjalanan; skor jarak belum bisa dihitung. Sarankan umumkan perjalanan."
    return {"muatan": hasil[:5], "catatan": catatan}


def _prep_ambil(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    k = _cari_kirim(ctx, args.get("kode"))
    if k.status not in ("menunggu_driver", "perlu_admin"):
        raise ToolError(f"Order {k.kode} sudah tidak tersedia (status {k.status}).")
    aktif = penawaran_aktif(ctx.db, k)
    if aktif and aktif.driver_id != u.id:
        raise ToolError(f"Order {k.kode} sedang ditawarkan ke mitra lain; tunggu sampai dilepas.")
    if u.kapasitas_kg and k.jumlah_kg > u.kapasitas_kg:
        raise ToolError(f"Muatan {fmt_kg(k.jumlah_kg)} melebihi kapasitas armada {fmt_kg(u.kapasitas_kg)}.")
    return (
        f"Ambil order {k.kode}: {k.laporan.komoditas} {fmt_kg(k.jumlah_kg)}, jemput di {k.asal}, antar ke {k.tujuan}",
        {"kode": k.kode, "perjalanan_id": args.get("perjalanan_id")},
    )


@tool(
    "ambil_muatan",
    "Driver mengajukan diri mengambil order dari hasil cari_muatan_balik. Butuh konfirmasi.",
    obj({"kode": {"type": "string"}, "perjalanan_id": {"type": "integer"}}, ["kode"]),
    DRIVER,
    prepare=_prep_ambil,
)
def ambil_muatan(ctx: ToolContext, d: dict):
    u = _driver(ctx)
    k = _cari_kirim(ctx, d["kode"])
    # Cek ulang saat eksekusi: bisa saja sudah diambil/ditawarkan ke driver lain selama menunggu konfirmasi.
    aktif = penawaran_aktif(ctx.db, k)
    if k.status not in ("menunggu_driver", "perlu_admin") or (aktif and aktif.driver_id != u.id):
        raise ToolError(f"Maaf, order {k.kode} baru saja diambil atau ditawarkan ke mitra lain.")
    perj = ctx.db.get(Perjalanan, d["perjalanan_id"]) if d.get("perjalanan_id") else None
    if perj is not None and (perj.driver_id != u.id or perj.status != "aktif" or perj.kapasitas_tersedia_kg < k.jumlah_kg):
        perj = None
    if perj is None:
        perj = ctx.db.scalars(
            select(Perjalanan).where(
                Perjalanan.driver_id == u.id, Perjalanan.status == "aktif", Perjalanan.kapasitas_tersedia_kg >= k.jumlah_kg
            ).order_by(Perjalanan.tanggal)
        ).first()
    dev = tambahan_jarak(ctx.db, perj.asal, k.jemput_lokasi, k.tujuan_lokasi, perj.tujuan) if perj else {}
    if aktif is None:
        urutan = (ctx.db.scalar(select(func.count()).where(Penawaran.pengiriman_id == k.id)) or 0) + 1
        aktif = Penawaran(
            pengiriman_id=k.id,
            driver_id=u.id,
            perjalanan_id=perj.id if perj else None,
            urutan=urutan,
            skor=0,
            detail={**{key: dev.get(key) for key in ("km_rute", "km_deviasi", "km_langsung")}, "diambil_sendiri": True},
        )
        ctx.db.add(aktif)
        ctx.db.flush()
    kirim = terima_penawaran(ctx.db, aktif, ctx.notify)
    return {"kode": kirim.kode, "status": kirim.status, "jemput": kirim.asal, "tujuan": kirim.tujuan}


# ---------------- Status & data dampak ----------------


def _angka_opsional(args: dict, key: str, maks: float) -> float | None:
    v = args.get(key)
    if v in (None, ""):
        return None
    try:
        v = float(v)
    except (TypeError, ValueError):
        raise ToolError(f"{key} harus angka.") from None
    if not 0 <= v <= maks:
        raise ToolError(f"{key} tidak masuk akal.")
    return v


@tool(
    "update_status_pengiriman",
    "Perbarui status pengiriman milik driver. Status hanya boleh maju: menuju_jemput, sampai_jemput, dimuat, "
    "dalam_perjalanan, selesai. Saat 'dimuat' sertakan berat_muat_kg hasil timbang bila ada. "
    "Langsung diproses tanpa konfirmasi supaya update di jalan cepat.",
    obj(
        {
            "kode": {"type": "string"},
            "status": {"type": "string", "enum": ALUR[1:]},
            "berat_muat_kg": {"type": "number"},
        },
        ["kode", "status"],
    ),
    DRIVER,
)
def update_status_pengiriman(ctx: ToolContext, args: dict):
    k = _tugas_milik(ctx, args.get("kode"))
    status = args.get("status")
    if status not in ALUR[1:]:
        raise ToolError(f"Status '{status}' tidak dikenal.")
    if k.status not in ALUR or ALUR.index(status) <= ALUR.index(k.status):
        raise ToolError(f"Status order {k.kode} sekarang '{k.status}', tidak bisa mundur ke '{status}'.")
    berat = _angka_opsional(args, "berat_muat_kg", 100_000)
    now = datetime.now(timezone.utc)
    k.status = status
    lap = k.laporan
    if status in ("dimuat", "dalam_perjalanan", "selesai") and k.waktu_muat is None:
        k.waktu_muat = now
    if berat is not None:
        k.berat_muat_kg = berat
    if status in ("dalam_perjalanan", "selesai") and k.waktu_berangkat is None:
        k.waktu_berangkat = now
    if status == "dimuat":
        if lap.status in ("tersedia", "dipesan") and not lap.sisa_kg:
            lap.status = "diangkut"
        if k.pesanan:
            k.pesanan.status = "dalam_pengiriman"
    if status == "selesai":
        if k.waktu_terima is None:
            k.waktu_terima = now
        if k.pesanan:
            k.pesanan.status = "selesai"
        lain = ctx.db.scalars(
            select(Pengiriman).where(Pengiriman.laporan_id == lap.id, Pengiriman.status.not_in(("selesai", "dibatalkan")), Pengiriman.id != k.id)
        ).all()
        if not lap.sisa_kg and not lain:
            lap.status = "selesai"
        if k.perjalanan:
            terbuka = ctx.db.scalar(
                select(func.count()).where(
                    Pengiriman.perjalanan_id == k.perjalanan_id, Pengiriman.status.not_in(("selesai", "dibatalkan")), Pengiriman.id != k.id
                )
            )
            if not terbuka:
                k.perjalanan.status = "selesai"
    catat(ctx.db, ctx.actor.aktor, "update_status_pengiriman", "pengiriman", k.id, {"status": status, "berat_muat_kg": berat})
    kabari_pihak(k, ctx.notify, f"Update {k.kode}: {LABEL_STATUS[status]}.")
    perlu = []
    if status in ("dimuat", "dalam_perjalanan") and k.berat_muat_kg is None:
        perlu.append("berat_muat_kg")
    if status == "selesai" and (k.km_aktual is None or k.bbm_liter is None):
        perlu.append("km_aktual dan bbm_liter (pakai catat_data_perjalanan)")
    return {"kode": k.kode, "status": k.status, "data_dampak_belum_lengkap": perlu}


def _prep_data_perjalanan(ctx: ToolContext, args: dict):
    k = _tugas_milik(ctx, args.get("kode"))
    d = {
        "kode": k.kode,
        "km_aktual": _angka_opsional(args, "km_aktual", 5000),
        "bbm_liter": _angka_opsional(args, "bbm_liter", 2000),
        "berat_muat_kg": _angka_opsional(args, "berat_muat_kg", 100_000),
    }
    if all(v is None for key, v in d.items() if key != "kode"):
        raise ToolError("Belum ada angka yang dicatat. Tanyakan km tempuh, BBM terpakai, atau berat muat.")
    bagian = []
    if d["km_aktual"] is not None:
        bagian.append(f"jarak tempuh {d['km_aktual']:g} km")
    if d["bbm_liter"] is not None:
        bagian.append(f"BBM {d['bbm_liter']:g} liter")
    if d["berat_muat_kg"] is not None:
        bagian.append(f"berat muat {fmt_kg(d['berat_muat_kg'])}")
    return f"Catat data perjalanan {k.kode}: " + ", ".join(bagian), d


@tool(
    "catat_data_perjalanan",
    "Catat data pengukuran dampak dari driver: km tempuh total perjalanan (odometer), BBM terpakai (liter), "
    "dan berat muat. Butuh konfirmasi. Jangan menebak angka.",
    obj(
        {
            "kode": {"type": "string"},
            "km_aktual": {"type": "number", "description": "Total km perjalanan termasuk belok menjemput"},
            "bbm_liter": {"type": "number"},
            "berat_muat_kg": {"type": "number"},
        },
        ["kode"],
    ),
    DRIVER,
    prepare=_prep_data_perjalanan,
)
def catat_data_perjalanan(ctx: ToolContext, d: dict):
    k = _tugas_milik(ctx, d["kode"])
    for key in ("km_aktual", "bbm_liter", "berat_muat_kg"):
        if d.get(key) is not None:
            setattr(k, key, d[key])
    return {"kode": k.kode, "km_aktual": k.km_aktual, "bbm_liter": k.bbm_liter, "berat_muat_kg": k.berat_muat_kg}


@tool("lihat_tugas_saya", "Lihat order pengiriman yang sedang/pernah dipegang driver ini.", obj({}), DRIVER)
def lihat_tugas_saya(ctx: ToolContext, args: dict):
    u = _driver(ctx)
    rows = ctx.db.scalars(select(Pengiriman).where(Pengiriman.driver_id == u.id).order_by(Pengiriman.id.desc()).limit(10)).all()
    return {
        "tugas": [
            {
                "kode": k.kode,
                "komoditas": k.laporan.komoditas,
                "jumlah_kg": k.jumlah_kg,
                "asal": k.asal,
                "tujuan": k.tujuan,
                "status": k.status,
                "berat_muat_kg": k.berat_muat_kg,
                "km_aktual": k.km_aktual,
                "bbm_liter": k.bbm_liter,
            }
            for k in rows
        ]
    }

