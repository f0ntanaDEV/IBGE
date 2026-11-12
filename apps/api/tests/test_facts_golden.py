"""Valores de referência de fatos.md para Brasil e Nordeste."""

from pathlib import Path

import pytest

from app.core.config import get_settings
from app.services.facts.registry import facts_for

ROOT = Path(__file__).resolve().parents[3]
EXPECTED = {
    ("overview", 0): {"pop_ref": 214211951, "pico": 2041, "pop_2070": 199228708, "idosos_criancas": 2029, "obitos_nasc": 2042, "e0": 77.03, "tft": 1.51, "id_med": 36.1},
    ("overview", 2): {"pop_ref": 57366981, "pico": 2037, "pop_2070": 51017220, "idosos_criancas": 2031, "obitos_nasc": 2043, "e0": 76.60, "tft": 1.50, "id_med": 35.0},
    ("ds1", 0): {"idade_modal_2026": 41, "idade_modal_2070": 55, "bebes": 2386874, "noventa": 814288, "idade_mulheres": 28, "rs_90": 48.2, "mediana_simples": 36},
    ("ds1", 2): {"idade_modal_2026": 41, "idade_modal_2070": 70, "bebes": 657383, "noventa": 229307, "idade_mulheres": 26, "rs_90": 50.9, "mediana_simples": 34},
    ("ds2", 0): {"maior_grupo": "15–19 / 40–44 / 55–59", "zero_quatro": 12380087, "oitenta": 5184146, "razao_80_04": 0.42, "ano_80_04": 2041, "mais_cresce": "90+", "mais_cai": "05–09"},
    ("ds2", 2): {"maior_grupo": "10–14 / 40–44 / 65–69", "zero_quatro": 3416421, "oitenta": 1388477, "razao_80_04": 0.41, "ano_80_04": 2042, "mais_cresce": "90+", "mais_cai": "05–09"},
    ("ds3", 0): {"p_0_14": 0.192, "p_60": 0.171, "p_80": 0.024, "cruz_60": 2029, "cruz_65": 2036, "rd_min": 2017, "uf_mais_idosa": "RS", "uf_mais_jovem": "RR"},
    ("ds3", 2): {"p_0_14": 0.198, "p_60": 0.158, "p_80": 0.024, "cruz_60": 2031, "cruz_65": 2037, "rd_min": 2026, "uf_mais_idosa": "PB", "uf_mais_jovem": "MA"},
    ("ds4", 0): {"e0_sexo": 77.03, "e0_gap": 6.52, "e0_longo": 83.91, "e0_covid": 72.78, "tft": 1.51, "tmi": 11.83, "natalidade_mortalidade": 11.17, "obitos_nasc": 2042, "ie60": 89.06, "uf_e0": "DF 80,03 · AP 74,84"},
    ("ds4", 2): {"e0_sexo": 76.60, "e0_gap": 7.22, "e0_longo": 83.81, "e0_covid": 73.23, "tft": 1.50, "tmi": 12.96, "natalidade_mortalidade": 11.49, "obitos_nasc": 2043, "ie60": 79.72, "uf_e0": "RN 78,19 · AL 74,91"},
    ("ds5", 0): {"e0": 77.03, "e60": 22.82, "q0": 11.83, "l60": 86.4, "l80": 54.6, "l80_longo": 71.8, "q20": 10.85, "sobremort": "20–24"},
    ("ds5", 2): {"e0": 76.60, "e60": 23.08, "q0": 12.96, "l60": 85.2, "l80": 54.7, "l80_longo": 71.8, "q20": 14.59, "sobremort": "20–24"},
    ("quality", 0): {"linhas": 918456, "duplicatas": 0, "nulos_estruturais": 99, "nulos_imputados": 0},
}


def _close(found, expected) -> bool:
    if isinstance(expected, str):
        return found == expected
    if isinstance(expected, int) and not isinstance(expected, bool):
        return found == expected
    return abs(float(found) - float(expected)) <= 0.01


@pytest.fixture(autouse=True)
def _data_dir(monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(ROOT / "data"))
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    if not (ROOT / "data" / "processed").exists():
        pytest.skip("parquet ausente")
    yield
    get_settings.cache_clear()


def test_uf_nao_tem_fatos():
    from fastapi.testclient import TestClient

    from app.main import create_app

    with TestClient(create_app()) as client:
        response = client.get("/api/v1/facts", params={"page": "overview", "cod": 29})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "territory_not_supported"


@pytest.mark.parametrize(("page", "cod"), list(EXPECTED))
def test_fatos_golden(page, cod):
    built = {fact.id: fact.value for fact in facts_for(page, cod)}
    assert 6 <= len(built) <= 10
    for fact_id, expected in EXPECTED[(page, cod)].items():
        assert _close(built[fact_id], expected), (fact_id, built[fact_id], expected)
