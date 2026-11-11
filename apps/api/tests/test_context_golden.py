"""Valores de referência do card Contexto em 2026."""

import pytest

from app.core.config import get_settings
from app.services.context.registry import context_for

ROOT_READY = True


@pytest.fixture(autouse=True)
def _data_dir(monkeypatch):
    from pathlib import Path

    root = Path(__file__).resolve().parents[3]
    monkeypatch.setenv("DATA_DIR", str(root / "data"))
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    if not (root / "data" / "processed").exists():
        pytest.skip("parquet ausente")
    yield
    get_settings.cache_clear()


def by_id(page: str, cod: int) -> dict:
    return {item.id: item for item in context_for(page, cod, 2026, "T")}


def test_contexto_brasil_e_bahia():
    brasil = by_id("overview", 0)
    bahia = by_id("overview", 29)
    assert brasil["pop"].value == 214211951
    assert bahia["pop"].value == 14889472
    assert brasil["var_anual"].value == 790914
    assert bahia["var_anual"].value == 18565
    assert brasil["pico"].value == 2041
    assert bahia["pico"].value == 2034
    assert brasil["cresc_natural"].value == 837215
    assert bahia["migracao"].value == -34722
    assert bahia["participacao"].value == pytest.approx(0.07, abs=0.001)
    assert brasil["participacao.alt"].value == "Sudeste"
    for page in ("overview", "ds1", "ds2", "ds3", "ds4", "ds5"):
        for cod in (0, 29):
            items = context_for(page, cod, 2026, "T")
            assert 5 <= len(items) <= 7
            assert all(item.value not in (None, "—") for item in items)


def test_contexto_numeros_da_spec():
    ds1 = by_id("ds1", 0)
    assert ds1["razao_sexo"].value == pytest.approx(95.1, abs=0.05)
    assert ds1["idade_modal"].value == 41
    assert ds1["noventa"].value == 814288
    ds2 = by_id("ds2", 29)
    assert ds2["maior_grupo"].value == "40–44"
    assert ds2["razao_80_04"].value == pytest.approx(0.46, abs=0.01)
    ds4 = by_id("ds4", 29)
    assert ds4["e0_gap"].value == pytest.approx(7.79, abs=0.01)
    assert ds4["posicao"].value == "18ª"
    ds5 = by_id("ds5", 0)
    assert ds5["q0"].value == pytest.approx(11.83, abs=0.01)
    assert "4,07" in str(ds5["sobremort"].value)
