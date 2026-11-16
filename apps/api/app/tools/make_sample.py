"""Recorta Brasil, Nordeste e Bahia da silver completa para data/silver/amostra."""

import json
from pathlib import Path

import pandas as pd

from app.core.config import get_settings
from app.domain.dataset import load_catalog
from app.services.store import ParquetStore

CAP = 2_000
CODIGOS = {0, 2, 29}
DS1_ANOS = {2000, 2024, 2026, 2041, 2070}


def main() -> None:
    """Grava data/silver/amostra e o golden.json desse recorte."""
    settings = get_settings()
    store = ParquetStore(settings.silver_dir)
    dest = settings.silver_dir / "amostra"
    dest.mkdir(parents=True, exist_ok=True)
    golden: dict[str, dict] = {}
    for cfg in load_catalog().datasets:
        path = store.latest_file(cfg.id, ".parquet")
        if path is None or path.parent == dest:
            raise FileNotFoundError(f"Silver completa de {cfg.id} ausente em {settings.silver_dir}")
        frame = _cut(cfg.id, pd.read_parquet(path))
        out = dest / f"{cfg.id}.parquet"
        frame.to_parquet(out, index=False)
        metrics = settings.silver_dir / f"{cfg.id}_metrics.json"
        if metrics.exists():
            (dest / metrics.name).write_text(metrics.read_text(encoding="utf-8"), encoding="utf-8")
        golden[cfg.id] = _refs(cfg.id, frame)
        print(f"amostra {cfg.id} rows={len(frame)}", flush=True)
    (dest / "golden.json").write_text(json.dumps(golden, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _cut(dataset_id: str, frame: pd.DataFrame) -> pd.DataFrame:
    out = frame
    if "cod" in out.columns:
        out = out[out["cod"].isin(CODIGOS)]
    if dataset_id == "ds1" and "ano" in out.columns:
        out = out[out["ano"].isin(DS1_ANOS)]
    keys = [col for col in ("ano", "cod", "sexo", "idade", "grupo_etario") if col in out.columns]
    if keys:
        out = out.sort_values(keys, kind="mergesort")
    if len(out) > CAP:
        out = out.head(CAP)
    return out.reset_index(drop=True)


def _refs(dataset_id: str, frame: pd.DataFrame) -> dict:
    refs: dict = {"rows": int(len(frame))}
    if dataset_id == "ds1" and {"ano", "sexo", "cod", "populacao"} <= set(frame.columns):
        ambos = frame[(frame["cod"] == 0) & (frame["sexo"] == "Ambos")]
        for ano, key in ((2026, "brasil_2026"), (2024, "brasil_2024")):
            part = ambos[ambos["ano"] == ano]
            if not part.empty:
                refs[key] = int(part["populacao"].sum())
        if "is_outlier" in frame.columns:
            refs["outliers"] = int(frame["is_outlier"].fillna(False).sum())
    if dataset_id == "ds4" and {"cod", "ano"} <= set(frame.columns):
        row = frame[(frame["cod"] == 0) & (frame["ano"] == 2026)]
        if not row.empty:
            current = row.iloc[0]
            if "pop_t" in frame.columns and pd.notna(current["pop_t"]):
                refs["pop_t_2026"] = int(current["pop_t"])
            if "e0_t" in frame.columns and pd.notna(current["e0_t"]):
                refs["e0_t_2026"] = round(float(current["e0_t"]), 2)
            if "tft" in frame.columns and pd.notna(current["tft"]):
                refs["tft_2026"] = round(float(current["tft"]), 2)
        if {"tcg_t", "tcg_h", "tcg_m", "ano"} <= set(frame.columns):
            year = frame[frame["ano"] == 2000]
            if not year.empty:
                refs["nulos_tcg"] = int(year[["tcg_t", "tcg_h", "tcg_m"]].isna().to_numpy().sum())
    return refs


if __name__ == "__main__":
    main()
