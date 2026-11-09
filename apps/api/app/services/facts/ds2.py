"""Fatos dos grupos quinquenais."""

import pandas as pd

from app.services.facts.common import REF_YEAR, as_int, first_year, round_num, territory, total_sex
from app.services.facts.models import DetailPoint, Fact

OLDER = ("80-84", "85-89", "90+")


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


def _sum_groups(data: pd.DataFrame, year: int, groups: tuple[str, ...]) -> float:
    rows = data[(data["ano"] == year) & (data["grupo_etario"].isin(groups))]
    return float(rows["populacao"].sum())


def _top(data: pd.DataFrame, year: int) -> str | None:
    rows = data[data["ano"] == year]
    if rows.empty:
        return None
    return str(rows.loc[rows["populacao"].idxmax(), "grupo_etario"])


def build(cod: int) -> list[Fact]:
    data = total_sex(territory("ds2", cod))
    zero = []
    older = []
    for year in (2000, REF_YEAR, 2070):
        kids = _at(data, year, "00-04")
        elders = _sum_groups(data, year, OLDER)
        if kids is not None:
            zero.append(DetailPoint(ano=year, valor=as_int(kids), kind="count"))
        older.append(DetailPoint(ano=year, valor=as_int(elders), kind="count"))
    ratios = []
    for year in (2000, REF_YEAR, 2070):
        kids = _at(data, year, "00-04") or 0
        elders = _sum_groups(data, year, OLDER)
        if kids:
            ratios.append(DetailPoint(ano=year, valor=round_num(elders / kids, 2), kind="rate"))
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
        Fact(id="zero_quatro", label="Crianças de 0 a 4 anos", value=next(point.valor for point in zero if point.ano == REF_YEAR), kind="count", detail_values=zero),
        Fact(id="oitenta", label="Pessoas com 80 anos ou mais", value=next(point.valor for point in older if point.ano == REF_YEAR), kind="count", detail_values=older),
        Fact(id="razao_80_04", label="Pessoas 80+ para cada criança de 0–4", value=next(point.valor for point in ratios if point.ano == REF_YEAR), kind="rate", detail_values=ratios),
        Fact(id="ano_80_04", label="80+ passam a superar 0–4", value=crossed or 0, kind="year"),
        Fact(
            id="mais_cresce",
            label="Grupo que mais cresce até 2070",
            value=_label(grows[0]) if grows else "",
            kind="raw",
            detail_values=None if grows is None else [DetailPoint(ano=2070, valor=round_num(grows[1], 4), kind="percent")],
        ),
        Fact(
            id="mais_cai",
            label="Grupo que mais diminui até 2070",
            value=_label(falls[0]) if falls else "",
            kind="raw",
            detail_values=None if falls is None else [DetailPoint(ano=2070, valor=round_num(falls[1], 4), kind="percent")],
        ),
    ]
