"""Tolerância de fluxo e retenção por fonte."""

import json
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.domain.validation_rules import evaluate, rule_for
from app.services.facts.quality import validation_overview
from app.services.retention import keep_latest

ROOT = Path(__file__).resolve().parents[3]


def test_fluxo_de_50_falha_e_5_passa():
    rule = rule_for("brasil_eq_ufs:nasc_t", "ds4")
    assert evaluate(rule, 0, 2_500_000) == "ok"
    assert evaluate(rule, 5, 2_500_000) == "ok_arredondamento"
    assert evaluate(rule, 50, 2_500_000) == "falha"
    stock = rule_for("brasil_eq_ufs:pop_t", "ds4")
    assert evaluate(stock, 1, 200_000_000) == "falha"


@pytest.fixture
def _data_dir(monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(ROOT / "data"))
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    from tests.conftest import silver_completa

    if not silver_completa(ROOT):
        pytest.skip("base completa")
    yield
    get_settings.cache_clear()


@pytest.mark.full_data
def test_original_fecha_113(_data_dir):
    summary = validation_overview("original")
    assert summary["total"] == 113
    assert summary["approved"] == 113
    assert summary["failed"] == []
    assert summary["text"] == "113 de 113 aprovadas"


def test_retencao_guarda_uma_execucao_de_cada_fonte(tmp_path):
    for source, stamp in (("original", "1"), ("original", "2"), ("original", "3"), ("sujo", "1"), ("sujo", "2")):
        path = tmp_path / f"ds1_{source}_{stamp}.report.json"
        path.write_text(json.dumps({"dataset_id": "ds1", "source": source}), encoding="utf-8")
        (tmp_path / f"ds1_{source}_{stamp}.parquet").write_bytes(b"x")
    removed = keep_latest(tmp_path)
    left = sorted(path.name for path in tmp_path.glob("ds1_*"))
    assert "ds1_original_3.report.json" in left
    assert "ds1_sujo_2.report.json" in left
    assert "ds1_original_1.report.json" not in left
    assert removed
