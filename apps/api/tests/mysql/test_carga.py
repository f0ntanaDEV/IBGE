"""Carga contra um MySQL 8. Sem TEST_MYSQL_URL o arquivo inteiro é pulado."""

import json
import logging
import os
from pathlib import Path
from uuid import uuid4

import pandas as pd
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url

from app.db import get_engine
from app.domain.report import QualityReport
from app.services.golden import GoldenMismatch
from app.services.loader import load_mysql

pytestmark = pytest.mark.mysql

API_ROOT = Path(__file__).resolve().parents[2]
AMOSTRA = API_ROOT.parents[1] / "data" / "silver" / "amostra"
_SAVED: dict[str, str | None] = {}


def _report(source: str = "original") -> QualityReport:
    return QualityReport(
        dataset_id="ds1",
        source=source,
        rows_before=1,
        rows_after=1,
        nulls_before={},
        nulls_after={},
        structural_nulls={},
        duplicates_removed={},
        outliers={},
        columns_dropped=[],
        rows_discarded=0,
        validations=[],
        strategies={},
        duration_s=0,
    )


@pytest.fixture(scope="module")
def mysql_engine():
    raw = os.environ.get("TEST_MYSQL_URL")
    if not raw:
        pytest.skip("TEST_MYSQL_URL ausente")
    if not (AMOSTRA / "ds1.parquet").exists():
        pytest.skip("amostra ausente")
    url = make_url(raw)
    schema = f"ibge_test_{uuid4().hex[:8]}"
    admin = create_engine(url)
    with admin.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        connection.execute(text(f"CREATE DATABASE `{schema}`"))
    keys = ("MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE")
    for key in keys:
        _SAVED[key] = os.environ.get(key)
    os.environ["MYSQL_HOST"] = url.host or "localhost"
    os.environ["MYSQL_PORT"] = str(url.port or 3306)
    os.environ["MYSQL_USER"] = url.username or "root"
    os.environ["MYSQL_PASSWORD"] = url.password or ""
    os.environ["MYSQL_DATABASE"] = schema
    from app.core.config import get_settings

    get_settings.cache_clear()
    get_engine.cache_clear()
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "alembic"))
    command.upgrade(cfg, "head")
    engine = get_engine()
    try:
        yield engine
    finally:
        engine.dispose()
        get_engine.cache_clear()
        with admin.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
            connection.execute(text(f"DROP DATABASE IF EXISTS `{schema}`"))
        admin.dispose()
        for key, value in _SAVED.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        get_settings.cache_clear()


def _refs() -> dict:
    payload = json.loads((AMOSTRA / "golden.json").read_text(encoding="utf-8"))
    return payload["ds1"]


def _load(engine, frame: pd.DataFrame, source: str, refs: dict | None) -> None:
    load_mysql(engine, frame, "ds1_populacao_idade", "ds1", source, _report(source), [], refs)


def test_amostra_restricoes_e_sigla(mysql_engine):
    frame = pd.read_parquet(AMOSTRA / "ds1.parquet")
    _load(mysql_engine, frame, "original", _refs())
    with mysql_engine.connect() as connection:
        kinds = {
            row[0]
            for row in connection.execute(
                text(
                    "SELECT CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ds1_populacao_idade'"
                )
            )
        }
        divergem = connection.execute(
            text(
                "SELECT COUNT(*) FROM ds1_populacao_idade f "
                "JOIN dim_territorio d ON d.cod = f.cod "
                "WHERE f.sigla <> d.sigla OR f.local <> d.local OR f.nivel <> d.nivel"
            )
        ).scalar()
        rows = connection.execute(text("SELECT COUNT(*) FROM ds1_populacao_idade")).scalar()
    assert {"PRIMARY KEY", "FOREIGN KEY", "CHECK"} <= kinds
    assert int(divergem) == 0
    assert int(rows) == _refs()["rows"]
    _load(mysql_engine, frame, "original", _refs())
    with mysql_engine.connect() as connection:
        again = connection.execute(text("SELECT COUNT(*) FROM ds1_populacao_idade")).scalar()
    assert int(again) == _refs()["rows"]


def test_suja_nao_substitui_a_original(mysql_engine):
    frame = pd.read_parquet(AMOSTRA / "ds1.parquet")
    dirty = frame.copy()
    dirty["populacao"] = 1
    dirty["is_outlier"] = True
    _load(mysql_engine, dirty, "sujo", None)
    with mysql_engine.connect() as connection:
        outliers = connection.execute(
            text("SELECT COUNT(*) FROM ds1_populacao_idade WHERE is_outlier = 1")
        ).scalar()
        sujo = connection.execute(
            text("SELECT COUNT(*) FROM etl_runs WHERE source = 'sujo' AND status = 'success'")
        ).scalar()
    assert int(outliers) == 0
    assert int(sujo) >= 1


def test_rollback_do_golden(mysql_engine):
    frame = pd.read_parquet(AMOSTRA / "ds1.parquet")
    before = _refs()["rows"]
    with pytest.raises(GoldenMismatch):
        _load(mysql_engine, frame, "original", {**_refs(), "rows": before + 1})
    with mysql_engine.connect() as connection:
        rows = connection.execute(text("SELECT COUNT(*) FROM ds1_populacao_idade")).scalar()
        error = connection.execute(text("SELECT error FROM etl_runs WHERE status = 'failed' ORDER BY id DESC LIMIT 1")).scalar()
    assert int(rows) == before
    assert "linhas" in (error or "")


def test_migracao_recria_fatos_e_semeadura_recarrega(mysql_engine, monkeypatch, tmp_path, caplog):
    """A 003 esvazia as fatos e mantém etl_runs. A semeadura recarrega a ouro pela silver."""
    from app.core.config import get_settings
    from app.core.startup import _run, should_seed
    from app.repositories.schema import FACTS

    frame = pd.read_parquet(AMOSTRA / "ds1.parquet")
    refs = _refs()
    _load(mysql_engine, frame, "original", refs)
    with mysql_engine.begin() as connection:
        for name in FACTS:
            connection.execute(text(f"DROP TABLE IF EXISTS `{name}`"))
        for name in FACTS:
            FACTS[name].create(connection)
        success = connection.execute(
            text("SELECT 1 FROM etl_runs WHERE status = 'success' LIMIT 1")
        ).first()
    assert success is not None
    for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"):
        (tmp_path / f"{dataset_id}_x.parquet").write_bytes(b"")
    monkeypatch.setenv("AUTO_SEED", "true")
    monkeypatch.setenv("DATA_DIR", str(API_ROOT.parents[1] / "data"))
    monkeypatch.setenv("SILVER_DIR", str(tmp_path))
    get_settings.cache_clear()

    def _recarrega():
        _load(mysql_engine, frame, "original", refs)

    def _etl():
        raise AssertionError("ETL não deveria rodar")

    monkeypatch.setattr("app.tools.load_mysql_from_parquet.main", _recarrega)
    monkeypatch.setattr("app.tools.seed.seed_all", _etl)
    try:
        assert should_seed() is True
        with caplog.at_level(logging.INFO, logger="app.core.startup"):
            _run()
        with mysql_engine.connect() as connection:
            rows = connection.execute(text("SELECT COUNT(*) FROM ds1_populacao_idade")).scalar()
        assert int(rows) == refs["rows"]
        assert "semeadura: fatos vazias, recarregando a ouro" in caplog.text
    finally:
        get_settings.cache_clear()
        _load(mysql_engine, frame, "original", refs)
