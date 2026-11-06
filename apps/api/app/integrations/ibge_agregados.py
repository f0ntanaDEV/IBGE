"""Censo 2022 via API de Agregados. O código da tabela sai dos metadados, não da memória."""

import json
from pathlib import Path

import httpx

from app.core.config import API_ROOT, Settings
from app.integrations.cache import ResponseCache
from app.integrations.http import fetch_json

AGREGADOS_URL = "https://servicodados.ibge.gov.br/api/v3/agregados"
REFERENCE_PATH = API_ROOT / "ibge_reference.json"
NOTA = "A projeção corrige a subenumeração do Censo."


def load_reference() -> dict | None:
    if not REFERENCE_PATH.exists():
        return None
    return json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))


def save_reference(payload: dict) -> None:
    REFERENCE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def discover_censo(client: httpx.Client) -> dict:
    """Escolhe o agregado de população residente do Censo 2022 consultando os metadados."""
    catalog = client.get(AGREGADOS_URL).json()
    research = next(item for item in catalog if item.get("id") == "CD")
    names = [
        item["id"]
        for item in research.get("agregados", [])
        if str(item.get("nome", "")).lower().startswith("população residente")
    ]
    best: tuple[int, dict] | None = None
    for aggregate_id in names:
        meta = client.get(f"{AGREGADOS_URL}/{aggregate_id}/metadados").json()
        period = meta.get("periodicidade") or {}
        start, end = period.get("inicio"), period.get("fim")
        if start is None or end is None or not (int(start) <= 2022 <= int(end)):
            continue
        if meta.get("classificacoes"):
            continue
        variable = next(
            (
                item
                for item in meta.get("variaveis", [])
                if str(item.get("nome", "")).strip().lower() == "população residente"
            ),
            None,
        )
        if variable is None:
            continue
        score = 0
        if int(start) == 2022 and int(end) == 2022:
            score += 5
        if str(variable.get("unidade", "")).lower().startswith("pessoa"):
            score += 3
        if "densidade" not in str(meta.get("nome", "")).lower():
            score += 1
        chosen = {
            "agregado_id": str(meta.get("id") or aggregate_id),
            "variavel_id": str(variable["id"]),
            "nome": meta.get("nome"),
            "variavel": variable.get("nome"),
            "periodicidade": {"inicio": start, "fim": end},
        }
        if best is None or score > best[0]:
            best = (score, chosen)
    if best is None:
        raise RuntimeError("agregado de população residente do Censo 2022 não encontrado")
    return best[1]


def localidade(cod: int) -> str:
    if cod == 0:
        return "N1[1]"
    if 1 <= cod <= 5:
        return f"N2[{cod}]"
    return f"N3[{cod}]"


UF_IDS = "11,12,13,14,15,16,17,21,22,23,24,25,26,27,28,29,31,32,33,35,41,42,43,50,51,52,53"
CENSO_TABLE = "4709"
CENSO_VARIABLE = "93"
PROJECTION_2022 = 210_862_983


def censo_cache_path(settings: Settings) -> Path:
    return settings.data_dir / "cache" / "censo2022.json"


def read_censo_cache(settings: Settings) -> dict[str, int] | None:
    path = censo_cache_path(settings)
    if not path.exists():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        return None
    return {str(key): int(value) for key, value in raw.items()}


def write_censo_cache(settings: Settings, values: dict[str, int]) -> None:
    path = censo_cache_path(settings)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(values, ensure_ascii=False, indent=2), encoding="utf-8")


def census_gap(projection: float, census: float) -> float:
    """Diferença da projeção em relação à população recenseada, em pontos percentuais."""
    return (projection - census) / census * 100


def confirm_censo_metadata(client: httpx.Client) -> bool:
    """Confere tabela 4709, variável 93 e período 2022 nos metadados do agregado."""
    response = client.get(f"{AGREGADOS_URL}/{CENSO_TABLE}/metadados")
    response.raise_for_status()
    meta = response.json()
    if str(meta.get("id")) != CENSO_TABLE:
        return False
    period = meta.get("periodicidade") or {}
    if int(period.get("inicio", 0)) != 2022 or int(period.get("fim", 0)) != 2022:
        return False
    return any(
        str(item.get("id")) == CENSO_VARIABLE and "população residente" in str(item.get("nome", "")).lower()
        for item in meta.get("variaveis", [])
    )


def _populations(payload: object, fallback_cod: int | None = None) -> dict[str, int]:
    if not isinstance(payload, list):
        return {}
    found: dict[str, int] = {}
    for block in payload:
        for resultado in block.get("resultados") or []:
            for serie in resultado.get("series") or []:
                value = _population([{"resultados": [{"series": [serie]}]}])
                if value is None:
                    continue
                loc = serie.get("localidade") or {}
                nivel = (loc.get("nivel") or {}).get("id") if isinstance(loc.get("nivel"), dict) else None
                raw_id = loc.get("id")
                if raw_id is None:
                    if fallback_cod is not None:
                        found[str(fallback_cod)] = int(value)
                    continue
                cod = "0" if nivel == "N1" else str(int(raw_id))
                found[cod] = int(value)
    return found


def get_censo_2022(
    cod: int,
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
) -> int | None:
    """Lê data/cache/censo2022.json. A API só entra se o arquivo ainda não existe."""
    stored = read_censo_cache(settings)
    if stored is not None:
        return stored.get(str(cod))
    owns_client = client is None
    http = client or httpx.Client(timeout=settings.ibge_timeout_s)
    try:
        if not confirm_censo_metadata(http):
            return None
        url = (
            f"{AGREGADOS_URL}/{CENSO_TABLE}/periodos/2022/variaveis/{CENSO_VARIABLE}"
            f"?localidades=N1[1]|N2[1,2,3,4,5]|N3[{UF_IDS}]"
        )
        payload, ok = fetch_json(url, settings, cache, http)
        if not ok or payload is None:
            return None
        values = _populations(payload, cod)
        if not values:
            return None
        write_censo_cache(settings, values)
        return values.get(str(cod))
    except (httpx.HTTPError, ValueError, TypeError):
        return None
    finally:
        if owns_client:
            http.close()


def censo_population(
    cod: int,
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
) -> dict:
    value = get_censo_2022(cod, settings, cache, client)
    if value is None:
        return {"available": False, "projecao": None, "censo": None, "diff_pct": None, "nota": NOTA}
    return {"available": True, "censo": value, "nota": NOTA, "reference": {"agregado_id": CENSO_TABLE, "variavel_id": CENSO_VARIABLE}}


def _population(payload: object) -> float | None:
    if not isinstance(payload, list) or not payload:
        return None
    resultados = payload[0].get("resultados") or []
    if not resultados:
        return None
    series = resultados[0].get("series") or []
    if not series:
        return None
    raw = (series[0].get("serie") or {}).get("2022")
    if raw in (None, "", "-", "..."):
        return None
    text = str(raw).strip()
    if text.count(".") > 1:
        text = text.replace(".", "")
    return float(text.replace(",", "."))
