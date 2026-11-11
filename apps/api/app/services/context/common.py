"""Leitura e formatos compartilhados do card Contexto."""

import re
import unicodedata

import pandas as pd

from app.core.config import get_settings
from app.domain.territory import REGIOES, UFS
from app.integrations.cache import ResponseCache
from app.integrations.ibge_agregados import census_gap, get_censo_2022
from app.services.analytics import projection_2022
from app.services.facts.common import cell, frame, sex, territory, total_sex
from app.services.context.models import ContextItem, NoteValue

REF = 2026


def slug(title: str) -> str:
    text = unicodedata.normalize("NFKD", title)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def item(
    item_id: str,
    label: str,
    value: float | int | str,
    kind: str,
    chart_title: str,
    chart_label: str,
    note: str | None = None,
    notes: list[tuple[str, float | int | str, str]] | None = None,
) -> ContextItem:
    return ContextItem(
        id=item_id,
        label=label,
        value=value,
        kind=kind,  # type: ignore[arg-type]
        note=note,
        note_values=None
        if not notes
        else [NoteValue(key=key, value=val, kind=kind_name) for key, val, kind_name in notes],  # type: ignore[arg-type]
        chart_id=slug(chart_title),
        chart_label=chart_label,
    )


def sex_code(value: str | None) -> str:
    text = (value or "T").strip().upper()
    if text in {"H", "HOMENS"}:
        return "h"
    if text in {"M", "MULHERES"}:
        return "m"
    return "t"


def is_uf(cod: int) -> bool:
    return cod in UFS


def is_region(cod: int) -> bool:
    return cod in REGIOES


def people(dataset_id: str, cod: int, kind: str) -> pd.DataFrame:
    data = territory(dataset_id, cod)
    if kind == "h":
        return sex(data, "h")
    if kind == "m":
        return sex(data, "m")
    return total_sex(data)


def year_rows(data: pd.DataFrame, year: int) -> pd.DataFrame:
    if data.empty or "ano" not in data.columns:
        return data.iloc[0:0]
    return data[data["ano"] == year]


def comma(value: float, digits: int) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


def ordinal(rank: int) -> str:
    return f"{rank}ª"


def censo_item(cod: int, chart_title: str, chart_label: str) -> ContextItem | None:
    settings = get_settings()
    cache = ResponseCache(settings.data_dir / "cache", settings.cache_ttl_s)
    census = get_censo_2022(cod, settings, cache)
    if census is None:
        return None
    try:
        projection = projection_2022(frame("ds4"), cod)
    except Exception:
        projection = None
    if projection is None:
        return None
    gap = census_gap(projection, census)
    return item(
        "censo",
        "Censo 2022 × projeção 2022",
        round(gap / 100, 4),
        "percent",
        chart_title,
        chart_label,
        "Projeção {proj} × recenseado {cens}.",
        [("proj", int(round(projection)), "count"), ("cens", int(census), "count")],
    )


def rank_of(rows: pd.DataFrame, cod: int, column: str) -> int | None:
    ordered = rows.dropna(subset=[column]).sort_values([column, "sigla"], ascending=[False, True])
    codes = [int(code) for code in ordered["cod"].tolist()]
    if cod not in codes:
        return None
    return codes.index(cod) + 1


def ends(rows: pd.DataFrame, column: str, digits: int, as_percent: bool) -> tuple[str, float, str, float] | None:
    data = rows.dropna(subset=[column])
    if data.empty:
        return None
    high = data.loc[data[column].idxmax()]
    low = data.loc[data[column].idxmin()]
    high_value = float(high[column])
    low_value = float(low[column])
    return str(high["sigla"]), high_value, str(low["sigla"]), low_value

