"""Fatos da população por idade simples."""

import pandas as pd

from app.services.facts.common import REF_YEAR, as_int, round_num, sex, territory, total_sex
from app.services.facts.models import DetailPoint, Fact


def _year(data: pd.DataFrame, year: int) -> pd.DataFrame:
    return data[data["ano"] == year]


def _at_age(data: pd.DataFrame, year: int, age: int) -> float | None:
    rows = _year(data, year)
    rows = rows[rows["idade"] == age]
    if rows.empty:
        return None
    return float(rows.iloc[0]["populacao"])


def _modal(data: pd.DataFrame, year: int) -> int | None:
    rows = _year(data, year)
    rows = rows[rows["idade"].between(0, 89)]
    if rows.empty:
        return None
    return int(rows.loc[rows["populacao"].idxmax(), "idade"])


def _median(data: pd.DataFrame, year: int) -> int | None:
    rows = _year(data, year).sort_values("idade")
    if rows.empty:
        return None
    total = float(rows["populacao"].sum())
    if total <= 0:
        return None
    passed = rows.loc[rows["populacao"].cumsum() >= total / 2, "idade"]
    if passed.empty:
        return None
    return int(passed.iloc[0])


def _points(data: pd.DataFrame, age: int) -> list[DetailPoint]:
    points = []
    for year in (2000, REF_YEAR, 2070):
        value = _at_age(data, year, age)
        if value is not None:
            points.append(DetailPoint(ano=year, valor=as_int(value), kind="count"))
    return points


def build(cod: int) -> list[Fact]:
    base = total_sex(territory("ds1", cod))
    men = sex(territory("ds1", cod), "h")
    women = sex(territory("ds1", cod), "m")
    modal = _modal(base, REF_YEAR)
    modal_2000 = _modal(base, 2000)
    babies = _points(base, 0)
    ninety = _points(base, 90)
    joined = _year(men, REF_YEAR)[["idade", "populacao"]].merge(
        _year(women, REF_YEAR)[["idade", "populacao"]],
        on="idade",
        suffixes=("_h", "_m"),
    )
    more_women = joined[joined["populacao_m"] > joined["populacao_h"]].sort_values("idade")
    women_age = None if more_women.empty else int(more_women.iloc[0]["idade"])
    men_90 = _at_age(men, REF_YEAR, 90)
    women_90 = _at_age(women, REF_YEAR, 90)
    ratio = None if not women_90 else round_num(men_90 / women_90 * 100, 1)
    current_babies = next((point.valor for point in babies if point.ano == REF_YEAR), 0)
    current_ninety = next((point.valor for point in ninety if point.ano == REF_YEAR), 0)
    return [
        Fact(
            id="idade_modal_2026",
            label="Idade com mais pessoas em 2026",
            value=modal or 0,
            kind="year",
            detail_values=None if modal_2000 is None else [DetailPoint(ano=2000, valor=modal_2000, kind="year")],
        ),
        Fact(id="idade_modal_2070", label="Idade com mais pessoas em 2070", value=_modal(base, 2070) or 0, kind="year"),
        Fact(id="bebes", label="Pessoas com 0 anos", value=current_babies, kind="count", detail_values=babies),
        Fact(id="noventa", label="Pessoas com 90 anos ou mais", value=current_ninety, kind="count", detail_values=ninety),
        Fact(id="idade_mulheres", label="Idade a partir da qual há mais mulheres que homens", value=women_age or 0, kind="year", reference_year=REF_YEAR),
        Fact(id="rs_90", label="Homens para cada 100 mulheres com 90+", value=ratio or 0, kind="rate", reference_year=REF_YEAR),
        Fact(id="mediana_simples", label="Idade mediana pela distribuição por idade", value=_median(base, REF_YEAR) or 0, kind="year", reference_year=REF_YEAR),
    ]
