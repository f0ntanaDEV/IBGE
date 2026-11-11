"""Notícias da Agência IBGE filtradas pelas palavras do dataset."""

import json
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote_plus

import httpx

from app.core.config import Settings
from app.integrations.cache import ResponseCache
from app.integrations.http import fetch_json

NEWS_URL = "https://servicodados.ibge.gov.br/api/v3/noticias/?busca={term}&qtd=10&page={page}"
NEWS_CACHE_TTL_S = 7 * 24 * 3600
_MAX_PAGES = 3
_PER_TERM = 30
_MAX_ITEMS = 30
IMAGE_ORIGIN = "https://agenciadenoticias.ibge.gov.br/"
_GENERIC = {
    "anos",
    "brasil",
    "dados",
    "idade",
    "ibge",
    "numero",
    "pais",
    "pessoas",
    "populacao",
    "vida",
}


def news_cache(settings: Settings) -> ResponseCache:
    return ResponseCache(settings.data_dir / "cache", NEWS_CACHE_TTL_S)


def fetch_news(
    terms: list[str],
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
) -> dict:
    def one(term: str) -> tuple[bool, list[dict]]:
        needles = _needles(term)
        matched: list[dict] = []
        loose: list[dict] = []
        ok_any = False
        for page in range(1, _MAX_PAGES + 1):
            payload, ok = fetch_json(
                NEWS_URL.format(term=quote_plus(f'"{term.strip()}"'), page=page),
                settings,
                cache,
                client,
                timeout=4,
                retries=0,
            )
            ok_any = ok_any or ok
            rows = (payload or {}).get("items", []) if isinstance(payload, dict) else []
            if not rows:
                break
            for raw in rows:
                item = _item(raw)
                loose.append(item)
                if _related(item, needles):
                    matched.append(item)
            if len(matched) >= _PER_TERM:
                break
        return ok_any, matched or loose

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
    return {"available": available, "items": items[:_MAX_ITEMS]}


def _needles(term: str) -> list[str]:
    words = re.findall(r"[A-Za-zÀ-ÿ]{4,}", term)
    tokens = []
    for word in words:
        token = _fold(word)
        if len(token) < 4 or token in _GENERIC or token in tokens:
            continue
        tokens.append(token)
    return tokens


def _related(item: dict, needles: list[str]) -> bool:
    if not needles:
        return True
    blob = _fold(f"{item.get('titulo') or ''} {item.get('introducao') or ''}")
    return any(token in blob for token in needles)


def _fold(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return text.lower()


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
