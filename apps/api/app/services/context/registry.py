"""Catálogo do card Contexto, com cache até o próximo parquet."""

from app.services.context import ds1, ds2, ds3, ds4, ds5, overview
from app.services.context.common import sex_code
from app.services.context.models import ContextItem
from app.services.facts.registry import cache_token

PAGES = {
    "overview": overview.build,
    "ds1": ds1.build,
    "ds2": ds2.build,
    "ds3": ds3.build,
    "ds4": ds4.build,
    "ds5": ds5.build,
}

_cache: dict[tuple, list[ContextItem]] = {}


def context_for(page: str, cod: int, ano: int, sexo: str) -> list[ContextItem]:
    kind = sex_code(sexo)
    key = (page, int(cod), int(ano), kind, cache_token())
    cached = _cache.get(key)
    if cached is not None:
        return cached
    built = PAGES[page](int(cod), int(ano), kind)
    _cache[key] = built
    return built
