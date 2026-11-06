from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.core.config import get_settings
from app.db import get_engine

router = APIRouter(tags=["health"])


class HealthOut(BaseModel):
    """Estado da API e do MySQL."""

    api: str
    mysql: str
    mysql_required: bool


@router.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    mysql = "down"
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        mysql = "ok"
    except Exception:
        mysql = "down"
    return HealthOut(api="ok", mysql=mysql, mysql_required=get_settings().mysql_required)
