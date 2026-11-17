"""/health distingue carregando, down, vazio e ok sem COUNT(*)."""

from app.api.v1.health import health
from app.core.config import get_settings


class _Result:
    def __init__(self, row):
        self.row = row

    def first(self):
        return self.row


class _Conn:
    def __init__(self, row, sqls):
        self.row = row
        self.sqls = sqls

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, statement):
        sql = str(statement)
        self.sqls.append(sql)
        return _Result(self.row)


class _Engine:
    def __init__(self, row, sqls):
        self.row = row
        self.sqls = sqls

    def connect(self):
        return _Conn(self.row, self.sqls)


def test_health_quatro_estados(monkeypatch):
    monkeypatch.setattr("app.core.startup.is_seeding", lambda: True)
    assert health().mysql == "carregando"

    monkeypatch.setattr("app.core.startup.is_seeding", lambda: False)

    def _down():
        raise OSError("mysql")

    monkeypatch.setattr("app.api.v1.health.get_engine", _down)
    assert health().mysql == "down"

    sqls: list[str] = []
    monkeypatch.setattr("app.api.v1.health.get_engine", lambda: _Engine(None, sqls))
    assert health().mysql == "vazio"

    monkeypatch.setattr("app.api.v1.health.get_engine", lambda: _Engine((1,), sqls))
    body = health()
    assert body.mysql == "ok"
    assert body.mysql_required is get_settings().mysql_required
    assert sqls
    assert all("COUNT" not in sql.upper() for sql in sqls)
    assert all("ds1_populacao_idade" in sql for sql in sqls)
