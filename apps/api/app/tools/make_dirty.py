"""Gera data/raw/<ds>_sujo.xlsx e o manifesto. Uso: python -m app.tools.make_dirty ds1 --seed 42."""

import argparse
import json
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from app.core.config import Settings, get_settings
from app.domain.dataset import DatasetConfig, load_catalog
from app.domain.territory import SKIP_OUTLIER, safe_name
from app.services.cleaning.normalize import normalize
from app.services.cleaning.reader import read_dataset
from app.services.cleaning.reshape import reshape
from app.tools.sheets import write_like_source

TEXT = {"sigla", "local", "sexo", "grupo_etario", "intervalo", "intervalo_de_idade"}


def metric_columns(frame: pd.DataFrame, cfg: DatasetConfig) -> list[str]:
    if cfg.metrics != "auto":
        return [col for col in cfg.metrics if col in frame.columns]
    skip = set(SKIP_OUTLIER) | {"row_uid", "nivel", "idade_inicio", "intervalo_aberto", "is_outlier", "outlier_motivo"}
    chosen = []
    for col in frame.columns:
        if col in skip or str(col).isdigit():
            continue
        if pd.api.types.is_numeric_dtype(frame[col]):
            chosen.append(col)
    return chosen


def _interior(frame: pd.DataFrame, cfg: DatasetConfig) -> pd.Series:
    series = [col for col in cfg.series_by if col in frame.columns]
    if not series or "ano" not in frame.columns:
        return pd.Series(True, index=frame.index)
    grouped = frame.groupby(series, dropna=False)["ano"]
    lowest = grouped.transform("min")
    highest = grouped.transform("max")
    return frame["ano"].gt(lowest) & frame["ano"].lt(highest)


def _inject(long: pd.DataFrame, cfg: DatasetConfig, seed: int) -> tuple[pd.DataFrame, dict]:
    rng = np.random.default_rng(seed)
    out = long.copy()
    columns = metric_columns(out, cfg)
    structural = {name for rule in cfg.structural_nulls for name in rule.columns}
    interior = _interior(out, cfg)
    coordinates = []
    for column in columns:
        mask = interior & out[column].notna()
        if column in structural and "ano" in out.columns:
            mask = mask & out["ano"].ne(out["ano"].min())
        coordinates.extend((int(idx), column) for idx in out.index[mask])
    null_count = max(1, int(round(0.03 * len(coordinates)))) if coordinates else 0
    outlier_count = max(1, int(round(0.005 * len(coordinates)))) if coordinates else 0
    take = min(len(coordinates), null_count + outlier_count)
    chosen = rng.choice(len(coordinates), size=take, replace=False) if take else []
    null_at = [coordinates[int(index)] for index in chosen[:null_count]]
    outlier_at = [coordinates[int(index)] for index in chosen[null_count : null_count + outlier_count]]
    nulls: dict[str, int] = {}
    for row, column in null_at:
        out.at[row, column] = np.nan
        nulls[column] = nulls.get(column, 0) + 1
    outlier_columns: dict[str, int] = {}
    outlier_rows: list[int] = []
    for position, (row, column) in enumerate(outlier_at):
        value = out.at[row, column]
        if pd.isna(value) or value == 0:
            continue
        factor = 10 if position % 2 == 0 else 0.1
        out.at[row, column] = float(value) * factor
        outlier_columns[column] = outlier_columns.get(column, 0) + 1
        outlier_rows.append(int(out.at[row, "row_uid"]))
    return out, {
        "null_cells": nulls,
        "outlier_rows": outlier_rows,
        "outlier_columns": outlier_columns,
    }


def _to_layout(named: pd.DataFrame, long: pd.DataFrame, cfg: DatasetConfig) -> pd.DataFrame:
    if cfg.reshape is None:
        keys = [col for col in cfg.key if col in named.columns and col in long.columns]
        metrics = [col for col in metric_columns(long, cfg) if col in named.columns]
        base = named.drop(columns=[col for col in metrics if col in named.columns])
        merged = base.merge(long[keys + metrics], on=keys, how="left")
        return merged[[col for col in named.columns if col in merged.columns]]
    spec = cfg.reshape.wide_to_long
    id_cols = [safe_name(name) for name in spec.id_vars]
    pivot = long.pivot_table(index=id_cols, columns=spec.var_name, values=spec.value_name, aggfunc="first")
    pivot.columns = [str(int(col)) for col in pivot.columns]
    years = sorted(pivot.columns, key=int)
    base = named[id_cols].drop_duplicates()
    merged = base.merge(pivot.reset_index(), on=id_cols, how="left")
    return merged[id_cols + years]


def _duplicates(frame: pd.DataFrame, cfg: DatasetConfig, seed: int) -> tuple[pd.DataFrame, int, int]:
    rows = len(frame)
    if rows == 0:
        return frame, 0, 0
    exact_n = max(1, int(round(0.01 * rows)))
    key_n = max(1, int(round(0.005 * rows)))
    exact = frame.sample(min(exact_n, rows), random_state=seed)
    copies = frame.sample(min(key_n, rows), random_state=seed + 1).copy()
    metrics = [col for col in metric_columns(copies, cfg) if col in copies.columns]
    if not metrics and cfg.reshape is not None:
        metrics = [col for col in copies.columns if str(col).isdigit()]
    if metrics:
        copies[metrics[0]] = pd.to_numeric(copies[metrics[0]], errors="coerce") * 3
    return pd.concat([frame, exact, copies], ignore_index=True), len(exact), len(copies)


def _touch_text(frame: pd.DataFrame, seed: int) -> tuple[pd.DataFrame, int, int]:
    rng = np.random.default_rng(seed)
    out = frame.copy()
    spaces = 0
    rows = len(out)
    for column in out.columns:
        if column not in TEXT and not (out[column].dtype == object or pd.api.types.is_string_dtype(out[column])):
            continue
        if column not in TEXT:
            continue
        size = max(1, int(round(0.05 * rows)))
        sample = rng.choice(rows, size=min(size, rows), replace=False)
        for row in sample:
            value = out.at[int(row), column]
            if isinstance(value, str) and value.strip():
                out.at[int(row), column] = f" {value} "
                spaces += 1
    recoverable = 0
    if "sigla" in out.columns and "cod" in out.columns and rows:
        candidates = out.index[out["cod"].notna() & out["sigla"].notna()].to_numpy()
        if len(candidates):
            size = min(len(candidates), max(1, int(round(0.001 * rows))))
            chosen = rng.choice(candidates, size=size, replace=False)
            out.loc[chosen, "sigla"] = pd.NA
            recoverable = int(size)
    return out, spaces, recoverable


def _space_count(frame: pd.DataFrame) -> int:
    total = 0
    for column in frame.columns:
        if column not in TEXT:
            continue
        total += int(frame[column].map(lambda value: isinstance(value, str) and value != value.strip()).sum())
    return total


def _long_view(frame: pd.DataFrame, cfg: DatasetConfig) -> pd.DataFrame:
    named, labels = normalize(frame)
    shaped, _metrics = reshape(named, cfg, labels)
    return shaped


def _as_pipeline(shaped: pd.DataFrame, cfg: DatasetConfig) -> tuple[int, int, pd.DataFrame]:
    """Conta duplicatas como o pipeline, depois do reshape."""
    exact_mask = shaped.duplicated(keep="first")
    kept = shaped.loc[~exact_mask]
    key = [col for col in cfg.key if col in kept.columns]
    key_mask = kept.duplicated(subset=key, keep="first") if key else pd.Series(False, index=kept.index)
    return int(exact_mask.sum()), int(key_mask.sum()), kept.loc[~key_mask]


def _manifest_nulls(shaped: pd.DataFrame, cfg: DatasetConfig) -> dict[str, int]:
    structural = {name for rule in cfg.structural_nulls for name in rule.columns}
    counts: dict[str, int] = {}
    for column in metric_columns(shaped, cfg):
        missing = shaped[column].isna()
        if column in structural and "ano" in shaped.columns:
            missing = missing & shaped["ano"].ne(shaped["ano"].min())
        total = int(missing.sum())
        if total:
            counts[column] = total
    return counts


def build_dirty(raw: pd.DataFrame, cfg: DatasetConfig, seed: int = 42) -> tuple[pd.DataFrame, dict]:
    """Suja a base longa e devolve o layout original mais o manifesto."""
    named, labels = normalize(raw)
    shaped, _metrics = reshape(named.copy(), cfg, labels)
    shaped = shaped.reset_index(drop=True)
    shaped["row_uid"] = np.arange(len(shaped), dtype="int64")
    dirty, touched = _inject(shaped, cfg, seed)
    laid = _to_layout(named, dirty, cfg)
    with_text, _spaces, _ids = _touch_text(laid, seed)
    table, _wide_exact, _wide_key = _duplicates(with_text, cfg, seed)
    viewed = _long_view(table, cfg)
    exact, keys, unique = _as_pipeline(viewed, cfg)
    manifest = {
        "dataset": cfg.id,
        "seed": seed,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rows_original": int(len(shaped)),
        "nulls_injected": _manifest_nulls(unique, cfg),
        "exact_duplicates": exact,
        "key_duplicates": keys,
        "outliers": {
            "rows": touched["outlier_rows"],
            "columns": touched["outlier_columns"],
            "factor": [10, 0.1],
        },
        "whitespace_cells": _space_count(table),
        "recoverable_ids": int(viewed["sigla"].isna().sum()) if "sigla" in viewed.columns else 0,
    }
    return table, manifest


def write_dirty(cfg: DatasetConfig, settings: Settings, seed: int = 42) -> None:
    source = settings.raw_dir / cfg.file
    frame = read_dataset(source, cfg)
    dirty, manifest = build_dirty(frame, cfg, seed)
    dest = settings.raw_dir / f"{cfg.id}_sujo.xlsx"
    write_like_source(dirty, dest, cfg)
    path = settings.raw_dir / f"{cfg.id}_sujo.manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{dest} rows={len(dirty)}")


def ensure_dirty(cfg: DatasetConfig, settings: Settings, seed: int = 42) -> None:
    dest = settings.raw_dir / f"{cfg.id}_sujo.xlsx"
    manifest = settings.raw_dir / f"{cfg.id}_sujo.manifest.json"
    if dest.exists() and manifest.exists():
        return
    write_dirty(cfg, settings, seed)


def dirty_frame(frame: pd.DataFrame, cfg: DatasetConfig, seed: int = 42) -> pd.DataFrame:
    """Compatível com o processador antigo: devolve só a tabela suja."""
    table, _manifest = build_dirty(frame, cfg, seed)
    return table


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args(argv)
    cfg = load_catalog().get(args.dataset)
    write_dirty(cfg, get_settings(), args.seed)


if __name__ == "__main__":
    main()
