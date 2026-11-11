"""Todos os territórios respondem 200 nos endpoints que recebem cod."""

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.domain.territory import territorios_padrao

CODES = [row["cod"] for row in territorios_padrao()]


@pytest.fixture(scope="module")
def client():
    root = Path(__file__).resolve().parents[3]
    previous = {key: os.environ.get(key) for key in ("DATA_DIR", "AUTO_SEED", "MYSQL_REQUIRED")}
    os.environ["DATA_DIR"] = str(root / "data")
    os.environ["AUTO_SEED"] = "false"
    os.environ["MYSQL_REQUIRED"] = "false"
    get_settings.cache_clear()
    if not (root / "data" / "processed").exists():
        pytest.skip("parquet ausente")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api
    for key, value in previous.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    get_settings.cache_clear()


@pytest.mark.parametrize("cod", CODES)
def test_codigos_de_territorio(client, cod):
    calls = [
        ("/api/v1/datasets/ds4/summary", {"cod": cod, "ano": 2026}),
        ("/api/v1/datasets/ds4/data", {"cod": cod, "ano": 2026, "page_size": 1}),
        ("/api/v1/datasets/ds1/pyramid", {"cod": cod, "ano": 2026}),
        ("/api/v1/datasets/ds1/heatmap", {"cod": cod}),
        ("/api/v1/milestones", {"cod": cod}),
        ("/api/v1/context", {"page": "overview", "cod": cod, "ano": 2026, "sexo": "T"}),
    ]
    for path, params in calls:
        response = client.get(path, params=params)
        assert response.status_code == 200, (path, cod, response.text)


def test_territorio_invalido_responde_422(client):
    response = client.get("/api/v1/context", params={"page": "overview", "cod": 6, "ano": 2026, "sexo": "T"})
    assert response.status_code == 422
    assert "não existe" in response.json()["error"]["message"]
