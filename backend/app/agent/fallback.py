"""Ekstraksi rule-based (port ringkas dari sim-wa) untuk dipakai saat LLM gangguan."""
import re
from datetime import date

from ..normalize import normalisasi_komoditas, normalisasi_satuan, normalisasi_tanggal

_ANGKA_SATUAN = re.compile(r"(\d+(?:[.,]\d+)?)\s*([a-zA-Z']+)")
_DESA = re.compile(r"\b(?:desa|ds\.?|dusun)\s+([a-z]+(?:\s+[a-z]+){0,2})", re.I)
_DESA_PILOT = ("lubuk ubar", "kampung baru", "air putih lama", "mekar sari")
_KATA_HENTI = {"siap", "harga", "panen", "mau", "besok", "lusa", "hari", "ini", "tgl", "tanggal", "kg", "kilo"}


def ekstrak_laporan(teks: str, today: date | None = None) -> dict | None:
    t = teks.lower()
    komoditas = normalisasi_komoditas(t)
    if not komoditas:
        return None
    jumlah = satuan = None
    for m in _ANGKA_SATUAN.finditer(t):
        s = normalisasi_satuan(m.group(2))
        if s:
            jumlah = float(m.group(1).replace(",", "."))
            satuan = s
            break
    if jumlah is None:
        return None
    desa = next((d.title() for d in _DESA_PILOT if d in t), None)
    if not desa:
        m = _DESA.search(t)
        if m:
            kata = [w for w in m.group(1).split() if w not in _KATA_HENTI]
            desa = " ".join(kata).title() or None
    tgl = normalisasi_tanggal(t, today=today)
    return {"komoditas": komoditas, "jumlah": jumlah, "satuan": satuan, "desa": desa, "tanggal_panen": tgl}
