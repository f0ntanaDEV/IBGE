"""Fatos dos grupos etários."""

from app.services.facts.common import REF_YEAR, cell, first_year, frame, round_num, territory, ufs_do_territorio
from app.services.facts.models import DetailPoint, Fact


def _share(column: str, year: int, data) -> float | None:
    value = cell(data, year, column)
    if value is None:
        return None
    return round_num(value, 3)


def _uf(cod: int, column: str, highest: bool) -> tuple[str, float] | None:
    data = frame("ds3")
    codes = ufs_do_territorio(cod)
    rows = data[(data["ano"] == REF_YEAR) & (data["cod"].isin(codes)) & (data["nivel"] == "uf")].dropna(subset=[column])
    if rows.empty:
        return None
    row = rows.loc[rows[column].idxmax() if highest else rows[column].idxmin()]
    return str(row["sigla"]), round_num(float(row[column]), 3)


def build(cod: int) -> list[Fact]:
    data = territory("ds3", cod)
    ds4 = territory("ds4", cod)
    p60_now = _share("p_60_mais_t", REF_YEAR, data)
    p60_later = _share("p_60_mais_t", 2070, data)
    p80_now = _share("p_80_mais_t", REF_YEAR, data)
    p80_later = _share("p_80_mais_t", 2070, data)
    older = _uf(cod, "p_60_mais_t", True)
    younger = _uf(cod, "p_60_mais_t", False)
    dependency = ds4.dropna(subset=["rdt65"])
    low = None if dependency.empty else dependency.loc[dependency["rdt65"].idxmin()]
    return [
        Fact(id="p_0_14", label="Crianças (0–14) na população", value=_share("p_0_14_t", REF_YEAR, data) or 0, kind="percent", reference_year=REF_YEAR),
        Fact(
            id="p_60",
            label="Idosos (60+) na população",
            value=p60_now or 0,
            kind="percent",
            reference_year=REF_YEAR,
            detail_values=None if p60_later is None else [DetailPoint(ano=2070, valor=p60_later, kind="percent")],
        ),
        Fact(
            id="p_80",
            label="Pessoas com 80+ na população",
            value=p80_now or 0,
            kind="percent",
            reference_year=REF_YEAR,
            detail_values=None if p80_later is None else [DetailPoint(ano=2070, valor=p80_later, kind="percent")],
        ),
        Fact(id="cruz_60", label="60+ passam a superar 0–14", value=first_year(data, lambda row: row.n_60_mais_t > row.n_0_14_t) or 0, kind="year"),
        Fact(id="cruz_65", label="65+ passam a superar 0–14", value=first_year(data, lambda row: row.n_65_mais_t > row.n_0_14_t) or 0, kind="year"),
        Fact(
            id="rd_min",
            label="Menor razão de dependência (0–14 e 65+)",
            value=0 if low is None else int(low["ano"]),
            kind="year",
            detail_values=None if low is None else [DetailPoint(ano=int(low["ano"]), valor=round_num(float(low["rdt65"]), 1), kind="rate")],
        ),
        Fact(
            id="uf_mais_idosa",
            label="UF com maior participação de 60+",
            value="" if older is None else older[0],
            kind="raw",
            reference_year=REF_YEAR,
            detail_values=None if older is None else [DetailPoint(ano=REF_YEAR, valor=older[1], kind="percent")],
        ),
        Fact(
            id="uf_mais_jovem",
            label="UF com menor participação de 60+",
            value="" if younger is None else younger[0],
            kind="raw",
            reference_year=REF_YEAR,
            detail_values=None if younger is None else [DetailPoint(ano=REF_YEAR, valor=younger[1], kind="percent")],
        ),
    ]
