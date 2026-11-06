"""Grava uma planilha com o mesmo deslocamento de cabeçalho do arquivo original."""

from pathlib import Path

import pandas as pd
from openpyxl import Workbook

from app.domain.dataset import DatasetConfig
from app.services.export import _cell


def write_like_source(frame: pd.DataFrame, path: Path, cfg: DatasetConfig) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    book = Workbook(write_only=True)
    sheet = book.create_sheet(cfg.sheet[:31])
    for _ in range(cfg.header_row):
        sheet.append([])
    sheet.append([str(column) for column in frame.columns])
    for row in frame.itertuples(index=False, name=None):
        sheet.append([_cell(value) for value in row])
    book.save(path)
