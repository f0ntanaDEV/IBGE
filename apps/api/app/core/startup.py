"""Semeadura das bases quando ainda não houve execução bem-sucedida."""

import logging
import threading

from sqlalchemy import text

from app.core.config import get_settings

logger = logging.getLogger(__name__)
_seeding = threading.Event()


def is_seeding() -> bool:
    return _seeding.is_set()


def _has_success() -> bool | None:
    """True se há sucesso, False se o banco respondeu vazio, None se o banco não abriu."""
    try:
        from app.db import get_engine

        with get_engine().connect() as connection:
            row = connection.execute(text("SELECT 1 FROM etl_runs WHERE status = 'success' LIMIT 1")).first()
        return row is not None
    except Exception:
        return None


def should_seed() -> bool:
    settings = get_settings()
    if not settings.auto_seed:
        return False
    found = _has_success()
    if found is True:
        return False
    if found is False:
        return True
    folder = settings.processed_dir
    ready = all(any(folder.glob(f"{dataset_id}_*.parquet")) for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"))
    return not ready


def start_seed() -> None:
    if not should_seed() or _seeding.is_set():
        return
    _seeding.set()
    threading.Thread(target=_run, name="auto-seed", daemon=True).start()


def _run() -> None:
    try:
        from app.tools.seed import seed_all

        seed_all()
    except Exception:
        logger.exception("semeadura automática falhou")
    finally:
        _seeding.clear()
