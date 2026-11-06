"""GET com timeout, retries e cache. Se o IBGE falhar, devolve o último payload."""

import time
from collections.abc import Callable

import httpx

from app.core.config import Settings
from app.integrations.cache import ResponseCache


def fetch_json(
    url: str,
    settings: Settings,
    cache: ResponseCache,
    client: httpx.Client | None = None,
    sleep: Callable[[float], None] = time.sleep,
    timeout: float | None = None,
    retries: int | None = None,
) -> tuple[object | None, bool]:
    cached = cache.fresh(url)
    if cached is not None:
        return cached, True
    owns_client = client is None
    http = client or httpx.Client(timeout=settings.ibge_timeout_s if timeout is None else timeout)
    try:
        for attempt in range((settings.ibge_retries if retries is None else retries) + 1):
            try:
                response = http.get(url)
                response.raise_for_status()
                payload = response.json()
                cache.write(url, payload)
                return payload, True
            except (httpx.HTTPError, ValueError):
                if attempt < settings.ibge_retries:
                    sleep(0.4 * (2**attempt))
        return cache.stale(url), False
    finally:
        if owns_client:
            http.close()
