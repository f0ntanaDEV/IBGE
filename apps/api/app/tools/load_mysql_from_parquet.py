"""Aplica o Alembic e carrega no MySQL o Parquet já tratado."""

import json
import time

import pandas as pd
from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.core.config import get_settings
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.domain.report import QualityReport
from app.services.loader import load_mysql
from app.services.store import ParquetStore


def wait_mysql(attempts: int = 30) -> None:
    last: Exception | None = None
    for _ in range(attempts):
        try:
            with get_engine().connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except Exception as exc:
            last = exc
            time.sleep(2)
    raise RuntimeError("MySQL indisponível") from last


def main() -> None:
    wait_mysql()
    command.upgrade(Config("alembic.ini"), "head")
    settings = get_settings()
    store = ParquetStore(settings.processed_dir)
    for cfg in load_catalog().datasets:
        parquet = store.latest_file(cfg.id, ".parquet")
        if parquet is None:
            raise FileNotFoundError(f"Parquet de {cfg.id} ausente")
        report = QualityReport.model_validate_json(parquet.with_suffix(".report.json").read_text(encoding="utf-8"))
        metrics = json.loads((settings.processed_dir / f"{cfg.id}_metrics.json").read_text(encoding="utf-8"))
        frame = pd.read_parquet(parquet)
        load_mysql(get_engine(), frame, cfg.table, cfg.id, "original", report, metrics)
        del frame
        print(f"mysql {cfg.id} ok", flush=True)


if __name__ == "__main__":
    main()
