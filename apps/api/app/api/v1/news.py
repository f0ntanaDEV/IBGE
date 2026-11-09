from fastapi import APIRouter, Depends

from app.api.deps import territory_params
from app.core.config import get_settings
from app.integrations.cache import ResponseCache
from app.integrations.ibge_agregados import NOTA, censo_population, census_gap
from app.services.analytics import projection_2022
from app.services.store import ParquetStore

router = APIRouter(tags=["reference"])


@router.get("/reference/censo-2022")
def censo(cod: int | None = Depends(territory_params)) -> dict:
    settings = get_settings()
    cache = ResponseCache(settings.data_dir / "cache", settings.cache_ttl_s)
    code = 0 if cod is None else cod
    census = censo_population(code, settings, cache)
    projection = None
    try:
        projection = projection_2022(ParquetStore(settings.processed_dir).get("ds4"), code)
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
