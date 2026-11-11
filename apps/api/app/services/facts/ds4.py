"""Fatos dos indicadores."""

from app.services.facts.common import REF_YEAR, cell, first_year, frame, round_num, territory, ufs_do_territorio
from app.services.facts.models import DetailPoint, Fact


def _pair(cod: int) -> tuple[str, str] | None:
    data = frame("ds4")
    codes = ufs_do_territorio(cod)
    rows = data[(data["ano"] == REF_YEAR) & (data["cod"].isin(codes)) & (data["nivel"] == "uf")].dropna(subset=["e0_t"])
    if rows.empty:
        return None
    high = rows.loc[rows["e0_t"].idxmax()]
    low = rows.loc[rows["e0_t"].idxmin()]
    def _pt(value: float) -> str:
        return f"{round_num(value, 2):.2f}".replace(".", ",")

    return f"{high['sigla']} {_pt(float(high['e0_t']))}", f"{low['sigla']} {_pt(float(low['e0_t']))}"


def build(cod: int) -> list[Fact]:
    data = territory("ds4", cod)
    e0 = cell(data, REF_YEAR, "e0_t")
    e0h = cell(data, REF_YEAR, "e0_h")
    e0m = cell(data, REF_YEAR, "e0_m")
    e0_2000 = cell(data, 2000, "e0_t")
    e0_2070 = cell(data, 2070, "e0_t")
    e0_2019 = cell(data, 2019, "e0_t")
    e0_2021 = cell(data, 2021, "e0_t")
    tft = cell(data, REF_YEAR, "tft")
    tft_2000 = cell(data, 2000, "tft")
    below = first_year(data.dropna(subset=["tft"]), lambda row: row.tft < 2.1)
    tmi = cell(data, REF_YEAR, "tmi_t")
    tmi_2000 = cell(data, 2000, "tmi_t")
    tbn = cell(data, REF_YEAR, "tbn")
    tbm = cell(data, REF_YEAR, "tbm")
    ie = cell(data, REF_YEAR, "ie60")
    ie_2070 = cell(data, 2070, "ie60")
    ends = _pair(cod)
    return [
        Fact(
            id="e0_sexo",
            label="Esperança de vida: total, homens e mulheres",
            value=round_num(e0 or 0, 2),
            kind="years",
            reference_year=REF_YEAR,
            detail_values=[
                DetailPoint(ano=REF_YEAR, valor=round_num(e0h or 0, 2), kind="years", rotulo="homens {valor}"),
                DetailPoint(ano=REF_YEAR, valor=round_num(e0m or 0, 2), kind="years", rotulo="mulheres {valor}"),
            ],
        ),
        Fact(id="e0_gap", label="Mulheres vivem a mais", value=round_num((e0m or 0) - (e0h or 0), 2), kind="years", reference_year=REF_YEAR),
        Fact(
            id="e0_longo",
            label="Esperança de vida 2000 → 2070",
            value=round_num(e0_2070 or 0, 2),
            kind="years",
            detail_values=None if e0_2000 is None else [DetailPoint(ano=2000, valor=round_num(e0_2000, 2), kind="years")],
        ),
        Fact(
            id="e0_covid",
            label="Queda na pandemia",
            value=round_num(e0_2021 or 0, 2),
            kind="years",
            detail_values=None
            if e0_2019 is None or e0_2021 is None
            else [
                DetailPoint(ano=2019, valor=round_num(e0_2019, 2), kind="years"),
                DetailPoint(ano=2021, valor=round_num(e0_2021 - e0_2019, 2), kind="years"),
            ],
        ),
        Fact(
            id="tft",
            label="Filhos por mulher",
            value=round_num(tft or 0, 2),
            kind="rate",
            detail_values=[
                point
                for point in (
                    None if tft_2000 is None else DetailPoint(ano=2000, valor=round_num(tft_2000, 2), kind="rate"),
                    None if below is None else DetailPoint(ano=below, valor=2.1, kind="rate"),
                )
                if point is not None
            ],
        ),
        Fact(
            id="tmi",
            label="Mortalidade infantil",
            value=round_num(tmi or 0, 2),
            kind="permil",
            detail_values=None
            if tmi is None or tmi_2000 is None
            else [
                DetailPoint(ano=2000, valor=round_num(tmi_2000, 2), kind="permil"),
                DetailPoint(ano=REF_YEAR, valor=round_num(tmi / tmi_2000 - 1, 4), kind="percent"),
            ],
        ),
        Fact(
            id="natalidade_mortalidade",
            label="Nascimentos e óbitos por mil habitantes",
            value=round_num(tbn or 0, 2),
            kind="permil",
            reference_year=REF_YEAR,
            detail_values=None if tbm is None else [DetailPoint(ano=REF_YEAR, valor=round_num(tbm, 2), kind="permil")],
        ),
        Fact(
            id="obitos_nasc",
            label="Óbitos passam a superar nascimentos",
            value=first_year(data.dropna(subset=["obt_t", "nasc_t"]), lambda row: row.obt_t > row.nasc_t) or 0,
            kind="year",
        ),
        Fact(
            id="ie60",
            label="Idosos para cada 100 crianças",
            value=round_num(ie or 0, 1),
            kind="rate",
            reference_year=REF_YEAR,
            detail_values=None if ie_2070 is None else [DetailPoint(ano=2070, valor=round_num(ie_2070, 1), kind="rate")],
        ),
        Fact(id="uf_e0", label="UFs com maior e menor esperança de vida", value="" if ends is None else f"{ends[0]} · {ends[1]}", kind="raw", reference_year=REF_YEAR),
    ]
