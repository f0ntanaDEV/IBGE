"""Trata as bases sujas que ainda não têm relatório. Uso no deploy."""

from app.core.config import get_settings
from app.domain.dataset import load_catalog
from app.services.etl import process_dataset
from app.services.store import ParquetStore
from app.tools.make_dirty import ensure_dirty


def missing_dirty() -> list[str]:
    folder = get_settings().processed_dir
    missing = []
    for cfg in load_catalog().datasets:
        found = False
        for path in folder.glob(f"{cfg.id}_*.report.json"):
            text = path.read_text(encoding="utf-8")
            if '"source": "sujo"' in text or '"source":"sujo"' in text:
                found = True
                break
        if not found:
            missing.append(cfg.id)
    return missing


def main() -> None:
    settings = get_settings()
    store = ParquetStore(settings.processed_dir)
    for dataset_id in missing_dirty():
        cfg = load_catalog().get(dataset_id)
        ensure_dirty(cfg, settings)
        report = process_dataset(dataset_id, source="sujo", confirm=True, cleaning=None, store=store, settings=settings)
        print(f"sujo {dataset_id} rows={report.rows_after}", flush=True)


if __name__ == "__main__":
    main()
