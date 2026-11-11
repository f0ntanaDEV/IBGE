"""Dicionário de métricas do painel."""

from fastapi import APIRouter

from app.domain.metricas import load_metricas

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
def read_metrics() -> list[dict]:
    return [item.model_dump() for item in load_metricas()]
