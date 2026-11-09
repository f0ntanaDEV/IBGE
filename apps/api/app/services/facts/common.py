"""Leitura das séries já tratadas."""

import pandas as pd

from app.core.config import get_settings
from app.domain.territory import REGIOES, UFS
from app.services.analytics import sexo_kind
from app.services.store import ParquetStore

REF_YEAR = 2026


def store() -> ParquetStore:
    return ParquetStore(get_settings().processed_dir)


def frame(dataset_id: str) -> pd.DataFrame:
    return store().get(dataset_id)


def territory(dataset_id: str, cod: int) -> pd.DataFrame:
    data = frame(dataset_id)
    return data[data["cod"] == int(cod)].copy()


def total_sex(data: pd.DataFrame) -> pd.DataFrame:
    if "sexo" not in data.columns or data.empty:
        return data
    kinds = data["sexo"].map(sexo_kind)
    if kinds.eq("t").any():
        return data[kinds.eq("t")]
    return data


def sex(data: pd.DataFrame, kind: str) -> pd.DataFrame:
    if "sexo" not in data.columns:
        return data
    return data[data["sexo"].map(sexo_kind).eq(kind)]


def cell(data: pd.DataFrame, year: int, column: str) -> float | None:
    if data.empty or column not in data.columns or "ano" not in data.columns:
        return None
    rows = data[data["ano"] == year]
    if rows.empty or pd.isna(rows.iloc[0][column]):
        return None
    return float(rows.iloc[0][column])


def first_year(data: pd.DataFrame, predicate) -> int | None:
    if data.empty or "ano" not in data.columns:
        return None
    for row in data.sort_values("ano").itertuples(index=False):
        if predicate(row):
            return int(row.ano)
    return None


def ufs_do_territorio(cod: int) -> list[int]:
    if cod == 0:
        return list(UFS)
    if cod in REGIOES:
        return [code for code in UFS if code // 10 == cod]
    return []


def round_num(value: float, digits: int) -> float:
    return round(float(value), digits)


def as_int(value: float) -> int:
    return int(round(value))
