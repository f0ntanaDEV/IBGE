"""A base suja é detectada e os valores imputados voltam perto do original."""

import json
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.domain.dataset import load_catalog
from app.domain.published_report import publish_report
from app.services.cleaning.pipeline import prepare, run_frame
from app.services.cleaning.reader import read_dataset

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(autouse=True)
def _data_dir(monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(ROOT / "data"))
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.parametrize("dataset_id", ["ds1", "ds2", "ds3", "ds4", "ds5"])
def test_recuperacao_da_base_suja(dataset_id):
    settings = get_settings()
    cfg = load_catalog().get(dataset_id)
    dirty_path = settings.raw_dir / f"{dataset_id}_sujo.xlsx"
    manifest_path = settings.raw_dir / f"{dataset_id}_sujo.manifest.json"
    if not dirty_path.exists() or not manifest_path.exists():
        pytest.skip("base suja ausente")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cleaned, _metrics, report = run_frame(read_dataset(dirty_path, cfg), cfg, source="sujo")
    published = publish_report(report.model_dump())
    assert published.nulls.total_imputed == sum(manifest["nulls_injected"].values())
    assert report.duplicates_removed["exact"] + report.duplicates_removed["key"] == manifest["exact_duplicates"] + manifest["key_duplicates"]
    assert report.ids_recovered == manifest["recoverable_ids"]
    detected = sum(sum(reasons.values()) for reasons in report.outliers.values())
    injected = sum(manifest["outliers"]["columns"].values())
    assert detected >= injected * 0.9
    original, _labels = prepare(read_dataset(settings.raw_dir / cfg.file, cfg), cfg)
    keys = [column for column in cfg.key if column in original.columns and column in cleaned.columns]
    metric = "populacao" if "populacao" in original.columns else "pop_t" if "pop_t" in original.columns else "ex"
    left = original[keys + [metric]].rename(columns={metric: "orig"})
    right = cleaned[keys + [metric, "is_outlier"]].rename(columns={metric: "novo"})
    merged = left.merge(right, on=keys)
    merged = merged[(merged["is_outlier"] == False) & merged["orig"].notna() & (merged["orig"] != 0)]  # noqa: E712
    if merged.empty:
        return
    gap = (merged["novo"] - merged["orig"]).abs() / merged["orig"].abs()
    assert float(gap.quantile(0.99)) <= 0.01
