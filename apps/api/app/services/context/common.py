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
    """Entra: title. Sai com o resultado de slug."""
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
    """Entra: item_id, label, value, kind, chart_title, chart_label, note, notes. Sai com o resultado de item."""
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
    """Entra: value. Sai com o resultado de sex code."""
    text = (value or "T").strip().upper()
    if text in {"H", "HOMENS"}:
        return "h"
    if text in {"M", "MULHERES"}:
        return "m"
    return "t"


def is_uf(cod: int) -> bool:
    """Entra: cod. Sai com o resultado de is uf."""
    return cod in UFS


def is_region(cod: int) -> bool:
    """Entra: cod. Sai com o resultado de is region."""
    return cod in REGIOES


def people(dataset_id: str, cod: int, kind: str) -> pd.DataFrame:
    """Entra: dataset_id, cod, kind. Sai com o resultado de people."""
    from app.services.facts.registry import cache_token

    key = (dataset_id, int(cod), kind, cache_token())
    cached = _PEOPLE.get(key)
    if cached is not None:
        return cached
    data = frame(dataset_id)
    data = data[data["cod"] == int(cod)]
    if dataset_id == "ds1":
        keep = [column for column in ("ano", "idade", "sexo", "populacao", "cod") if column in data.columns]
        data = data[keep]
    if kind == "h":
        chosen = sex(data, "h")
    elif kind == "m":
        chosen = sex(data, "m")
    else:
        chosen = total_sex(data)
    if len(_PEOPLE) > 256:
        _PEOPLE.pop(next(iter(_PEOPLE)))
    _PEOPLE[key] = chosen
    return chosen


_PEOPLE: dict[tuple, pd.DataFrame] = {}


def year_rows(data: pd.DataFrame, year: int) -> pd.DataFrame:
    """Entra: data, year. Sai com o resultado de year rows."""
    if data.empty or "ano" not in data.columns:
        return data.iloc[0:0]
    return data[data["ano"] == year]


def comma(value: float, digits: int) -> str:
    """Entra: value, digits. Sai com o resultado de comma."""
    return f"{value:.{digits}f}".replace(".", ",")


def ordinal(rank: int) -> str:
    """Entra: rank. Sai com o resultado de ordinal."""
    return f"{rank}ª"


def censo_item(cod: int, chart_title: str, chart_label: str) -> ContextItem | None:
    """Entra: cod, chart_title, chart_label. Sai com o resultado de censo item."""
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
    """Entra: rows, cod, column. Sai com o resultado de rank of."""
    ordered = rows.dropna(subset=[column]).sort_values([column, "sigla"], ascending=[False, True])
    codes = [int(code) for code in ordered["cod"].tolist()]
    if cod not in codes:
        return None
    return codes.index(cod) + 1


def ends(rows: pd.DataFrame, column: str, digits: int, as_percent: bool) -> tuple[str, float, str, float] | None:
    """Entra: rows, column, digits, as_percent. Sai com o resultado de ends."""
    data = rows.dropna(subset=[column])
    if data.empty:
        return None
    high = data.loc[data[column].idxmax()]
    low = data.loc[data[column].idxmin()]
    high_value = float(high[column])
    low_value = float(low[column])
    return str(high["sigla"]), high_value, str(low["sigla"]), low_value

