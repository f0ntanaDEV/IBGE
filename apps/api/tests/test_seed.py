"""Semeadura deixa o relatório de qualidade preenchido."""

import pandas as pd
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.main import create_app
from app.tools.seed import seed_all
from app.tools.sheets import write_like_source


def test_seed_publica_quality_report(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.setenv("MYSQL_REQUIRED", "false")
    get_settings.cache_clear()
    get_engine.cache_clear()
    catalog = load_catalog()
    sheets = {
        "ds1": pd.DataFrame({"IDADE": [0, 0], "SEXO": ["Ambos", "Ambos"], "CÓD.": [0, 11], "SIGLA": ["BR", "RO"], "LOCAL": ["Brasil", "Rondônia"], "2024": [10, 4]}),
        "ds2": pd.DataFrame({"GRUPO ETÁRIO": ["00-04", "00-04"], "SEXO": ["Ambos", "Ambos"], "CÓD.": [0, 11], "SIGLA": ["BR", "RO"], "LOCAL": ["Brasil", "Rondônia"], "2024": [10, 4]}),
        "ds3": pd.DataFrame({"ANO": [2024, 2024], "CÓD.": [0, 11], "SIGLA": ["BR", "RO"], "LOCAL": ["Brasil", "Rondônia"], "POP_T": [10, 4]}),
        "ds4": pd.DataFrame({"ANO": [2024, 2024], "CÓD.": [0, 11], "SIGLA": ["BR", "RO"], "LOCAL": ["Brasil", "Rondônia"], "POP_T": [10, 4], "NASC_T": [1, 1], "OBT_T": [1, 1]}),
        "ds5": pd.DataFrame({"IDADE": [0, 0], "SEXO": ["Ambos", "Ambos"], "ANO": [2024, 2024], "CÓD.": [0, 11], "SIGLA": ["BR", "RO"], "LOCAL": ["Brasil", "Rondônia"], "NQX": [0.01, 0.02], "LX": [100000, 100000], "EX": [70, 68]}),
    }
    for dataset_id, frame in sheets.items():
        cfg = catalog.get(dataset_id)
        write_like_source(frame, tmp_path / "raw" / cfg.file, cfg)
        write_like_source(frame, tmp_path / "raw" / f"{dataset_id}_sujo.xlsx", cfg)
    seed_all()
    app = create_app()
    with TestClient(app) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["seeding"] is False
        for dataset_id in sheets:
            report = client.get(f"/api/v1/datasets/{dataset_id}/quality-report", params={"source": "original"})
            assert report.status_code == 200, report.text
            body = report.json()
            assert body["rows_in"] > 0
            assert body["source"] == "original"
            assert isinstance(body["validations"], list)
            if dataset_id != "ds5":
                assert body["validations"]
    get_settings.cache_clear()
    get_engine.cache_clear()
