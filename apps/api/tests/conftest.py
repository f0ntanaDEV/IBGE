"""A suíte não dispara a semeadura das planilhas completas."""

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def _sem_semeadura(monkeypatch):
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
