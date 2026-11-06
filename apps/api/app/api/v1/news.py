from fastapi import APIRouter, Query

from app.core.config import get_settings
from app.integrations.cache import ResponseCache
from app.integrations.ibge_agregados import NOTA, censo_population, census_gap
from app.services.analytics import projection_2022
from app.services.store import ParquetStore

router = APIRouter(tags=["reference"])


@router.get("/reference/censo-2022")
def censo(cod: int = Query(0)) -> dict:
    settings = get_settings()
    cache = ResponseCache(settings.data_dir / "cache", settings.cache_ttl_s)
    census = censo_population(cod, settings, cache)
    projection = None
    try:
        projection = projection_2022(ParquetStore(settings.processed_dir).get("ds4"), cod)
    except Exception:
        projection = None
    diff = None
    if projection is not None and census.get("censo") not in (None, 0):
        diff = census_gap(projection, census["censo"])
    return {
        "available": census["available"],
        "projecao": projection,
        "censo": census.get("censo"),
        "diff_pct": diff,
        "nota": NOTA,
    }
