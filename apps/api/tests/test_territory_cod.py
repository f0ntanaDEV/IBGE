"""Regressão: Brasil (cod 0) continua válido depois de outro território."""

import pandas as pd
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.main import create_app
from app.tools.sheets import write_like_source


def _client(tmp_path, monkeypatch) -> TestClient:
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("MYSQL_REQUIRED", "false")
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()
    get_engine.cache_clear()
    cfg = load_catalog().get("ds1")
    frame = pd.DataFrame(
        {
            "IDADE": [0, 0, 0, 0, 0, 0],
            "SEXO": ["Homens", "Mulheres", "Homens", "Mulheres", "Homens", "Mulheres"],
            "CÓD.": [0, 0, 2, 2, 29, 29],
            "SIGLA": ["BR", "BR", "NE", "NE", "BA", "BA"],
            "LOCAL": ["Brasil", "Brasil", "Nordeste", "Nordeste", "Bahia", "Bahia"],
            "2024": [100, 50, 40, 10, 7, 3],
        }
    )
    write_like_source(frame, tmp_path / "raw" / cfg.file, cfg)
    app = create_app()
    client = TestClient(app)
    done = client.post("/api/v1/datasets/ds1/process", json={"source": "original", "confirm": True})
    assert done.status_code == 200
    return client


def test_brasil_outro_brasil(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    sequence = [0, 29, 0, 2, 0]
    seen = []
    for code in sequence:
        summary = client.get("/api/v1/datasets/ds1/summary", params={"ano": 2024, "cod": code})
        pyramid = client.get("/api/v1/datasets/ds1/pyramid", params={"ano": 2024, "cod": code})
        heat = client.get("/api/v1/datasets/ds1/heatmap", params={"cod": code})
        page = client.get("/api/v1/datasets/ds1/data", params={"ano": 2024, "cod": code})
        marks = client.get("/api/v1/milestones", params={"cod": code})
        census = client.get("/api/v1/reference/censo-2022", params={"cod": code})
        for response in (summary, pyramid, heat, page, marks, census):
            assert response.status_code == 200, response.text
        assert page.json()["total"] > 0
        assert summary.json()["kpis"][0]["value"] is not None
        assert pyramid.json()
        assert heat.json()["cod"] == code
        seen.append(summary.json()["kpis"][0]["value"])
    assert seen[0] == seen[2] == seen[4]
    assert seen[0] != seen[1]
    assert seen[0] != seen[3]
    missing = client.get("/api/v1/datasets/ds1/summary", params={"cod": 99})
    assert missing.status_code == 422
    conflict = client.get("/api/v1/datasets/ds1/data", params={"cod": 0, "nivel": "uf"})
    assert conflict.status_code == 422
    assert conflict.json()["error"]["code"] == "conflicting_params"
    get_settings.cache_clear()
    get_engine.cache_clear()
