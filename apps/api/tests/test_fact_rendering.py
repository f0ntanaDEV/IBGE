"""Rótulos dos fatos para Brasil e Nordeste."""

from pathlib import Path

import pytest

from app.core.config import get_settings
from app.services.facts.registry import facts_for
from app.services.facts.render import render_fact

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(autouse=True)
def _data_dir(monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(ROOT / "data"))
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    if not (ROOT / "data" / "processed").exists():
        pytest.skip("parquet ausente")
    yield
    get_settings.cache_clear()


def _by_id(page: str, cod: int) -> dict:
    return {fact.id: render_fact(fact) for fact in facts_for(page, cod)}


def test_rotulos_do_brasil():
    overview = _by_id("overview", 0)
    assert "em relação ao pico" in overview["pop_2070"]
    assert "2070:" not in overview["pop_2070"]
    ds4 = _by_id("ds4", 0)
    assert ds4["e0_covid"].startswith("76,22 (2019)")
    assert "queda de 3,44 anos" in ds4["e0_covid"]
    assert "2026:" not in ds4["tmi"]
    assert ds4["natalidade_mortalidade"] == "nascimentos 11,17 · óbitos 7,26 por mil"
    ds3 = _by_id("ds3", 0)
    assert ds3["uf_mais_idosa"] == "RS · 21,8%"
    ds5 = _by_id("ds5", 0)
    assert ds5["q20"] == "homens 10,85 · mulheres 2,67 por mil"
    assert ds5["sobremort"] == "20–24 anos · 4,07×"
    assert "(2000)" in ds5["l80_longo"] and "(2070)" in ds5["l80_longo"]
    ds1 = _by_id("ds1", 0)
    assert "2026:" not in ds1["bebes"]
    assert ds1["rs_90"].startswith("48,2")
    ds2 = _by_id("ds2", 0)
    assert "2026:" not in ds2["zero_quatro"]
    assert "+576,0% até 2070" in ds2["mais_cresce"]


def test_nenhum_fato_repete_2026_nem_o_mesmo_numero():
    for page in ("overview", "ds1", "ds2", "ds3", "ds4", "ds5"):
        for cod in (0, 2):
            for fact in facts_for(page, cod):
                text = render_fact(fact)
                if fact.reference_year == 2026:
                    assert "2026:" not in text
                numbers = [token for token in text.replace("·", " ").split() if any(ch.isdigit() for ch in token)]
                assert len(numbers) == len(set(numbers))
