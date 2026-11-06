"""Processa as cinco bases originais e as cinco sujas. Imprime o tempo da ds5."""

from time import perf_counter

from app.core.config import get_settings
from app.domain.dataset import load_catalog
from app.services.etl import process_dataset
from app.services.store import ParquetStore
from app.tools.make_dirty import dirty_frame
from app.services.cleaning.reader import read_dataset
from app.tools.sheets import write_like_source


def main() -> None:
    settings = get_settings()
    store = ParquetStore(settings.processed_dir)
    catalog = load_catalog()
    for cfg in catalog.datasets:
        raw = read_dataset(settings.raw_dir / cfg.file, cfg)
        dest = settings.raw_dir / f"{cfg.id}_sujo.xlsx"
        write_like_source(dirty_frame(raw, cfg, seed=42), dest, cfg)
        started = perf_counter()
        dirty_report = process_dataset(
            cfg.id,
            source="sujo",
            confirm=False,
            cleaning={"outlier_strategy": "cap"},
            store=store,
            settings=settings,
        )
        print(f"sujo {cfg.id} rows={dirty_report.rows_after} total_s={perf_counter() - started:.1f}", flush=True)
    for cfg in catalog.datasets:
        started = perf_counter()
        report = process_dataset(cfg.id, source="original", confirm=False, cleaning=None, store=store, settings=settings)
        elapsed = perf_counter() - started
        print(f"original {cfg.id} rows={report.rows_after} total_s={elapsed:.1f} clean_s={report.duration_s}", flush=True)
        if cfg.id == "ds5" and elapsed >= 60:
            raise SystemExit(f"ds5 levou {elapsed:.1f}s")


if __name__ == "__main__":
    main()
