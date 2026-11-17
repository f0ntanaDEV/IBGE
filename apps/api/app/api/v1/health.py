from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.core.config import get_settings
from app.db import get_engine

router = APIRouter(tags=["health"])


class HealthOut(BaseModel):
    """Estado da API, do MySQL e da semeadura."""

    api: str
    mysql: Literal["ok", "vazio", "carregando", "down"]
    mysql_required: bool
    seeding: bool


def _mysql_state() -> Literal["ok", "vazio", "down"]:
    """ok se ds1 tem linha, vazio se a tabela responde sem linha, down se o banco não abre."""
    try:
        with get_engine().connect() as connection:
            row = connection.execute(text("SELECT 1 FROM ds1_populacao_idade LIMIT 1")).first()
        return "ok" if row is not None else "vazio"
    except Exception:
        return "down"


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    """GET /health. Sem parâmetros. mysql: carregando, down, vazio ou ok, nessa ordem."""
    from app.core.startup import is_seeding

    seeding = is_seeding()
    mysql: Literal["ok", "vazio", "carregando", "down"] = "carregando" if seeding else _mysql_state()
    return HealthOut(api="ok", mysql=mysql, mysql_required=get_settings().mysql_required, seeding=seeding)
