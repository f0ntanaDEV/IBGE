"""Catálogo de fatos por página, com cache até o próximo parquet."""

from app.services.facts import ds1, ds2, ds3, ds4, ds5, overview, quality
from app.services.facts.common import store
from app.services.facts.models import Fact

PAGES = {
    "overview": overview.build,
    "ds1": ds1.build,
    "ds2": ds2.build,
    "ds3": ds3.build,
    "ds4": ds4.build,
    "ds5": ds5.build,
    "quality": quality.build,
}

_cache: dict[tuple[str, int, float], list[Fact]] = {}


def cache_token() -> float:
    stamps = []
    current = store()
    for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"):
        path = current.latest_file(dataset_id, ".parquet")
        if path is not None:
            stamps.append(path.stat().st_mtime)
        report = current.latest_file(dataset_id, ".report.json")
        if report is not None:
            stamps.append(report.stat().st_mtime)
    return max(stamps) if stamps else 0


def facts_for(page: str, cod: int) -> list[Fact]:
    key = (page, 0 if page == "quality" else cod, cache_token())
    cached = _cache.get(key)
    if cached is not None:
        return cached
    built = PAGES[page](cod)
    _cache[key] = built
    return built
