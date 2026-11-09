"""Fatos da visão geral."""

from app.services.facts.common import REF_YEAR, as_int, cell, first_year, round_num, territory
from app.services.facts.models import DetailPoint, Fact


def build(cod: int) -> list[Fact]:
    ds4 = territory("ds4", cod)
    ds3 = territory("ds3", cod)
    pop = cell(ds4, REF_YEAR, "pop_t")
    peak_year = None
    peak_value = None
    if not ds4.empty:
        ordered = ds4.dropna(subset=["pop_t"]).sort_values("pop_t")
        if not ordered.empty:
            row = ordered.iloc[-1]
            peak_year = int(row["ano"])
            peak_value = as_int(row["pop_t"])
    pop_2070 = cell(ds4, 2070, "pop_t")
    e0 = cell(ds4, REF_YEAR, "e0_t")
    e0_2000 = cell(ds4, 2000, "e0_t")
    tft = cell(ds4, REF_YEAR, "tft")
    below = first_year(ds4.dropna(subset=["tft"]), lambda row: row.tft < 2.1)
    med = cell(ds4, REF_YEAR, "id_med")
    med_2000 = cell(ds4, 2000, "id_med")
    med_2070 = cell(ds4, 2070, "id_med")
    older = first_year(ds3, lambda row: row.n_60_mais_t > row.n_0_14_t)
    deaths = first_year(ds4.dropna(subset=["obt_t", "nasc_t"]), lambda row: row.obt_t > row.nasc_t)
    facts = [
        Fact(id="pop_ref", label="População em 2026", value=as_int(pop or 0), kind="count", reference_year=REF_YEAR),
        Fact(
            id="pico",
            label="Pico populacional",
            value=peak_year or 0,
            kind="year",
            detail_values=None if peak_value is None or peak_year is None else [DetailPoint(ano=peak_year, valor=peak_value, kind="count")],
        ),
        Fact(
            id="pop_2070",
            label="População em 2070",
            value=as_int(pop_2070 or 0),
            kind="count",
            reference_year=2070,
            detail_values=None
            if peak_value is None or pop_2070 is None
            else [DetailPoint(ano=2070, valor=round_num(pop_2070 / peak_value - 1, 4), kind="percent")],
        ),
        Fact(id="idosos_criancas", label="Idosos (60+) passam a superar crianças (0–14)", value=older or 0, kind="year"),
        Fact(id="obitos_nasc", label="Óbitos passam a superar nascimentos", value=deaths or 0, kind="year"),
        Fact(
            id="e0",
            label="Esperança de vida ao nascer",
            value=round_num(e0 or 0, 2),
            kind="years",
            reference_year=REF_YEAR,
            detail_values=None if e0 is None or e0_2000 is None else [DetailPoint(ano=2000, valor=round_num(e0 - e0_2000, 2), kind="years")],
        ),
        Fact(
            id="tft",
            label="Filhos por mulher",
            value=round_num(tft or 0, 2),
            kind="rate",
            reference_year=REF_YEAR,
            detail_values=None if below is None else [DetailPoint(ano=below, valor=2.1, kind="rate")],
        ),
        Fact(
            id="id_med",
            label="Idade mediana",
            value=round_num(med or 0, 1),
            kind="years",
            reference_year=REF_YEAR,
            detail_values=[
                point
                for point in (
                    None if med_2000 is None else DetailPoint(ano=2000, valor=round_num(med_2000, 1), kind="years"),
                    None if med_2070 is None else DetailPoint(ano=2070, valor=round_num(med_2070, 1), kind="years"),
                )
                if point is not None
            ],
        ),
    ]
    return facts
