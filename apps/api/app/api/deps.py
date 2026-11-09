"""Dependências comuns dos routers."""

from fastapi import Query

from app.core.errors import AppError
from app.domain.territory import nivel_de, territorios_padrao


def known_territory_codes() -> set[int]:
    """Códigos de dim_territorio, ou o cadastro padrão se o banco não responder."""
    try:
        from sqlalchemy import select

        from app.db import get_engine
        from app.repositories.schema import dim_territorio

        with get_engine().connect() as connection:
            rows = connection.execute(select(dim_territorio.c.cod)).scalars().all()
        if rows:
            return {int(code) for code in rows}
    except Exception:
        pass
    return {int(row["cod"]) for row in territorios_padrao()}


def territory_params(cod: int | None = Query(None, ge=0)) -> int | None:
    """`cod=0` é o Brasil. Ausência do parâmetro continua `None`."""
    if cod is None:
        return None
    if cod not in known_territory_codes():
        raise AppError("unknown_territory", f"Território {cod} não existe", 422, {"cod": cod})
    return cod


def assert_nivel_compativel(cod: int | None, nivel: str | None) -> None:
    """`cod` e `nivel` divergentes respondem 422, nunca 500."""
    if cod is None or nivel is None:
        return
    found = nivel_de(cod)
    if found != nivel:
        raise AppError(
            "conflicting_params",
            "Território e nível não combinam",
            422,
            {"cod": cod, "nivel": nivel},
        )
