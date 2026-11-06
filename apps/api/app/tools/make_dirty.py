"""Gera data/raw/<ds>_sujo.xlsx. Uso: python -m app.tools.make_dirty ds1 --seed 42."""

import argparse

import numpy as np
import pandas as pd

from app.core.config import get_settings
from app.domain.dataset import DatasetConfig, load_catalog
from app.domain.territory import safe_name
from app.services.cleaning.reader import read_dataset
from app.tools.sheets import write_like_source

ID_NAMES = {"ano", "cod", "idade", "sexo", "sigla", "local", "grupo_etario", "intervalo", "intervalo_de_idade"}


def metric_columns(frame: pd.DataFrame, cfg: DatasetConfig) -> list[str]:
    if cfg.reshape is not None:
        return [col for col in frame.columns if str(col).isdigit() and len(str(col)) == 4]
    if cfg.metrics != "auto":
        wanted = set(cfg.metrics)
        return [col for col in frame.columns if safe_name(col) in wanted]
    chosen = []
    for col in frame.columns:
        if safe_name(col) in ID_NAMES:
            continue
        if pd.api.types.is_numeric_dtype(frame[col]):
            chosen.append(col)
            continue
        converted = pd.to_numeric(frame[col], errors="coerce")
        nonempty = frame[col].map(lambda value: pd.notna(value) and str(value).strip() != "")
        if int(nonempty.sum()) == 0 or int(converted.notna().sum()) >= int(nonempty.sum()) * 0.5:
            chosen.append(col)
    return chosen


def dirty_frame(frame: pd.DataFrame, cfg: DatasetConfig, seed: int = 42) -> pd.DataFrame:
    """3% nulos, 1% duplicata exata, 0,5% duplicata de chave, 0,5% outliers, espaços e um sigla nulo."""
    rng = np.random.default_rng(seed)
    out = frame.copy()
    columns = metric_columns(out, cfg)
    for column in columns:
        out[column] = pd.to_numeric(out[column], errors="coerce").astype("float64")
    rows = len(out)
    coordinates = [(row, column) for row in range(rows) for column in columns]
    null_count = max(1, int(round(0.03 * len(coordinates))))
    outlier_count = max(1, int(round(0.005 * len(coordinates))))
    chosen = rng.choice(len(coordinates), size=min(len(coordinates), null_count + outlier_count), replace=False)
    null_at = set(int(index) for index in chosen[:null_count])
    outlier_at = [int(index) for index in chosen[null_count : null_count + outlier_count]]
    for index in null_at:
        row, column = coordinates[index]
        out.iat[row, out.columns.get_loc(column)] = np.nan
    for position, index in enumerate(outlier_at):
        row, column = coordinates[index]
        loc = out.columns.get_loc(column)
        value = out.iat[row, loc]
        if pd.notna(value) and value != 0:
            factor = 10 if position % 2 == 0 else 0.1
            out.iat[row, loc] = float(value) * factor
    for column in out.columns:
        if out[column].dtype != object:
            continue
        sample = rng.choice(rows, size=max(1, int(round(0.05 * rows))), replace=False)
        loc = out.columns.get_loc(column)
        for row in sample:
            value = out.iat[row, loc]
            if isinstance(value, str) and value.strip():
                out.iat[row, loc] = f" {value} "
    sigla = next((column for column in out.columns if safe_name(column) == "sigla"), None)
    if sigla is not None:
        out.iat[0, out.columns.get_loc(sigla)] = pd.NA
    exact = out.sample(max(1, int(round(0.01 * rows))), random_state=seed)
    copies = out.sample(max(1, int(round(0.005 * rows))), random_state=seed + 1).copy()
    if columns:
        copies.iloc[:, copies.columns.get_loc(columns[0])] = np.nan
        if len(columns) > 1:
            changed = copies.columns.get_loc(columns[1])
            copies.iloc[:, changed] = pd.to_numeric(copies.iloc[:, changed], errors="coerce") * 3
    return pd.concat([out, exact, copies], ignore_index=True)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args(argv)
    cfg = load_catalog().get(args.dataset)
    settings = get_settings()
    source = settings.raw_dir / cfg.file
    frame = read_dataset(source, cfg)
    dirty = dirty_frame(frame, cfg, args.seed)
    dest = settings.raw_dir / f"{cfg.id}_sujo.xlsx"
    write_like_source(dirty, dest, cfg)
    print(f"{dest} rows={len(dirty)}")


if __name__ == "__main__":
    main()
