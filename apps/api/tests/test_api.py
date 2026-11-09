from io import BytesIO
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db import get_engine
from app.domain.dataset import load_catalog
from app.main import create_app
from app.services.analytics import compute_claims, summary
from app.tools.sheets import write_like_source


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


def test_health_territorios_e_datasets(client):
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["api"] == "ok"
    territories = client.get("/api/v1/territories")
    assert len(territories.json()) == 33
    listing = client.get("/api/v1/datasets")
    assert [item["id"] for item in listing.json()] == ["ds1", "ds2", "ds3", "ds4", "ds5"]


def test_upload_rejeita_extensao_e_coluna(client):
    rejected = client.post(
        "/api/v1/datasets/ds1/upload",
        files={"file": ("notas.txt", b"abc", "text/plain")},
    )
    assert rejected.status_code == 422
    assert rejected.json()["error"]["code"] == "invalid_file"
    missing = client.post(
        "/api/v1/datasets/ds1/upload",
        files={"file": ("tab.xlsx", _xlsx_without_local(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert missing.status_code == 422
    assert "local" in missing.json()["error"]["details"]["missing_columns"]


def test_processar_exige_confirmacao_para_alterar_oficial(client):
    blocked = client.post("/api/v1/datasets/ds1/process", json={"source": "original", "cleaning": {"outlier_strategy": "cap"}})
    assert blocked.status_code == 409
    done = client.post("/api/v1/datasets/ds1/process", json={"source": "original", "confirm": True, "cleaning": {"outlier_strategy": "cap"}})
    assert done.status_code == 200
    body = done.json()
    assert body["rows_after"] == 8
    page = client.get("/api/v1/datasets/ds1/data", params={"page_size": 2, "ano": 2024, "sexo": "Homens"})
    assert page.status_code == 200
    assert page.json()["total"] == 2
    too_big = client.get("/api/v1/datasets/ds1/data", params={"page_size": 500})
    assert too_big.status_code == 422
    pyramid = client.get("/api/v1/datasets/ds1/pyramid", params={"ano": 2024, "cod": 0})
    assert pyramid.json()[0]["homens"] == 30
    assert pyramid.json()[0]["mulheres"] == 20
    summary_body = client.get("/api/v1/datasets/ds1/summary", params={"ano": 2024, "cod": 0})
    assert summary_body.json()["kpis"][0]["value"] == 50
    download = client.get("/api/v1/datasets/ds1/download", params={"format": "csv"})
    assert download.status_code == 200
    assert "populacao" in download.text


def test_claims_e_piramide_ds2():
    frame = pd.DataFrame(
        {
            "cod": [0, 0, 0],
            "ano": [2024, 2025, 2026],
            "sexo": ["Ambos", "Ambos", "Ambos"],
            "populacao": [10, 30, 20],
        }
    )
    claims = compute_claims(frame, load_catalog().get("ds1"))
    assert claims[0]["value"] == 2025
    groups = pd.DataFrame(
        {
            "cod": [0, 0],
            "ano": [2028, 2029],
            "n_60_mais_t": [10, 12],
            "n_0_14_t": [11, 9],
        }
    )
    assert compute_claims(groups, load_catalog().get("ds3"))[0]["value"] == 2029
    totals = summary(frame, load_catalog().get("ds1"), ano=2026, cod=0, sexo="Ambos")
    assert totals["kpis"][0]["value"] == 20


def test_brasil_permanece_se_o_banco_nao_tem_cod_zero(monkeypatch):
    class _Rows:
        def scalars(self):
            return self

        def all(self):
            return [11, 33]

    class _Conn:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement):
            return _Rows()

    class _Engine:
        def connect(self):
            return _Conn()

    monkeypatch.setattr("app.db.get_engine", lambda: _Engine())
    from app.api.deps import known_territory_codes

    codes = known_territory_codes()
    assert 0 in codes
    assert {11, 33} <= codes


def test_territorio_fantasma_do_brasil_nao_entra_na_lista(monkeypatch):
    class _Rows:
        def mappings(self):
            return self

        def all(self):
            return [
                {"cod": 133, "sigla": "BR", "local": "Brasil", "nivel": "brasil", "regiao_cod": None},
                {"cod": 11, "sigla": "RO", "local": "Rondônia", "nivel": "uf", "regiao_cod": 1},
            ]

    class _Conn:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement):
            return _Rows()

    class _Engine:
        def connect(self):
            return _Conn()

    monkeypatch.setattr("app.api.v1.territories.get_engine", lambda: _Engine())
    from app.api.v1.territories import territories

    rows = territories()
    assert [row["cod"] for row in rows if row["sigla"] == "BR"] == [0]
    assert any(row["cod"] == 11 and row["local"] == "Rondônia" for row in rows)
    assert all(row["cod"] != 133 for row in rows)


def _xlsx_without_local() -> bytes:
    frame = pd.DataFrame({"IDADE": [0], "SEXO": ["Ambos"], "CÓD.": [0], "SIGLA": ["BR"], "2024": [1]})
    buffer = BytesIO()
    cfg = load_catalog().get("ds1")
    path = Path("_tmp_missing.xlsx")
    try:
        write_like_source(frame, path, cfg)
        return path.read_bytes()
    finally:
        path.unlink(missing_ok=True)
