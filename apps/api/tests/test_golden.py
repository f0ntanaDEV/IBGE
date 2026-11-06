"""Valores de referência lidos de specs/DATA_PROFILE.md, conferidos nas fixtures."""

from pathlib import Path

import yaml

from app.core.config import API_ROOT
from app.domain.dataset import load_catalog
from app.services.cleaning.pipeline import prepare
from app.services.cleaning.reader import read_dataset

PROFILE = API_ROOT.parents[1] / "specs" / "DATA_PROFILE.md"
FIXTURES = API_ROOT / "tests" / "fixtures"


def _reference() -> dict:
    text = PROFILE.read_text(encoding="utf-8")
    block = text.split("```yaml", 1)[1].split("```", 1)[0]
    return yaml.safe_load(block)


def test_golden_ds1_ds4_e_ds5_na_fixture():
    ref = _reference()
    ds1, _metrics = prepare(read_dataset(FIXTURES / "ds1.xlsx", load_catalog().get("ds1")), load_catalog().get("ds1"))
    cell = ds1[(ds1["cod"] == 0) & (ds1["sexo"] == "Ambos") & (ds1["idade"] == 0) & (ds1["ano"] == 2024)]
    assert float(cell["populacao"].iloc[0]) == ref["ds1"]["brasil_ambos_idade_0"]["2024"]
    ds4, _metrics = prepare(read_dataset(FIXTURES / "ds4.xlsx", load_catalog().get("ds4")), load_catalog().get("ds4"))
    row = ds4[(ds4["cod"] == 0) & (ds4["ano"] == 2024)].iloc[0]
    assert float(row["pop_t"]) == ref["ds4"]["brasil"]["2024"]["pop_t"]
    assert float(row["tft"]) == pytest_approx(ref["ds4"]["brasil"]["2024"]["tft"])
    assert float(row["e0_t"]) == pytest_approx(ref["ds4"]["brasil"]["2024"]["e0_t"])
    ds5, _metrics = prepare(read_dataset(FIXTURES / "ds5.xlsx", load_catalog().get("ds5")), load_catalog().get("ds5"))
    life = ds5[(ds5["cod"] == 0) & (ds5["ano"] == 2022) & (ds5["idade"] == 0) & (ds5["sexo"] == "Ambos")]
    assert float(life["ex"].iloc[0]) == pytest_approx(ref["ds5"]["brasil_idade_0_2022"]["ambos_ex"])


def pytest_approx(value: float):
    import pytest

    return pytest.approx(value)
