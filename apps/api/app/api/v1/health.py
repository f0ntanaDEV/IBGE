from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.core.config import get_settings
from app.db import get_engine

router = APIRouter(tags=["health"])


class HealthOut(BaseModel):
    """Estado da API, do MySQL e da semeadura."""

    api: str
    mysql: str
    mysql_required: bool
    seeding: bool


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    mysql = "down"
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        mysql = "ok"
    except Exception:
        mysql = "down"
    from app.core.startup import is_seeding

    return HealthOut(api="ok", mysql=mysql, mysql_required=get_settings().mysql_required, seeding=is_seeding())
