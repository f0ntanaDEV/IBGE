"""Semeadura da ouro quando alguma fato está vazia."""

import logging
import threading

from sqlalchemy import text

from app.core.config import get_settings

logger = logging.getLogger(__name__)
_seeding = threading.Event()
_DATASETS = ("ds1", "ds2", "ds3", "ds4", "ds5")


def is_seeding() -> bool:
    """True enquanto a thread de semeadura está em curso."""
    return _seeding.is_set()


def _facts_state() -> str | None:
    """cheias se as 5 fatos têm linha, vazias se alguma está vazia, None se o banco não abriu."""
    try:
        from app.db import get_engine
        from app.repositories.schema import FACTS

        with get_engine().connect() as connection:
            for name in FACTS:
                row = connection.execute(text(f"SELECT 1 FROM `{name}` LIMIT 1")).first()
                if row is None:
                    return "vazias"
        return "cheias"
    except Exception:
        return None


def _silver_ready() -> bool:
    """True quando as 5 silvers originais já estão em disco."""
    folder = get_settings().silver_dir
    return all(any(folder.glob(f"{dataset_id}_*.parquet")) for dataset_id in _DATASETS)


def should_seed() -> bool:
    """True com AUTO_SEED e fatos vazias. Sem banco, segue a silver em disco."""
    if not get_settings().auto_seed:
        return False
    state = _facts_state()
    if state == "cheias":
        return False
    if state == "vazias":
        return True
    return not _silver_ready()


def start_seed() -> None:
    """Dispara a recarga da ouro ou, se as fatos já têm linha, a base suja que faltar."""
    if _seeding.is_set():
        return
    if should_seed():
        _seeding.set()
        threading.Thread(target=_run, name="auto-seed", daemon=True).start()
        return
    from app.tools.load_dirty import missing_dirty

    if get_settings().auto_seed and missing_dirty():
        _seeding.set()
        threading.Thread(target=_run_dirty, name="auto-seed-dirty", daemon=True).start()


def _run() -> None:
    """Recarrega a ouro pela silver. Sem Parquet, roda o ETL."""
    try:
        if _silver_ready():
            logger.info("semeadura: fatos vazias, recarregando a ouro")
            from app.tools.load_mysql_from_parquet import main

            main()
            return
        from app.tools.seed import seed_all

        seed_all()
    except Exception:
        logger.exception("semeadura automática falhou")
    finally:
        _seeding.clear()


def _run_dirty() -> None:
    """Carrega só a base suja, que não entra nas fatos."""
    try:
        from app.tools.load_dirty import main

        main()
    except Exception:
        logger.exception("semeadura da base suja falhou")
    finally:
        _seeding.clear()
