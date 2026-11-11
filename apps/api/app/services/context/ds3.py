"""Contexto dos grupos etários."""

from app.services.context.common import censo_item, ends, is_region, is_uf, item, ordinal, rank_of
from app.services.context.models import ContextItem
from app.services.facts.common import cell, frame, territory, ufs_do_territorio

LINE = "0–14 e 60+"
RANK = "UFs por % de 60+"
BONUS = "Bônus demográfico"


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    del sexo
    data = territory("ds3", cod)
    ds4 = territory("ds4", cod)
    young = cell(data, ano, "p_0_14_t")
    older = cell(data, ano, "p_60_mais_t")
    items: list[ContextItem] = []
    if young is not None and older is not None:
        items.append(
            item(
                "proporcoes",
                "Crianças (0–14) · idosos (60+)",
                f"{young * 100:.1f}% · {older * 100:.1f}%".replace(".", ","),
                "raw",
                LINE,
                "0–14 e 60+",
                None,
                [("jovens", young, "percent"), ("idosos", older, "percent")],
            )
        )
    series = data.dropna(subset=["p_60_mais_t", "p_0_14_t"]).sort_values("ano")
    crossed = None
    for row in series.itertuples(index=False):
        if row.p_60_mais_t > row.p_0_14_t:
            crossed = int(row.ano)
            break
    if crossed is not None:
        delta = crossed - ano
        if delta > 0:
            when = f"em {delta} anos"
        elif delta < 0:
            when = f"há {-delta} anos"
        else:
            when = "neste ano"
        items.append(item("cruzamento", "Idosos superam crianças", crossed, "year", LINE, "0–14 e 60+", when))
    total = cell(ds4, ano, "rdt65")
    youth = cell(ds4, ano, "rdj65")
    aged = cell(ds4, ano, "rdi65")
    if total is not None:
        items.append(item("rd_total", "Razão de dependência total", round(total, 1), "raw", BONUS, "Bônus demográfico"))
    if youth is not None and aged is not None:
        items.append(
            item(
                "rd_partes",
                "Dependência de jovens · de idosos",
                f"{youth:.1f} · {aged:.1f}".replace(".", ","),
                "raw",
                BONUS,
                "Bônus demográfico",
                None,
                [("jovens", round(youth, 1), "raw"), ("idosos", round(aged, 1), "raw")],
            )
        )
    dependency = ds4.dropna(subset=["rdt65"])
    if not dependency.empty:
        low = dependency.loc[dependency["rdt65"].idxmin()]
        items.append(
            item(
                "rd_min",
                "Menor razão de dependência da série",
                int(low["ano"]),
                "year",
                BONUS,
                "Bônus demográfico",
                "{valor}",
                [("valor", round(float(low["rdt65"]), 1), "raw")],
            )
        )
    codes = ufs_do_territorio(0 if is_uf(cod) else cod)
    ufs = frame("ds3")
    ufs = ufs[(ufs["ano"] == ano) & (ufs["cod"].isin(codes)) & (ufs["nivel"] == "uf")]
    if is_uf(cod):
        rank = rank_of(ufs, cod, "p_60_mais_t")
        if rank is not None:
            items.append(item("posicao", "Posição entre as 27 UFs em % de 60+", ordinal(rank), "raw", RANK, "Ranking de UFs"))
    elif cod == 0 or is_region(cod):
        pair = ends(ufs, "p_60_mais_t", 1, True)
        if pair is not None:
            high_name, high_value, low_name, low_value = pair
            items.append(
                item(
                    "posicao.alt",
                    "UF com maior e menor % de 60+",
                    f"{high_name} {high_value * 100:.1f}% · {low_name} {low_value * 100:.1f}%".replace(".", ","),
                    "raw",
                    RANK,
                    "Ranking de UFs",
                )
            )
    census = censo_item(cod, LINE, "0–14 e 60+")
    if census is not None:
        items.append(census)
    return items[:7]
