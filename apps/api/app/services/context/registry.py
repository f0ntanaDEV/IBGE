"""Catálogo do card Contexto, com cache até o próximo parquet e JSON pré-aquecido."""

import json

from app.core.config import get_settings
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
_static: dict[tuple[str, int], dict[str, list]] = {}


def context_for(page: str, cod: int, ano: int, sexo: str) -> list[ContextItem]:
    kind = sex_code(sexo)
    if kind == "t":
        warmed = _warmed(page, int(ano), int(cod))
        if warmed is not None:
            return warmed
    key = (page, int(cod), int(ano), kind, cache_token())
    cached = _cache.get(key)
    if cached is not None:
        return cached
    built = PAGES[page](int(cod), int(ano), kind)
    _cache[key] = built
    return built


def _warmed(page: str, ano: int, cod: int) -> list[ContextItem] | None:
    bucket = _static.get((page, ano))
    if bucket is None:
        path = get_settings().data_dir / "cache" / "context" / f"{page}_{ano}.json"
        if not path.exists():
            _static[(page, ano)] = {}
            return None
        bucket = json.loads(path.read_text(encoding="utf-8"))
        _static[(page, ano)] = bucket
    rows = bucket.get(str(cod))
    if not rows:
        return None
    return [ContextItem.model_validate(item) for item in rows]
