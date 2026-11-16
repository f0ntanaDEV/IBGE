"""A suíte não dispara a semeadura das planilhas completas."""

import os
from pathlib import Path

import pytest

from app.core.config import get_settings

REPO = Path(__file__).resolve().parents[3]
AMOSTRA = REPO / "data" / "silver" / "amostra"


def silver_completa(root: Path | None = None) -> bool:
    """True quando há Parquet ds1 fora da amostra."""
    base = root or REPO
    for folder in (base / "data" / "silver", base / "data" / "processed"):
        if any(path for path in folder.glob("ds1_*.parquet") if "amostra" not in path.parts):
            return True
    return False


@pytest.fixture(autouse=True)
def _sem_semeadura(monkeypatch):
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _amostra_sem_silver_completa(monkeypatch, request):
    """Aponta a silver para a amostra quando o Parquet completo não está no disco."""
    if request.node.get_closest_marker("full_data") or request.node.get_closest_marker("mysql"):
        yield
        return
    if os.environ.get("SILVER_DIR") or os.environ.get("DATA_DIR"):
        yield
        return
    if silver_completa() or not (AMOSTRA / "ds1.parquet").exists():
        yield
        return
    monkeypatch.setenv("SILVER_DIR", str(AMOSTRA))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
