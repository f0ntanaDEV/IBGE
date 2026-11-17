"""Engine preguiçoso. A conexão só abre quando a carga ou o healthcheck pedem."""

from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    """Base."""
    pass


@lru_cache
def get_engine() -> Engine:
    """Entra: nenhum argumento. Sai com o resultado de get engine."""
    from app.core.config import get_settings

    settings = get_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"connect_timeout": 3},
    )


@lru_cache
def get_sessionmaker():
    """Entra: nenhum argumento. Sai com o resultado de get sessionmaker."""
    return sessionmaker(bind=get_engine(), expire_on_commit=False)
