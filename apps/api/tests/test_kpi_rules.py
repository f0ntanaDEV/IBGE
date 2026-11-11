"""Regras de status contra os valores de referência da spec."""

from app.domain.kpi_rules import evaluate
from app.domain.metricas import load_metricas


def test_dicionario_carrega():
    assert any(item.id == "e0_t" and item.casas_decimais == 2 for item in load_metricas())


def test_referencia_brasil_2026():
    assert evaluate("crescimento_anual", {"yoy_pct": 0.37})["status"] == "warn"
    assert evaluate("esperanca_vida", {"value": 77.03, "prev": 76.82})["status"] == "good"
    assert evaluate("filhos_por_mulher", {"value": 1.51})["status"] == "bad"
    assert evaluate("envelhecimento", {"value": 89.06})["status"] == "warn"
    assert evaluate("mortalidade_infantil", {"value": 11.83})["status"] == "warn"
    assert evaluate("idosos_populacao", {"value": 17.1})["status"] == "warn"
    assert evaluate("criancas_10_anos", {"delta10_pp": -3.0})["status"] == "warn"
    assert evaluate("dependencia", {"value": 45.2})["status"] == "warn"
    assert evaluate("idade_mediana", {"value": 36.1})["status"] == "warn"
    assert evaluate("chegam_80", {"value": 54.6})["status"] == "warn"
    assert evaluate("vida_60", {"value": 22.82})["status"] == "good"


def test_bahia_esperanca():
    assert evaluate("esperanca_vida", {"value": 76.26, "brazil": 77.03})["status"] == "warn"
