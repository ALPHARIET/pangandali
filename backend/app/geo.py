"""Lokasi dan tabel jarak (km) yang diisi Admin. Gratis, tanpa API peta.

Jarak berlaku dua arah. Jarak yang belum diisi dikembalikan sebagai None dan
pemanggil wajib menandainya "belum diketahui", bukan menebak.
"""
import difflib
import re

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .models import Jarak, Lokasi


def _norm(s: str) -> str:
    s = s.lower()
    s = re.sub(r"\b(desa|ds|kel|kelurahan|kec|kecamatan|kab|kabupaten|kota)\b\.?", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def cari_lokasi(db: Session, teks: str | None) -> Lokasi | None:
    """Cocokkan teks bebas ("ds lubuk ubar", "pasar panorama bengkulu") ke Lokasi terdaftar."""
    if not teks:
        return None
    t = _norm(teks)
    if not t:
        return None
    semua = db.scalars(select(Lokasi)).all()
    kandidat: dict[str, Lokasi] = {}
    for lok in semua:
        for nama in [lok.nama, *(lok.alias or [])]:
            kandidat[_norm(nama)] = lok
    if t in kandidat:
        return kandidat[t]
    # Nama lokasi yang muncul utuh di dalam teks (pilih yang terpanjang supaya "kampung baru" > "baru").
    cocok = [(k, v) for k, v in kandidat.items() if k and re.search(rf"\b{re.escape(k)}\b", t)]
    if cocok:
        return max(cocok, key=lambda kv: len(kv[0]))[1]
    hit = difflib.get_close_matches(t, kandidat.keys(), n=1, cutoff=0.82)
    return kandidat[hit[0]] if hit else None


def jarak_km(db: Session, a: Lokasi | int | None, b: Lokasi | int | None) -> float | None:
    if a is None or b is None:
        return None
    ida = a if isinstance(a, int) else a.id
    idb = b if isinstance(b, int) else b.id
    if ida == idb:
        return 0.0
    row = db.scalar(
        select(Jarak).where(
            or_((Jarak.asal_id == ida) & (Jarak.tujuan_id == idb), (Jarak.asal_id == idb) & (Jarak.tujuan_id == ida))
        )
    )
    return row.km if row else None


def tambahan_jarak(db: Session, asal, jemput, antar, tujuan) -> dict:
    """Deviasi perjalanan balik: asal → jemput → antar → tujuan, dibanding asal → tujuan langsung.

    Mengembalikan km_rute (dengan jemput), km_langsung, km_deviasi; nilai None bila ada ruas belum diisi.
    """
    ruas = [jarak_km(db, asal, jemput), jarak_km(db, jemput, antar), jarak_km(db, antar, tujuan)]
    langsung = jarak_km(db, asal, tujuan)
    if any(r is None for r in ruas) or langsung is None:
        kurang = []
        pasangan = [(asal, jemput), (jemput, antar), (antar, tujuan), (asal, tujuan)]
        for (x, y), v in zip(pasangan, [*ruas, langsung]):
            if v is None:
                kurang.append(f"{_nama(x)} - {_nama(y)}")
        return {"km_rute": None, "km_langsung": langsung, "km_deviasi": None, "jarak_belum_diisi": kurang}
    rute = round(sum(ruas), 1)
    return {"km_rute": rute, "km_langsung": langsung, "km_deviasi": round(max(0.0, rute - langsung), 1), "jarak_belum_diisi": []}


def _nama(x) -> str:
    return x.nama if isinstance(x, Lokasi) else str(x)
