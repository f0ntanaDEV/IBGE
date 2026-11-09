"""Fatos calculados por página."""

from fastapi import APIRouter, Query

from app.core.errors import AppError
from app.services.facts.models import Fact
from app.services.facts.registry import PAGES, facts_for

router = APIRouter(tags=["facts"])


@router.get("/facts", response_model=list[Fact])
def facts(page: str = Query(...), cod: int = Query(0, ge=0)) -> list[Fact]:
    if page not in PAGES:
        raise AppError("invalid_page", "Página de fatos desconhecida", 422, {"page": page})
    if page != "quality" and cod not in range(6):
        raise AppError("territory_not_supported", "Fatos disponíveis para Brasil e regiões", 422, {"cod": cod})
    return facts_for(page, cod)
