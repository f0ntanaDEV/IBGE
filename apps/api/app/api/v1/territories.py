from fastapi import APIRouter
from sqlalchemy import select

from app.db import get_engine
from app.domain.territory import territorios_padrao
from app.repositories.schema import dim_territorio

router = APIRouter(tags=["territories"])


@router.get("/territories")
def territories() -> list[dict]:
    try:
        with get_engine().connect() as connection:
            rows = connection.execute(select(dim_territorio).order_by(dim_territorio.c.cod)).mappings().all()
        if rows:
            return [dict(row) for row in rows]
    except Exception:
        pass
    return territorios_padrao()
