"""Notícias da Agência IBGE filtradas pelas palavras do dataset."""

from urllib.parse import quote_plus

import httpx

from app.core.config import Settings
from app.integrations.cache import ResponseCache
from app.integrations.http import fetch_json

NEWS_URL = "https://servicodados.ibge.gov.br/api/v3/noticias/?busca={term}&qtd=10"


def fetch_news(
    terms: list[str],
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
) -> dict:
    items: list[dict] = []
    seen: set[object] = set()
    available = False
    for term in terms:
        payload, ok = fetch_json(NEWS_URL.format(term=quote_plus(term)), settings, cache, client)
        available = available or ok
        for raw in (payload or {}).get("items", []) if isinstance(payload, dict) else []:
            if raw.get("id") in seen:
                continue
            seen.add(raw.get("id"))
            items.append(
                {
                    "id": raw.get("id"),
                    "titulo": raw.get("titulo"),
                    "introducao": raw.get("introducao"),
                    "data_publicacao": raw.get("data_publicacao"),
                    "link": raw.get("link"),
                    "editorias": raw.get("editorias"),
                }
            )
    return {"available": available, "items": items[:10]}
