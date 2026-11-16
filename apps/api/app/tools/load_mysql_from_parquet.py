"""Carga da camada ouro: Alembic e Parquet silver de data/silver para o MySQL."""

import json
import time

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.core.config import get_settings
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.domain.report import QualityReport
from app.services.loader import iter_parquet_batches, load_mysql
from app.services.store import ParquetStore


def wait_mysql(attempts: int = 30) -> None:
    """Espera o MySQL responder. Estoura erro se o banco não abrir."""
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
    """Sobe o Alembic e carrega a silver original no MySQL, em lotes, com o golden."""
    wait_mysql()
    command.upgrade(Config("alembic.ini"), "head")
    settings = get_settings()
    store = ParquetStore(settings.silver_dir)
    for cfg in load_catalog().datasets:
        parquet = store.latest_file(cfg.id, ".parquet")
        if parquet is None:
            raise FileNotFoundError(f"Parquet de {cfg.id} ausente")
        report = QualityReport.model_validate_json(parquet.with_suffix(".report.json").read_text(encoding="utf-8"))
        metrics_path = settings.silver_dir / f"{cfg.id}_metrics.json"
        metrics = json.loads(metrics_path.read_text(encoding="utf-8")) if metrics_path.exists() else []
        load_mysql(
            get_engine(),
            iter_parquet_batches(parquet),
            cfg.table,
            cfg.id,
            "original",
            report,
            metrics,
        )
        print(f"mysql {cfg.id} ok", flush=True)


if __name__ == "__main__":
    main()
