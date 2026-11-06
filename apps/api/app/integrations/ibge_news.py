"""Notícias da Agência IBGE filtradas pelas palavras do dataset."""

import json
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote_plus

import httpx

from app.core.config import Settings
from app.integrations.cache import ResponseCache
from app.integrations.http import fetch_json

NEWS_URL = "https://servicodados.ibge.gov.br/api/v3/noticias/?busca={term}&qtd=10"
NEWS_CACHE_TTL_S = 7 * 24 * 3600
IMAGE_ORIGIN = "https://agenciadenoticias.ibge.gov.br/"


def news_cache(settings: Settings) -> ResponseCache:
    return ResponseCache(settings.data_dir / "cache", NEWS_CACHE_TTL_S)


def fetch_news(
    terms: list[str],
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
) -> dict:
    def one(term: str) -> tuple[bool, list[dict]]:
        payload, ok = fetch_json(
            NEWS_URL.format(term=quote_plus(term)),
            settings,
            cache,
            client,
            timeout=4,
            retries=0,
        )
        rows = (payload or {}).get("items", []) if isinstance(payload, dict) else []
        return ok, [_item(raw) for raw in rows]

    if len(terms) <= 1 or client is not None:
        parts = [one(term) for term in terms]
    else:
        with ThreadPoolExecutor(max_workers=min(6, len(terms))) as pool:
            parts = list(pool.map(one, terms))
    items: list[dict] = []
    seen: set[object] = set()
    available = False
    for ok, rows in parts:
        available = available or ok
        for item in rows:
            if item["id"] in seen:
                continue
            seen.add(item["id"])
            items.append(item)
    return {"available": available, "items": items[:10]}


def _item(raw: dict) -> dict:
    return {
        "id": raw.get("id"),
        "titulo": raw.get("titulo"),
        "introducao": raw.get("introducao"),
        "data_publicacao": raw.get("data_publicacao"),
        "link": raw.get("link"),
        "editorias": raw.get("editorias"),
        "imagem": _image(raw.get("imagens")),
    }


def _image(value: object) -> str | None:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            return None
    if not isinstance(value, dict):
        return None
    path = value.get("image_intro") or value.get("image_fulltext")
    if not isinstance(path, str) or not path.strip():
        return None
    path = path.replace("\\", "/").lstrip("/")
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{IMAGE_ORIGIN}{path}"
