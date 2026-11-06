import json
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.errors import AppError
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.domain.territory import UFS
from app.main import create_app
from app.services.analytics import (
    apply_filters,
    heatmap,
    map_values,
    milestones,
    parse_faixa_list,
    parse_int_list,
    scatter,
    slope,
)
from app.tools.sheets import write_like_source


def test_malha_uf_versionada_cabe_em_150kb():
    path = Path(__file__).resolve().parents[3] / "apps" / "web" / "public" / "geo" / "br-uf.json"
    assert path.stat().st_size <= 150_000
    document = json.loads(path.read_text(encoding="utf-8"))
    codes = [item["properties"]["cod"] for item in document["features"]]
    assert document["type"] == "FeatureCollection"
    assert codes == sorted(UFS)
    assert {item["properties"]["sigla"] for item in document["features"]} == {sigla for sigla, _nome in UFS.values()}


def test_listas_rejeitam_token_vazio_e_faixa_invalida():
    with pytest.raises(AppError):
        parse_int_list("12,,31", "cod")
    with pytest.raises(AppError):
        parse_faixa_list("0-14,jovem")
    assert parse_int_list("12,31,35", "cod") == [12, 31, 35]
    assert parse_faixa_list("0-14,60+") == ["0-14", "60+"]


def test_filtros_de_lista_em_idade_e_grupo():
    frame = pd.DataFrame(
        {
            "cod": [11, 31, 35, 11],
            "ano": [2024, 2024, 2050, 2050],
            "idade": [0, 10, 70, 3],
            "populacao": [1, 2, 3, 4],
        }
    )
    selected = apply_filters(frame, cod="11,35", anos="2024,2050", faixa="0-14,60+")
    assert set(selected["populacao"]) == {1, 3, 4}
    groups = pd.DataFrame(
        {
            "cod": [0, 0],
            "ano": [2024, 2024],
            "grupo_etario": ["00-04", "60+"],
            "populacao": [8, 9],
        }
    )
    aged = apply_filters(groups, faixa="60+")
    assert aged["populacao"].tolist() == [9]


def test_mapa_calor_dispersao_slope_e_marcos():
    ages = pd.DataFrame(
        {
            "cod": [0, 0, 11, 11],
            "sigla": ["BR", "BR", "RO", "RO"],
            "local": ["Brasil", "Brasil", "Rondônia", "Rondônia"],
            "nivel": ["brasil", "brasil", "uf", "uf"],
            "ano": [2024, 2025, 2024, 2025],
            "idade": [0, 0, 0, 80],
            "sexo": ["Ambos", "Ambos", "Homens", "Homens"],
            "populacao": [100, 80, 5, 7],
        }
    )
    mapped = map_values(ages, "populacao", 2024)
    assert mapped["items"] == [{"cod": 11, "sigla": "RO", "local": "Rondônia", "valor": 5}]
    cells = heatmap(ages, 0, "Ambos")["cells"]
    assert cells[0]["valor"] == 100
    indicators = pd.DataFrame(
        {
            "cod": [0, 0, 0, 31, 31, 31],
            "sigla": ["BR", "BR", "BR", "MG", "MG", "MG"],
            "local": ["Brasil", "Brasil", "Brasil", "Minas Gerais", "Minas Gerais", "Minas Gerais"],
            "nivel": ["brasil", "brasil", "brasil", "uf", "uf", "uf"],
            "ano": [2020, 2024, 2030, 2020, 2024, 2030],
            "pop_t": [10, 12, 9, 4, 6, 5],
            "e0_t": [70, 74, 76, 71, 75, 73],
            "tft": [2.2, 1.8, 1.5, 2.0, 1.6, 1.4],
            "nasc_t": [20, 18, 10, 8, 7, 4],
            "obt_t": [15, 16, 12, 5, 6, 6],
            "n_0_14_t": [8, 7, 4, 3, 2, 1],
            "n_60_mais_t": [2, 6, 9, 1, 2, 4],
            "rdt65": [60, 48, 55, 62, 49, 47],
        }
    )
    points = scatter(indicators, [2024])["items"]
    assert len(points) == 1
    assert points[0]["cod"] == 31
    assert points[0]["e0"] == 75
    slopes = slope(indicators, "e0_t", 2020, 2030)["items"]
    assert slopes[0]["delta"] == 2
    facts = milestones({"ds1": ages, "ds3": indicators, "ds4": indicators}, 0)
    assert facts["pico"]["ano"] == 2024
    assert facts["pico"]["populacao"] == 100
    assert facts["cruzamento_idosos_jovens"]["ano"] == 2030
    assert facts["tft_abaixo_reposicao"]["ano"] == 2024
    assert facts["nascimentos_abaixo_obitos"]["ano"] == 2030
    assert facts["bonus"]["ano_inicio"] == 2024
    assert facts["bonus"]["ano_fim"] == 2024
    assert facts["bonus"]["ponto_virada"] == 2024
    ratio = indicators.assign(ano=[2024, 2025, 2026, 2024, 2025, 2026], rdt65=[0.6, 0.4, 0.7, 0.6, 0.4, 0.3])
    bonus = milestones({"ds4": ratio}, 31)["bonus"]
    assert bonus["limiar"] == 0.5
    assert bonus["ano_inicio"] == 2025
    assert bonus["ano_fim"] == 2026


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("MYSQL_REQUIRED", "false")
    get_settings.cache_clear()
    get_engine.cache_clear()
    cfg = load_catalog().get("ds1")
    frame = pd.DataFrame(
        {
            "IDADE": [0, 0, 1, 1],
            "SEXO": ["Homens", "Mulheres", "Homens", "Mulheres"],
            "CÓD.": [0, 0, 11, 11],
            "SIGLA": ["BR", "BR", "RO", "RO"],
            "LOCAL": ["Brasil", "Rondônia", "Rondônia", "Rondônia"],
            "2024": [30, 20, 5, 4],
            "2025": [33, 22, 6, 5],
        }
    )
    write_like_source(frame, tmp_path / "raw" / cfg.file, cfg)
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()
    get_engine.cache_clear()


def test_endpoints_de_lista_mapa_calor_e_marcos(client):
    done = client.post("/api/v1/datasets/ds1/process", json={"source": "original", "confirm": True})
    assert done.status_code == 200
    page = client.get("/api/v1/datasets/ds1/data", params={"cod": "0,11", "anos": "2024", "faixa": "0"})
    assert page.status_code == 200
    assert page.json()["total"] == 2
    invalid = client.get("/api/v1/datasets/ds1/data", params={"cod": "12,,31"})
    assert invalid.status_code == 422
    mapped = client.get("/api/v1/datasets/ds1/map", params={"metric": "populacao", "ano": 2024})
    assert mapped.json()["items"][0]["valor"] == 9
    heat = client.get("/api/v1/datasets/ds1/heatmap", params={"cod": 0, "sexo": "Homens"})
    assert heat.json()["cells"][0]["valor"] == 30
    other = client.get("/api/v1/datasets/ds4/heatmap")
    assert other.status_code == 422
    marks = client.get("/api/v1/milestones", params={"cod": 0})
    assert marks.json()["pico"]["ano"] == 2025
    assert marks.json()["tft_abaixo_reposicao"]["ano"] is None
