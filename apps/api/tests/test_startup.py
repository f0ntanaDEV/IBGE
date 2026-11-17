"""should_seed olha o conteúdo das fatos, não o histórico de etl_runs."""

import logging

from app.core.config import get_settings
from app.core.startup import _run, should_seed


class _Result:
    def __init__(self, row):
        self._row = row

    def first(self):
        return self._row


class _Conn:
    def __init__(self, empty: bool, etl_success: bool):
        self.empty = empty
        self.etl_success = etl_success

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, statement):
        sql = str(statement)
        if "etl_runs" in sql:
            return _Result((1,) if self.etl_success else None)
        return _Result(None if self.empty else (1,))


class _Engine:
    def __init__(self, empty: bool, etl_success: bool):
        self.empty = empty
        self.etl_success = etl_success

    def connect(self):
        return _Conn(self.empty, self.etl_success)


def _enable(monkeypatch, engine):
    monkeypatch.setenv("AUTO_SEED", "true")
    get_settings.cache_clear()
    monkeypatch.setattr("app.db.get_engine", lambda: engine)


def test_fatos_vazias_com_etl_success_semeia(monkeypatch):
    _enable(monkeypatch, _Engine(empty=True, etl_success=True))
    assert should_seed() is True


def test_fatos_cheias_sem_etl_success_nao_semeia(monkeypatch):
    _enable(monkeypatch, _Engine(empty=False, etl_success=False))
    assert should_seed() is False


def test_auto_seed_desligado(monkeypatch):
    monkeypatch.setenv("AUTO_SEED", "false")
    get_settings.cache_clear()

    def _aberto():
        raise AssertionError("não deveria abrir o banco")

    monkeypatch.setattr("app.db.get_engine", _aberto)
    assert should_seed() is False


def test_sem_banco_usa_silver_em_disco(monkeypatch, tmp_path):
    monkeypatch.setenv("AUTO_SEED", "true")
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.delenv("SILVER_DIR", raising=False)
    silver = tmp_path / "silver"
    get_settings.cache_clear()

    def _fechado():
        raise OSError("mysql down")

    monkeypatch.setattr("app.db.get_engine", _fechado)
    assert should_seed() is True
    silver.mkdir()
    for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"):
        (silver / f"{dataset_id}_x.parquet").write_bytes(b"")
    get_settings.cache_clear()
    assert should_seed() is False


def test_run_recarrega_ouro_pela_silver(monkeypatch, tmp_path, caplog):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    monkeypatch.delenv("SILVER_DIR", raising=False)
    silver = tmp_path / "silver"
    silver.mkdir()
    for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"):
        (silver / f"{dataset_id}_x.parquet").write_bytes(b"")
    get_settings.cache_clear()
    called = {}

    def _main():
        called["main"] = True

    def _seed_all():
        raise AssertionError("ETL não deveria rodar")

    monkeypatch.setattr("app.tools.load_mysql_from_parquet.main", _main)
    monkeypatch.setattr("app.tools.seed.seed_all", _seed_all)
    with caplog.at_level(logging.INFO, logger="app.core.startup"):
        _run()
    assert called == {"main": True}
    assert "semeadura: fatos vazias, recarregando a ouro" in caplog.text
