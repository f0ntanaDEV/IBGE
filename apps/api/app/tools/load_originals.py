"""Trata as cinco bases originais e grava Parquet, csv e xlsx. Sem MySQL."""

from app.core.config import get_settings
from app.domain.dataset import load_catalog
from app.services.etl import process_dataset
from app.services.store import ParquetStore


def main() -> None:
    settings = get_settings()
    store = ParquetStore(settings.processed_dir)
    for cfg in load_catalog().datasets:
        report = process_dataset(
            cfg.id,
            source="original",
            confirm=False,
            cleaning=None,
            store=store,
            settings=settings,
        )
        print(f"original {cfg.id} rows={report.rows_after}", flush=True)


if __name__ == "__main__":
    main()
