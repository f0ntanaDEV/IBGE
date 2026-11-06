"""Leitura da aba e da linha de cabeçalho definidas no catálogo."""

from pathlib import Path

import pandas as pd

from app.domain.dataset import DatasetConfig


def read_dataset(path: Path, cfg: DatasetConfig) -> pd.DataFrame:
    """Lê só a aba de dados, com o cabeçalho configurado, e descarta linhas vazias."""
    engine = cfg.engine or "calamine"
    frame = pd.read_excel(
        path,
        sheet_name=cfg.sheet,
        header=cfg.header_row,
        engine=engine,
    )
    frame = frame.dropna(axis=0, how="all").dropna(axis=1, how="all")
    frame.columns = [_header_token(col) for col in frame.columns]
    unnamed = [col for col in frame.columns if str(col).startswith("Unnamed")]
    if unnamed:
        frame = frame.drop(columns=unnamed)
    return frame.reset_index(drop=True)


def read_upload(path: Path, cfg: DatasetConfig) -> pd.DataFrame:
    """CSV usa a primeira linha como cabeçalho; xlsx segue o catálogo."""
    suffix = path.suffix.lower()
    if suffix == ".csv":
        frame = pd.read_csv(path)
        frame.columns = [_header_token(col) for col in frame.columns]
        return frame
    if suffix == ".xlsx":
        return read_dataset(path, cfg)
    raise ValueError(suffix)


def _header_token(value: object) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    text = str(value).strip()
    if text.endswith(".0") and text[:-2].isdigit():
        return text[:-2]
    return text
