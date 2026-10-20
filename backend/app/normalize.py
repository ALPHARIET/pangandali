"""Normalisasi di sisi server: komoditas, satuan lokal, tanggal relatif.

Dipakai oleh tools agent (LLM boleh salah eja, server yang memutuskan nilai final)
dan oleh ekstraksi fallback rule-based saat LLM gangguan.
"""
import difflib
import json
import re
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from .config import get_settings

KOMODITAS = ("Cabai Besar", "Kubis", "Terung", "Wortel", "Kembang Kol", "Tomat")

# Urutan penting: frasa dua kata dicek dulu, supaya "kembang kol" tidak jatuh ke "kol" (= Kubis).
_FRASA_KOMODITAS = [
    ("kembang kol", "Kembang Kol"),
    ("bunga kol", "Kembang Kol"),
    ("kol bunga", "Kembang Kol"),
    ("kembangkol", "Kembang Kol"),
    ("cabai merah besar", "Cabai Besar"),
    ("cabe merah besar", "Cabai Besar"),
    ("cabai besar", "Cabai Besar"),
    ("cabe besar", "Cabai Besar"),
    ("cabai merah", "Cabai Besar"),
    ("cabe merah", "Cabai Besar"),
]
_KATA_KOMODITAS = {
    "cabai": "Cabai Besar",
    "cabe": "Cabai Besar",
    "lado": "Cabai Besar",
    "kubis": "Kubis",
    "kol": "Kubis",
    "kobis": "Kubis",
    "terung": "Terung",
    "terong": "Terung",
    "wortel": "Wortel",
    "wortol": "Wortel",
    "tomat": "Tomat",
}
# Varietas yang belum didukung pilot; jangan dipetakan ke Cabai Besar.
_TIDAK_DIDUKUNG = ("rawit", "keriting")


def normalisasi_komoditas(teks: str | None) -> str | None:
    if not teks:
        return None
    t = re.sub(r"\s+", " ", teks.lower()).strip()
    if any(x in t for x in _TIDAK_DIDUKUNG):
        return None
    for nama in KOMODITAS:
        if t == nama.lower():
            return nama
    for frasa, nama in _FRASA_KOMODITAS:
        if frasa in t:
            return nama
    for tok in re.findall(r"[a-z]+", t):
        if tok in _KATA_KOMODITAS:
            return _KATA_KOMODITAS[tok]
    for tok in re.findall(r"[a-z]+", t):
        if len(tok) < 4:
            continue
        hit = difflib.get_close_matches(tok, _KATA_KOMODITAS.keys(), n=1, cutoff=0.8)
        if hit:
            return _KATA_KOMODITAS[hit[0]]
    return None


# Hanya satuan baku yang dikonversi otomatis. Satuan lokal (karung, pikul, ikat) beratnya beragam,
# sehingga sesuai proposal tidak dikonversi tanpa kesepakatan dengan petani.
KONVERSI_BAKU = {"kg": 1.0, "ton": 1000.0, "kwintal": 100.0}
SATUAN_LOKAL = {"karung", "pikul", "ikat"}
_ALIAS_SATUAN = {
    "kg": "kg", "kilo": "kg", "kilogram": "kg", "kilogeram": "kg", "kgs": "kg",
    "ton": "ton", "tn": "ton",
    "kwintal": "kwintal", "kuintal": "kwintal", "kw": "kwintal", "kwt": "kwintal", "kintal": "kwintal",
    "karung": "karung", "krg": "karung", "karong": "karung",
    "pikul": "pikul", "pikol": "pikul",
    "ikat": "ikat", "iket": "ikat",
}


def normalisasi_satuan(teks: str | None) -> str | None:
    if not teks:
        return None
    t = teks.lower().strip().rstrip(".")
    if t in _ALIAS_SATUAN:
        return _ALIAS_SATUAN[t]
    hit = difflib.get_close_matches(t, _ALIAS_SATUAN.keys(), n=1, cutoff=0.75)
    return _ALIAS_SATUAN[hit[0]] if hit else None


def ke_kg(jumlah: float, satuan: str) -> float:
    if satuan not in KONVERSI_BAKU:
        raise ValueError(f"Satuan {satuan} tidak dikonversi otomatis")
    return round(float(jumlah) * KONVERSI_BAKU[satuan], 2)


_HARI = {"senin": 0, "selasa": 1, "rabu": 2, "kamis": 3, "jumat": 4, "jum'at": 4, "sabtu": 5, "minggu": 6, "ahad": 6}
_BULAN = {
    "jan": 1, "januari": 1, "feb": 2, "februari": 2, "mar": 3, "maret": 3, "apr": 4, "april": 4,
    "mei": 5, "jun": 6, "juni": 6, "jul": 7, "juli": 7, "agu": 8, "agt": 8, "agustus": 8,
    "sep": 9, "september": 9, "okt": 10, "oktober": 10, "nov": 11, "november": 11, "des": 12, "desember": 12,
}


def hari_ini() -> date:
    return datetime.now(ZoneInfo(get_settings().timezone)).date()


def normalisasi_tanggal(teks: str | None, today: date | None = None) -> date | None:
    """Ubah 'besok', 'lusa', 'kamis', '20/10', '2026-10-20', '20 oktober' jadi tanggal."""
    if not teks:
        return None
    today = today or hari_ini()
    t = teks.lower().strip()
    try:
        return date.fromisoformat(t[:10])
    except ValueError:
        pass
    if re.search(r"\b(hari ini|sekarang|tadi)\b", t):
        return today
    if "kemarin" in t:
        return today - timedelta(days=1)
    if "lusa" in t:
        return today + timedelta(days=2)
    if re.search(r"\b(besok|besuk|bsk)\b", t):
        return today + timedelta(days=1)
    m = re.search(r"\b(\d+)\s*hari lagi\b", t)
    if m:
        return today + timedelta(days=int(m.group(1)))
    if "minggu depan" in t:
        return today + timedelta(days=7)
    for nama, idx in _HARI.items():
        if re.search(rf"\b{re.escape(nama)}\b", t):
            return today + timedelta(days=(idx - today.weekday()) % 7)
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b", t)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
        return _buat_tanggal(d, mo, y, today)
    m = re.search(r"\b(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?", t)
    if m and m.group(2) in _BULAN:
        return _buat_tanggal(int(m.group(1)), _BULAN[m.group(2)], m.group(3), today)
    m = re.search(r"\b(?:tgl|tanggal)\s*(\d{1,2})\b", t)
    if m:
        d = int(m.group(1))
        cand = _buat_tanggal(d, today.month, None, today)
        if cand and cand < today:
            nm = today.month % 12 + 1
            cand = _buat_tanggal(d, nm, str(today.year + (1 if nm == 1 else 0)), today)
        return cand
    return None


def _buat_tanggal(d: int, mo: int, y: str | None, today: date) -> date | None:
    year = today.year if not y else (int(y) + 2000 if len(y) == 2 else int(y))
    try:
        return date(year, mo, d)
    except ValueError:
        return None


def normalisasi_nomor(phone: str) -> str:
    """Nomor WA disimpan dalam format internasional tanpa '+': 62812xxxx."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    elif digits.startswith("8"):
        digits = "62" + digits
    return digits
