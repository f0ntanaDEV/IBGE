"""Marcos demográficos calculados das bases tratadas."""

from fastapi import APIRouter, Depends

from app.api.deps import territory_params
from app.core.config import get_settings
from app.core.errors import AppError
from app.services.analytics import milestones
from app.services.store import ParquetStore

router = APIRouter(tags=["milestones"])


@router.get("/milestones")
def dataset_milestones(cod: int | None = Depends(territory_params)) -> dict:
    store = ParquetStore(get_settings().processed_dir)
    frames = {}
    for dataset_id in ("ds1", "ds3", "ds4"):
        try:
            frames[dataset_id] = store.get(dataset_id)
        except AppError as exc:
            if exc.status_code != 404:
                raise
    if not frames:
        raise AppError("not_found", "Nenhuma base tratada para calcular os marcos", 404)
    code = 0 if cod is None else cod
    return milestones(frames, code)
