"""Nomes de coluna e territórios IBGE."""

import re
import unicodedata

ID_COLUMNS = ("cod", "sigla", "local", "sexo", "ano", "idade", "grupo_etario")
SKIP_OUTLIER = set(ID_COLUMNS) | {"idade_inicio", "nivel", "intervalo", "intervalo_aberto"}

REGIOES = {
    1: ("N", "Norte"),
    2: ("NE", "Nordeste"),
    3: ("SE", "Sudeste"),
    4: ("S", "Sul"),
    5: ("CO", "Centro-Oeste"),
}

UFS = {
    11: ("RO", "Rondônia"),
    12: ("AC", "Acre"),
    13: ("AM", "Amazonas"),
    14: ("RR", "Roraima"),
    15: ("PA", "Pará"),
    16: ("AP", "Amapá"),
    17: ("TO", "Tocantins"),
    21: ("MA", "Maranhão"),
    22: ("PI", "Piauí"),
    23: ("CE", "Ceará"),
    24: ("RN", "Rio Grande do Norte"),
    25: ("PB", "Paraíba"),
    26: ("PE", "Pernambuco"),
    27: ("AL", "Alagoas"),
    28: ("SE", "Sergipe"),
    29: ("BA", "Bahia"),
    31: ("MG", "Minas Gerais"),
    32: ("ES", "Espírito Santo"),
    33: ("RJ", "Rio de Janeiro"),
    35: ("SP", "São Paulo"),
    41: ("PR", "Paraná"),
    42: ("SC", "Santa Catarina"),
    43: ("RS", "Rio Grande do Sul"),
    50: ("MS", "Mato Grosso do Sul"),
    51: ("MT", "Mato Grosso"),
    52: ("GO", "Goiás"),
    53: ("DF", "Distrito Federal"),
}


def safe_name(value: object) -> str:
    """snake_case sem acento; '+' vira 'mais'; não começa por dígito. Anos AAAA permanecem."""
    text = str(value).strip()
    if re.fullmatch(r"\d{4}(?:\.0+)?", text):
        return text.split(".", 1)[0]
    text = text.replace("+", " mais ")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    if not text:
        text = "col"
    if text[0].isdigit():
        text = f"n_{text}"
    return text


def nivel_de(cod: object) -> str | None:
    try:
        code = int(cod)
    except (TypeError, ValueError):
        return None
    if code == 0:
        return "brasil"
    if code in REGIOES:
        return "regiao"
    return "uf"


def regiao_cod_de(cod: object) -> int | None:
    try:
        code = int(cod)
    except (TypeError, ValueError):
        return None
    if code in UFS:
        return code // 10
    return None


def territorios_padrao() -> list[dict]:
    rows = [{"cod": 0, "sigla": "BR", "local": "Brasil", "nivel": "brasil", "regiao_cod": None}]
    for cod, (sigla, local) in REGIOES.items():
        rows.append({"cod": cod, "sigla": sigla, "local": local, "nivel": "regiao", "regiao_cod": None})
    for cod, (sigla, local) in UFS.items():
        rows.append(
            {
                "cod": cod,
                "sigla": sigla,
                "local": local,
                "nivel": "uf",
                "regiao_cod": cod // 10,
            }
        )
    return rows
