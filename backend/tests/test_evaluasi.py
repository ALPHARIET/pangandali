from datetime import date

from app.evaluasi import Kasus, evaluasi, muat_dataset
from tests.conftest import ScriptedLLM


def test_dataset_contoh_bisa_dimuat():
    kasus = muat_dataset("eval/pesan_uji_contoh.jsonl")
    assert len(kasus) >= 10 and all(k.harapan for k in kasus)


def test_evaluasi_menilai_entitas_termasuk_yang_tidak_disebut():
    k = Kasus("t1", "kol 300 kilo besok lubuk ubar", date(2026, 10, 15),
              {"komoditas": "Kubis", "jumlah": 300, "satuan": "kg", "desa": "Lubuk Ubar", "tanggal_panen": "2026-10-16", "harga_harapan_per_kg": None})
    # LLM benar semua kecuali mengarang harga
    llm = ScriptedLLM([[("simpan_laporan_panen", {"komoditas": "kol", "jumlah": 300, "satuan": "kilo", "desa": "lubuk ubar",
                                                  "tanggal_panen": "besok", "harga_harapan_per_kg": 5000})]])
    hasil = evaluasi([k], llm)["metode"]["llm"]
    assert hasil["per_entitas_persen"]["komoditas"] == 100 and hasil["per_entitas_persen"]["tanggal_panen"] == 100
    assert hasil["per_entitas_persen"]["harga_harapan_per_kg"] == 0
    assert hasil["ketepatan_entitas_persen"] == round(100 * 5 / 6, 1)
