"""Contexto dos indicadores."""

from app.services.context.common import censo_item, comma, ends, is_region, is_uf, item, ordinal, rank_of
from app.services.context.models import ContextItem
from app.services.facts.common import cell, frame, territory, ufs_do_territorio

E0 = "Esperança de vida ao nascer"
GAP = "Mulheres e homens"
TFT = "Taxa de fecundidade total"
TCV = "Crescimento vegetativo"
MAP = "Mapa da esperança de vida"
RANK = "Ranking de UFs"


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    del sexo
    data = territory("ds4", cod)
    total = cell(data, ano, "e0_t")
    men = cell(data, ano, "e0_h")
    women = cell(data, ano, "e0_m")
    items: list[ContextItem] = []
    if total is not None and men is not None and women is not None:
        items.append(
            item(
                "e0",
                "Esperança de vida: total · homens · mulheres",
                f"{comma(total, 2)} · {comma(men, 2)} · {comma(women, 2)}",
                "raw",
                E0,
                "Esperança de vida H × M",
                None,
                [("t", round(total, 2), "years"), ("h", round(men, 2), "years"), ("m", round(women, 2), "years")],
            )
        )
        items.append(item("e0_gap", "Mulheres vivem a mais", round(women - men, 2), "years", GAP, "Barras divergentes"))
    tft = cell(data, ano, "tft")
    if tft is not None:
        items.append(
            item(
                "tft",
                "Filhos por mulher",
                round(tft, 2),
                "rate",
                TFT,
                "TFT e reposição",
                "{delta} em relação à reposição",
                [("delta", round(tft - 2.1, 2), "rate")],
            )
        )
    tcv = cell(data, ano, "tcv")
    tbn = cell(data, ano, "tbn")
    tbm = cell(data, ano, "tbm")
    if tcv is not None and tbn is not None and tbm is not None:
        items.append(
            item(
                "tcv",
                "Crescimento vegetativo",
                round(tcv, 2),
                "permil",
                TCV,
                "Natalidade × mortalidade",
                "{nasc} − {obt}",
                [("nasc", round(tbn, 2), "permil"), ("obt", round(tbm, 2), "permil")],
            )
        )
    tmi = cell(data, ano, "tmi_t")
    if tmi is not None:
        items.append(item("tmi", "Mortalidade infantil", round(tmi, 2), "permil", MAP, "Mapa por UF (TMI)"))
    scope = ufs_do_territorio(0 if is_uf(cod) else cod)
    ufs = frame("ds4")
    ufs = ufs[(ufs["ano"] == ano) & (ufs["cod"].isin(scope)) & (ufs["nivel"] == "uf")]
    if is_uf(cod):
        rank = rank_of(ufs, cod, "e0_t")
        if rank is not None:
            items.append(item("posicao", "Posição entre as 27 UFs em esperança de vida", ordinal(rank), "raw", RANK, "Ranking de UFs"))
    elif cod == 0 or is_region(cod):
        pair = ends(ufs, "e0_t", 2, False)
        if pair is not None:
            high_name, high_value, low_name, low_value = pair
            items.append(
                item(
                    "posicao.alt",
                    "UF com maior e menor esperança de vida",
                    f"{high_name} {comma(high_value, 2)} · {low_name} {comma(low_value, 2)}",
                    "raw",
                    RANK,
                    "Ranking de UFs",
                )
            )
    census = censo_item(cod, E0, "Esperança de vida H × M")
    if census is not None:
        items.append(census)
    return items[:7]
