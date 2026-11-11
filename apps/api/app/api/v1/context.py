"""Card Contexto por página, território, ano e sexo."""

from fastapi import APIRouter, Query

from app.api.deps import known_territory_codes
from app.core.errors import AppError
from app.services.context.models import ContextItem
from app.services.context.registry import PAGES, context_for

router = APIRouter(prefix="/context", tags=["context"])


@router.get("", response_model=list[ContextItem])
def read_context(
    page: str = Query(...),
    cod: int = Query(0, ge=0, le=53),
    ano: int = Query(2026, ge=2000, le=2070),
    sexo: str = Query("T"),
) -> list[ContextItem]:
    if page not in PAGES:
        raise AppError("unknown_page", "Página sem card de contexto", 422, {"page": page})
    if sexo not in {"T", "H", "M"}:
        raise AppError("invalid_sexo", "Sexo deve ser T, H ou M", 422, {"sexo": sexo})
    if cod not in known_territory_codes():
        raise AppError("unknown_territory", f"Território {cod} não existe", 422, {"cod": cod})
    return context_for(page, cod, ano, sexo)
