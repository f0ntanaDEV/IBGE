"""Contexto da população por idade."""

import pandas as pd

from app.services.context.common import censo_item, item, people, year_rows
from app.services.context.models import ContextItem

CHART = "Pirâmide etária"
HEAT = "Idade por ano"


def _sum(rows: pd.DataFrame, low: int, high: int | None) -> float:
    if rows.empty:
        return 0
    ages = rows["idade"]
    chosen = rows[ages >= low] if high is None else rows[ages.between(low, high)]
    return float(chosen["populacao"].sum())


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    base = people("ds1", cod, sexo)
    both_h = people("ds1", cod, "h")
    both_m = people("ds1", cod, "m")
    rows = year_rows(base, ano)
    men = year_rows(both_h, ano)
    women = year_rows(both_m, ano)
    items: list[ContextItem] = []
    men_total = float(men["populacao"].sum()) if not men.empty else 0
    women_total = float(women["populacao"].sum()) if not women.empty else 0
    if women_total:
        items.append(
            item("razao_sexo", "Homens para cada 100 mulheres", round(men_total / women_total * 100, 1), "raw", CHART, "Pirâmide etária")
        )
    modal = rows[rows["idade"].between(0, 89)]
    if not modal.empty:
        age = int(modal.loc[modal["populacao"].idxmax(), "idade"])
        items.append(item("idade_modal", "Idade com mais pessoas", age, "year", CHART, "Pirâmide etária · Mapa de calor", "{idade} anos", [("idade", age, "raw")]))
    total = float(rows["populacao"].sum()) if not rows.empty else 0
    if total:
        young = _sum(rows, 0, 14) / total
        active = _sum(rows, 15, 64) / total
        older = _sum(rows, 65, None) / total
        items.append(
            item(
                "estrutura",
                "Crianças · idade ativa · idosos",
                f"{young:.1%} · {active:.1%} · {older:.1%}".replace(".", ","),
                "raw",
                CHART,
                "Pirâmide etária",
                None,
                [("criancas", young, "percent"), ("ativa", active, "percent"), ("idosos", older, "percent")],
            )
        )
        ordered = rows.sort_values("idade")
        passed = ordered.loc[ordered["populacao"].cumsum() >= total / 2, "idade"]
        if not passed.empty:
            items.append(item("mediana", "Idade mediana", int(passed.iloc[0]), "year", CHART, "Pirâmide etária", "{idade} anos", [("idade", int(passed.iloc[0]), "raw")]))
    older90 = rows[rows["idade"] == 90]
    if not older90.empty:
        items.append(item("noventa", "Pessoas com 90 anos ou mais", int(round(float(older90.iloc[0]["populacao"]))), "count", HEAT, "Mapa de calor"))
    census = censo_item(cod, CHART, "Pirâmide etária")
    if census is not None:
        items.append(census)
    return items
