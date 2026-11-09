from fastapi import APIRouter
from sqlalchemy import select

from app.db import get_engine
from app.domain.territory import territorios_padrao
from app.repositories.schema import dim_territorio

router = APIRouter(tags=["territories"])


@router.get("/territories")
def territories() -> list[dict]:
    """O cadastro padrão completa o banco. Assim o Brasil permanece se o MySQL o perdeu."""
    merged = {int(row["cod"]): dict(row) for row in territorios_padrao()}
    known_siglas = {row["sigla"] for row in merged.values()}
    try:
        with get_engine().connect() as connection:
            rows = connection.execute(select(dim_territorio).order_by(dim_territorio.c.cod)).mappings().all()
        for row in rows:
            item = dict(row)
            code = int(item["cod"])
            if code not in merged and item.get("sigla") in known_siglas:
                continue
            merged[code] = item
    except Exception:
        pass
    return [merged[cod] for cod in sorted(merged)]
