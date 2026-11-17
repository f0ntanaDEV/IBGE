"""Gera apps/api/sql/ddl_ouro.sql a partir do metadata MySQL."""

from pathlib import Path

from sqlalchemy.dialects import mysql
from sqlalchemy.schema import CreateIndex, CreateTable

from app.db import Base
from app.repositories import schema  # noqa: F401

DDL_PATH = Path(__file__).resolve().parents[2] / "sql" / "ddl_ouro.sql"


def render_ddl() -> str:
    """Compila CREATE TABLE e CREATE INDEX na ordem do metadata."""
    dialect = mysql.dialect()
    # MySQL 8.4 envolve default de expressão: DEFAULT (now()).
    dialect.server_version_info = (8, 4, 0)
    lines = [
        "-- DDL da camada ouro gerado por python -m app.tools.dump_ddl.",
        "-- O runtime continua no Alembic (001_initial, 002_fk_cod e 003_restricoes_ouro).",
        "",
    ]
    for table in Base.metadata.sorted_tables:
        lines.append(str(CreateTable(table).compile(dialect=dialect)).rstrip() + ";")
        lines.append("")
        for index in table.indexes:
            lines.append(str(CreateIndex(index).compile(dialect=dialect)).rstrip() + ";")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    """Grava sql/ddl_ouro.sql com o CREATE TABLE do metadata."""
    DDL_PATH.write_text(render_ddl(), encoding="utf-8")
    print(DDL_PATH)


if __name__ == "__main__":
    main()
