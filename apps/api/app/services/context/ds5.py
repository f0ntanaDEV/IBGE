"""Contexto das tábuas de mortalidade."""

import pandas as pd

from app.services.context.common import comma, item, people
from app.services.context.models import ContextItem

LX = "Curva de sobrevivência"
EX = "Esperança de vida por idade"
NQX = "Probabilidade de morte"


def _row(data: pd.DataFrame, year: int, age: int) -> pd.Series | None:
    rows = data[(data["ano"] == year) & (data["idade"] == age)]
    if rows.empty:
        return None
    return rows.iloc[0]


def _num(data: pd.DataFrame, year: int, age: int, column: str) -> float | None:
    row = _row(data, year, age)
    if row is None or pd.isna(row[column]):
        return None
    return float(row[column])


def _half(data: pd.DataFrame, year: int) -> float | None:
    rows = data[data["ano"] == year].dropna(subset=["lx"]).sort_values("idade")
    previous = None
    for row in rows.itertuples(index=False):
        current = float(row.lx)
        if previous is not None and previous[1] > 50000 >= current and previous[1] != current:
            span = previous[1] - current
            fraction = (previous[1] - 50000) / span
            return float(previous[0]) + fraction * (float(row.idade) - float(previous[0]))
        previous = (int(row.idade), current)
    return None


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    chosen = people("ds5", cod, sexo)
    men = people("ds5", cod, "h")
    women = people("ds5", cod, "m")
    items: list[ContextItem] = []
    born = _num(chosen, ano, 0, "ex")
    at60 = _num(chosen, ano, 60, "ex")
    if born is not None and at60 is not None:
        items.append(
            item(
                "ex",
                "Esperança de vida ao nascer · aos 60",
                f"{comma(born, 2)} · {comma(at60, 2)}",
                "raw",
                EX,
                "Esperança de vida por idade",
                None,
                [("e0", round(born, 2), "years"), ("e60", round(at60, 2), "years")],
            )
        )
    live60 = _num(chosen, ano, 60, "lx")
    live80 = _num(chosen, ano, 80, "lx")
    if live60 is not None and live80 is not None:
        items.append(
            item(
                "sobreviventes",
                "De cada 100 nascidos, chegam aos 60 · aos 80",
                f"{comma(live60 / 1000, 1)} · {comma(live80 / 1000, 1)}",
                "raw",
                LX,
                "Curva de sobrevivência",
                None,
                [("a60", round(live60 / 1000, 1), "raw"), ("a80", round(live80 / 1000, 1), "raw")],
            )
        )
    half = _half(chosen, ano)
    if half is not None:
        items.append(item("idade_metade", "Idade em que metade dos nascidos já morreu", round(half, 1), "years", LX, "Curva de sobrevivência"))
    risk = _num(chosen, ano, 0, "nqx")
    if risk is not None:
        items.append(item("q0", "Risco de morrer antes de 1 ano", round(risk * 1000, 2), "permil", NQX, "Probabilidade de morte por idade"))
    ratios: list[tuple[int, float]] = []
    for age in range(0, 90):
        male = _num(men, ano, age, "nqx")
        female = _num(women, ano, age, "nqx")
        if male and female:
            ratios.append((age, male / female))
    if ratios:
        age, ratio = max(ratios, key=lambda pair: pair[1])
        start = (age // 5) * 5
        items.append(
            item(
                "sobremort",
                "Maior excesso de mortalidade masculina",
                f"{start}–{start + 4} anos · {comma(ratio, 2)}×",
                "raw",
                NQX,
                "Probabilidade de morte por idade",
                None,
                [("idade", f"{start}–{start + 4}", "raw"), ("razao", round(ratio, 2), "rate")],
            )
        )
    return items
