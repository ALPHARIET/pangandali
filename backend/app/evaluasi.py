"""Uji akurasi ekstraksi pesan panen (proposal: target >= 85% ketepatan entitas pada set uji terpisah).

Pemakaian:
  python -m app.evaluasi eval/pesan_uji_contoh.jsonl               # LLM dari backend/.env + baseline rule-based
  python -m app.evaluasi eval/pesan_uji_contoh.jsonl --tanpa-llm   # hanya baseline rule-based
  python -m app.evaluasi data.jsonl --out hasil.json

Format dataset (JSONL, satu pesan per baris):
  {"id": "p01", "teks": "...", "tanggal_acuan": "2026-10-15",
   "harapan": {"komoditas": "Kubis", "jumlah": 300, "satuan": "kg", "desa": "Lubuk Ubar",
               "tanggal_panen": "2026-10-16", "harga_harapan_per_kg": 6000}}
Entitas yang tidak disebut di pesan diisi null pada "harapan"; null juga dinilai (model tidak boleh mengarang).

Hasil yang dilaporkan adalah ekstraksi SEBELUM konfirmasi pengguna. Ketepatan sesudah konfirmasi
diukur saat uji lapangan (petani mengoreksi ringkasan), tidak bisa disimulasikan di skrip ini.
"""
import argparse
import json
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .agent.fallback import ekstrak_laporan
from .agent.prompts import system_prompt
from .agent.tools import REGISTRY, Actor
from .llm.client import ChatModel, LLMError
from .models import Petani
from .normalize import normalisasi_komoditas, normalisasi_satuan, normalisasi_tanggal

ENTITAS = ("komoditas", "jumlah", "satuan", "desa", "tanggal_panen", "harga_harapan_per_kg")


@dataclass
class Kasus:
    id: str
    teks: str
    tanggal_acuan: date
    harapan: dict


def muat_dataset(path: str | Path) -> list[Kasus]:
    kasus = []
    for i, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        d = json.loads(line)
        kasus.append(Kasus(d.get("id") or f"baris{i}", d["teks"], date.fromisoformat(d["tanggal_acuan"]), d["harapan"]))
    return kasus


def _norm(entitas: str, nilai, acuan: date):
    if nilai in (None, ""):
        return None
    if entitas == "komoditas":
        return normalisasi_komoditas(str(nilai))
    if entitas == "satuan":
        return normalisasi_satuan(str(nilai))
    if entitas == "desa":
        return " ".join(str(nilai).lower().replace("desa", " ").split())
    if entitas == "tanggal_panen":
        t = nilai if isinstance(nilai, date) else normalisasi_tanggal(str(nilai), today=acuan)
        return t.isoformat() if t else None
    try:
        return round(float(nilai), 2)
    except (TypeError, ValueError):
        return None


def ekstrak_llm(llm: ChatModel, k: Kasus) -> dict | None:
    """Ambil argumen simpan_laporan_panen dari panggilan tool pertama (tanpa menyimpan apa pun)."""
    actor = Actor(role="petani", phone="0", petani=Petani(name="Bapak", desa=None))
    tool = REGISTRY["simpan_laporan_panen"]
    messages = [{"role": "system", "content": system_prompt(actor, k.tanggal_acuan, None)}, {"role": "user", "content": k.teks}]
    reply = llm.chat(messages, [tool.schema()])
    for c in reply.tool_calls:
        if c.name == "simpan_laporan_panen":
            try:
                return json.loads(c.arguments or "{}")
            except ValueError:
                return {}
    return None


def _ekstrak_rule(k: Kasus) -> dict | None:
    """Baseline: ekstraksi rule-based lama (tidak membaca harga)."""
    d = ekstrak_laporan(k.teks, today=k.tanggal_acuan)
    return {**d, "harga_harapan_per_kg": None} if d else None


def nilai_kasus(k: Kasus, hasil: dict | None) -> dict:
    hasil = hasil or {}
    rinci = {}
    for e in ENTITAS:
        h = _norm(e, k.harapan.get(e), k.tanggal_acuan)
        x = _norm(e, hasil.get(e), k.tanggal_acuan)
        rinci[e] = {"harapan": h, "hasil": x, "benar": h == x}
    return rinci


def evaluasi(kasus: list[Kasus], llm: ChatModel | None) -> dict:
    laporan = {"jumlah_pesan": len(kasus), "metode": {}}
    metode = {"rule_based": _ekstrak_rule}
    if llm is not None:
        metode["llm"] = lambda k: ekstrak_llm(llm, k)
    for nama, fn in metode.items():
        per_entitas = {e: 0 for e in ENTITAS}
        detail, gagal = [], 0
        for k in kasus:
            try:
                hasil = fn(k)
            except LLMError as exc:
                hasil, gagal = None, gagal + 1
                detail.append({"id": k.id, "error": str(exc)})
                continue
            rinci = nilai_kasus(k, hasil)
            for e in ENTITAS:
                per_entitas[e] += rinci[e]["benar"]
            detail.append({"id": k.id, "teks": k.teks, "rinci": rinci, "semua_benar": all(r["benar"] for r in rinci.values())})
        n = len(kasus)
        total_benar = sum(per_entitas.values())
        laporan["metode"][nama] = {
            "ketepatan_entitas_persen": round(100 * total_benar / (n * len(ENTITAS)), 1) if n else None,
            "per_entitas_persen": {e: round(100 * v / n, 1) for e, v in per_entitas.items()} if n else {},
            "pesan_semua_benar_persen": round(100 * sum(1 for d in detail if d.get("semua_benar")) / n, 1) if n else None,
            "gagal_panggil_llm": gagal,
            "memenuhi_target_85": bool(n) and total_benar / (n * len(ENTITAS)) >= 0.85,
            "detail": detail,
        }
    return laporan


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dataset")
    ap.add_argument("--tanpa-llm", action="store_true")
    ap.add_argument("--out")
    args = ap.parse_args(argv)
    kasus = muat_dataset(args.dataset)
    llm = None
    if not args.tanpa_llm:
        from .llm.client import OpenAICompatClient
        from .settings_store import llm_config

        llm = OpenAICompatClient(llm_config())
    hasil = evaluasi(kasus, llm)
    for nama, m in hasil["metode"].items():
        print(f"[{nama}] ketepatan entitas {m['ketepatan_entitas_persen']}% | pesan benar semua {m['pesan_semua_benar_persen']}% "
              f"| target 85%: {'TERCAPAI' if m['memenuhi_target_85'] else 'belum'}")
        for e, v in m["per_entitas_persen"].items():
            print(f"    {e:22s} {v}%")
    if args.out:
        Path(args.out).write_text(json.dumps(hasil, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Detail tersimpan di {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
