"""Contexto dos grupos quinquenais."""

import pandas as pd

from app.services.context.common import comma, item, people, year_rows
from app.services.context.models import ContextItem

PYR = "Pirâmide quinquenal"
COMP = "Composição por grandes faixas"
OLDER = ("80-84", "85-89", "90+")
YOUNG = ("00-04", "05-09", "10-14")


def _label(group: str) -> str:
    if group == "90+":
        return "90+"
    start, end = group.split("-")
    return f"{int(start):02d}–{int(end):02d}" if group.startswith("0") else f"{int(start)}–{int(end)}"


def _at(data: pd.DataFrame, year: int, group: str) -> float | None:
    rows = data[(data["ano"] == year) & (data["grupo_etario"] == group)]
    if rows.empty:
        return None
    return float(rows.iloc[0]["populacao"])


def _share(rows: pd.DataFrame, groups: tuple[str, ...]) -> float:
    total = float(rows["populacao"].sum())
    if not total:
        return 0
    return float(rows[rows["grupo_etario"].isin(groups)]["populacao"].sum()) / total


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    data = people("ds2", cod, sexo)
    rows = year_rows(data, ano)
    items: list[ContextItem] = []
    if not rows.empty:
        group = str(rows.loc[rows["populacao"].idxmax(), "grupo_etario"])
        items.append(item("maior_grupo", "Maior grupo etário", _label(group), "raw", PYR, "Pirâmide quinquenal"))
        kids = _share(rows, YOUNG)
        adults = _share(rows, tuple(f"{start:02d}-{start + 4:02d}" for start in range(15, 60, 5)))
        elders = 1 - kids - adults
        items.append(
            item(
                "faixas",
                "Crianças · adultos · idosos",
                f"{kids:.1%} · {adults:.1%} · {elders:.1%}".replace(".", ","),
                "raw",
                COMP,
                "Composição 100%",
                None,
                [("criancas", kids, "percent"), ("adultos", adults, "percent"), ("idosos", elders, "percent")],
            )
        )
        child = _at(data, ano, "00-04") or 0
        older = float(rows[rows["grupo_etario"].isin(OLDER)]["populacao"].sum())
        if child:
            items.append(item("razao_80_04", "Pessoas 80+ por criança de 0–4", round(older / child, 2), "rate", PYR, "Pirâmide quinquenal"))
    now = _at(data, ano, "00-04")
    base = _at(data, 2000, "00-04")
    if now is not None and base:
        items.append(
            item(
                "zero_quatro",
                "Crianças de 0–4 em relação a 2000",
                (now - base) / base,
                "percent",
                PYR,
                "Comparação 2000 × 2070",
            )
        )
    changes: list[tuple[str, float]] = []
    groups = sorted(data["grupo_etario"].dropna().unique()) if not data.empty else []
    for group in groups:
        start = _at(data, 2000, str(group))
        current = _at(data, ano, str(group))
        if start and current is not None:
            changes.append((str(group), current / start - 1))
    if changes:
        name, delta = max(changes, key=lambda pair: pair[1])
        items.append(
            item(
                "mais_cresceu",
                "Grupo que mais cresceu desde 2000",
                f"{_label(name)} ({comma(delta * 100, 1)}%)",
                "raw",
                PYR,
                "Comparação 2000 × 2070",
                None,
                [("grupo", _label(name), "raw"), ("pct", delta, "percent")],
            )
        )
    return items
