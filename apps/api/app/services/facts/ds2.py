"""Fatos dos grupos quinquenais."""

import pandas as pd

from app.services.facts.common import REF_YEAR, as_int, first_year, round_num, territory, total_sex
from app.services.facts.models import DetailPoint, Fact

OLDER = ("80-84", "85-89", "90+")


def _label(group: str) -> str:
    """Entra: group. Sai com o resultado de label."""
    if group == "90+":
        return "90+"
    start, end = group.split("-")
    return f"{int(start):02d}–{int(end):02d}" if group.startswith("0") else f"{int(start)}–{int(end)}"


def _at(data: pd.DataFrame, year: int, group: str) -> float | None:
    """Entra: data, year, group. Sai com o resultado de at."""
    rows = data[(data["ano"] == year) & (data["grupo_etario"] == group)]
    if rows.empty:
        return None
    return float(rows.iloc[0]["populacao"])


def _sum_groups(data: pd.DataFrame, year: int, groups: tuple[str, ...]) -> float:
    """Entra: data, year, groups. Sai com o resultado de sum groups."""
    rows = data[(data["ano"] == year) & (data["grupo_etario"].isin(groups))]
    return float(rows["populacao"].sum())


def _top(data: pd.DataFrame, year: int) -> str | None:
    """Entra: data, year. Sai com o resultado de top."""
    rows = data[data["ano"] == year]
    if rows.empty:
        return None
    return str(rows.loc[rows["populacao"].idxmax(), "grupo_etario"])


def build(cod: int) -> list[Fact]:
    """Entra: cod. Sai com o resultado de build."""
    data = total_sex(territory("ds2", cod))
    zero = []
    older = []
    for year in (2000, 2070):
        kids = _at(data, year, "00-04")
        elders = _sum_groups(data, year, OLDER)
        if kids is not None:
            zero.append(DetailPoint(ano=year, valor=as_int(kids), kind="count", rotulo=f"em {year}"))
        older.append(DetailPoint(ano=year, valor=as_int(elders), kind="count", rotulo=f"em {year}"))
    ratios = []
    for year in (2000, 2070):
        kids = _at(data, year, "00-04") or 0
        elders = _sum_groups(data, year, OLDER)
        if kids:
            ratios.append(DetailPoint(ano=year, valor=round_num(elders / kids, 2), kind="rate", rotulo=f"em {year}"))
    current_kids = _at(data, REF_YEAR, "00-04") or 0
    current_older = _sum_groups(data, REF_YEAR, OLDER)
    current_ratio = round_num(current_older / current_kids, 2) if current_kids else 0
    wide = data.pivot_table(index="ano", columns="grupo_etario", values="populacao", aggfunc="sum")
    older_series = wide[list(OLDER)].sum(axis=1) if set(OLDER) <= set(wide.columns) else None
    crossed = None
    if older_series is not None and "00-04" in wide.columns:
        compared = pd.DataFrame({"ano": wide.index, "older": older_series.to_numpy(), "kids": wide["00-04"].to_numpy()})
        crossed = first_year(compared, lambda row: row.older > row.kids)
    changes = []
    for group in sorted(data["grupo_etario"].dropna().unique()):
        now = _at(data, REF_YEAR, group)
        future = _at(data, 2070, group)
        if now and future is not None:
            changes.append((group, future / now - 1))
    grows = max(changes, key=lambda item: item[1]) if changes else None
    falls = min(changes, key=lambda item: item[1]) if changes else None
    tops = [_label(name) for name in (_top(data, 2000), _top(data, REF_YEAR), _top(data, 2070)) if name]
    return [
        Fact(id="maior_grupo", label="Maior grupo etário", value=" / ".join(tops), kind="raw"),
        Fact(id="zero_quatro", label="Crianças de 0 a 4 anos", value=as_int(current_kids), kind="count", detail_values=zero),
        Fact(id="oitenta", label="Pessoas com 80 anos ou mais", value=as_int(current_older), kind="count", detail_values=older),
        Fact(id="razao_80_04", label="Pessoas 80+ para cada criança de 0–4", value=current_ratio, kind="rate", detail_values=ratios),
        Fact(id="ano_80_04", label="80+ passam a superar 0–4", value=crossed or 0, kind="year"),
        Fact(
            id="mais_cresce",
            label="Grupo que mais cresce até 2070",
            value=_label(grows[0]) if grows else "",
            kind="raw",
            detail_values=None if grows is None else [DetailPoint(ano=2070, valor=round_num(abs(grows[1]), 4), kind="percent", rotulo="+{valor} até 2070")],
        ),
        Fact(
            id="mais_cai",
            label="Grupo que mais diminui até 2070",
            value=_label(falls[0]) if falls else "",
            kind="raw",
            detail_values=None if falls is None else [DetailPoint(ano=2070, valor=round_num(abs(falls[1]), 4), kind="percent", rotulo="−{valor} até 2070")],
        ),
    ]
