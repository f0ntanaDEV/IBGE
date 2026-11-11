"""Fatos das tábuas de mortalidade."""

import pandas as pd

from app.services.facts.common import REF_YEAR, round_num, sex, territory, total_sex
from app.services.facts.models import DetailPoint, Fact


def _row(data: pd.DataFrame, year: int, age: int) -> pd.Series | None:
    rows = data[(data["ano"] == year) & (data["idade"] == age)]
    if rows.empty:
        return None
    return rows.iloc[0]


def _ex(data: pd.DataFrame, year: int, age: int) -> float | None:
    row = _row(data, year, age)
    if row is None or pd.isna(row["ex"]):
        return None
    return float(row["ex"])


def _lx(data: pd.DataFrame, year: int, age: int) -> float | None:
    row = _row(data, year, age)
    if row is None or pd.isna(row["lx"]):
        return None
    return float(row["lx"]) / 1000


def _q(data: pd.DataFrame, year: int, age: int) -> float | None:
    row = _row(data, year, age)
    if row is None or pd.isna(row["nqx"]):
        return None
    return float(row["nqx"]) * 1000


def build(cod: int) -> list[Fact]:
    base = total_sex(territory("ds5", cod))
    men = sex(territory("ds5", cod), "h")
    women = sex(territory("ds5", cod), "m")
    e60 = _ex(base, REF_YEAR, 60)
    e60h = _ex(men, REF_YEAR, 60)
    e60m = _ex(women, REF_YEAR, 60)
    l80 = _lx(base, REF_YEAR, 80)
    l80h = _lx(men, REF_YEAR, 80)
    l80m = _lx(women, REF_YEAR, 80)
    l80_2000 = _lx(base, 2000, 80)
    l80_2070 = _lx(base, 2070, 80)
    qh = _q(men, REF_YEAR, 20)
    qm = _q(women, REF_YEAR, 20)
    ratios = []
    for age in range(0, 90):
        male = _q(men, REF_YEAR, age)
        female = _q(women, REF_YEAR, age)
        if male and female:
            ratios.append((age, male / female))
    excess = max(ratios, key=lambda item: item[1]) if ratios else None
    band = "" if excess is None else f"{excess[0]}–{excess[0] + 4}"
    return [
        Fact(id="e0", label="Esperança de vida ao nascer", value=round_num(_ex(base, REF_YEAR, 0) or 0, 2), kind="years", reference_year=REF_YEAR),
        Fact(
            id="e60",
            label="Anos de vida restantes aos 60 (total · H · M)",
            value=round_num(e60 or 0, 2),
            kind="years",
            reference_year=REF_YEAR,
            detail_values=[
                DetailPoint(ano=REF_YEAR, valor=round_num(e60h or 0, 2), kind="years", rotulo="homens {valor}"),
                DetailPoint(ano=REF_YEAR, valor=round_num(e60m or 0, 2), kind="years", rotulo="mulheres {valor}"),
            ],
        ),
        Fact(id="q0", label="Risco de morrer antes de 1 ano", value=round_num(_q(base, REF_YEAR, 0) or 0, 2), kind="permil", reference_year=REF_YEAR),
        Fact(id="l60", label="De cada 100 nascidos, chegam aos 60", value=round_num(_lx(base, REF_YEAR, 60) or 0, 1), kind="rate", reference_year=REF_YEAR),
        Fact(
            id="l80",
            label="De cada 100 nascidos, chegam aos 80 (total · H · M)",
            value=round_num(l80 or 0, 1),
            kind="rate",
            reference_year=REF_YEAR,
            detail_values=[
                DetailPoint(ano=REF_YEAR, valor=round_num(l80h or 0, 1), kind="rate", rotulo="homens {valor}"),
                DetailPoint(ano=REF_YEAR, valor=round_num(l80m or 0, 1), kind="rate", rotulo="mulheres {valor}"),
            ],
        ),
        Fact(
            id="l80_longo",
            label="Chegam aos 80: 2000 → 2070",
            value=round_num(l80_2070 or 0, 1),
            kind="rate",
            detail_values=None if l80_2000 is None else [DetailPoint(ano=2000, valor=round_num(l80_2000, 1), kind="rate")],
        ),
        Fact(
            id="q20",
            label="Risco de morrer entre 20 e 24 anos (H · M)",
            value=round_num(qh or 0, 2),
            kind="permil",
            reference_year=REF_YEAR,
            detail_values=None if qm is None else [DetailPoint(ano=REF_YEAR, valor=round_num(qm, 2), kind="permil")],
        ),
        Fact(
            id="sobremort",
            label="Maior excesso de mortalidade masculina",
            value=band,
            kind="raw",
            reference_year=REF_YEAR,
            detail_values=None if excess is None else [DetailPoint(ano=REF_YEAR, valor=round_num(excess[1], 2), kind="rate")],
        ),
    ]
