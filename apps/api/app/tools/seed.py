"""Processa as bases original e suja."""

import logging

from app.core.config import get_settings
from app.core.errors import AppError
from app.domain.dataset import load_catalog
from app.services.etl import process_dataset
from app.services.store import ParquetStore
from app.tools.make_dirty import ensure_dirty

logger = logging.getLogger(__name__)


def seed_all() -> None:
    settings = get_settings()
    store = ParquetStore(settings.processed_dir)
    for cfg in load_catalog().datasets:
        ensure_dirty(cfg, settings)
        for source in ("sujo", "original"):
            logger.info("semeando %s %s", cfg.id, source)
            try:
                process_dataset(cfg.id, source=source, confirm=True, cleaning=None, store=store, settings=settings)
            except AppError as exc:
                logger.warning("semeadura de %s %s ignorada: %s", cfg.id, source, exc.message)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    seed_all()


if __name__ == "__main__":
    main()
