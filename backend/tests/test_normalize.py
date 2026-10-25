from datetime import date

import pytest

from app.agent.fallback import ekstrak_laporan
from app.agent.runner import bersihkan_markdown
from app.normalize import ke_kg, normalisasi_komoditas, normalisasi_nomor, normalisasi_satuan, normalisasi_tanggal

KAMIS = date(2026, 10, 15)


@pytest.mark.parametrize(
    "teks,harapan",
    [
        ("kol", "Kubis"),
        ("kembang kol", "Kembang Kol"),
        ("bunga kol segar", "Kembang Kol"),
        ("cabe merah", "Cabai Besar"),
        ("cabai rawit", None),
        ("terong ungu", "Terung"),
        ("wortl", "Wortel"),
        ("durian", None),
    ],
)
def test_komoditas(teks, harapan):
    assert normalisasi_komoditas(teks) == harapan


def test_satuan_hanya_baku_yang_dikonversi():
    assert normalisasi_satuan("Karung") == "karung"
    assert normalisasi_satuan("kuintal") == "kwintal"
    assert normalisasi_satuan("kilo") == "kg"
    assert ke_kg(1.2, "ton") == 1200
    assert ke_kg(5, "kwintal") == 500
    with pytest.raises(ValueError):
        ke_kg(6, "karung")  # proposal: satuan lokal tidak dikonversi tanpa kesepakatan


@pytest.mark.parametrize(
    "teks,harapan",
    [
        ("besok", date(2026, 10, 16)),
        ("lusa", date(2026, 10, 17)),
        ("hari ini", KAMIS),
        ("senin", date(2026, 10, 19)),
        ("kamis", KAMIS),
        ("20/10", date(2026, 10, 20)),
        ("2026-11-02", date(2026, 11, 2)),
        ("3 november", date(2026, 11, 3)),
        ("tgl 5", date(2026, 11, 5)),
        ("kapan-kapan", None),
    ],
)
def test_tanggal(teks, harapan):
    assert normalisasi_tanggal(teks, today=KAMIS) == harapan


def test_nomor():
    assert normalisasi_nomor("0812-3456-7890") == "6281234567890"
    assert normalisasi_nomor("+62 812 3456 7890") == "6281234567890"


def test_fallback_ekstraksi():
    d = ekstrak_laporan("lapor panen cabe 6 karung desa lubuk ubar besok")
    assert d["komoditas"] == "Cabai Besar" and d["jumlah"] == 6 and d["satuan"] == "karung" and d["desa"] == "Lubuk Ubar"
    assert ekstrak_laporan("halo apa kabar") is None


def test_bersihkan_markdown():
    assert bersihkan_markdown("**Halo** Pak\n## Ringkasan\n* satu") == "Halo Pak\nRingkasan\n- satu"
