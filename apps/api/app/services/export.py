"""Exporta a base tratada em csv, xlsx e parquet."""

from datetime import datetime
from pathlib import Path

import pandas as pd
from openpyxl import Workbook


def export_table(frame: pd.DataFrame, dataset_id: str, directory: Path) -> dict[str, Path]:
    directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%dT%H%M%S%f")
    stem = directory / f"{dataset_id}_{stamp}"
    csv_path = stem.with_suffix(".csv")
    xlsx_path = stem.with_suffix(".xlsx")
    parquet_path = stem.with_suffix(".parquet")
    frame.to_csv(csv_path, index=False)
    _write_xlsx(frame, xlsx_path)
    frame.to_parquet(parquet_path, index=False)
    return {"csv": csv_path, "xlsx": xlsx_path, "parquet": parquet_path}


def _write_xlsx(frame: pd.DataFrame, path: Path) -> None:
    book = Workbook(write_only=True)
    sheet = book.create_sheet("dados")
    sheet.append([str(col) for col in frame.columns])
    for row in frame.itertuples(index=False, name=None):
        sheet.append([_cell(value) for value in row])
    book.save(path)


def _cell(value: object) -> object:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    if hasattr(value, "item"):
        return value.item()
    return value
