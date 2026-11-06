"""Leitura de etl_runs."""

from sqlalchemy import select
from sqlalchemy.engine import Connection

from app.repositories.schema import etl_runs


def list_runs(connection: Connection, dataset_id: str | None = None) -> list[dict]:
    query = select(etl_runs).order_by(etl_runs.c.id.desc())
    if dataset_id is not None:
        query = query.where(etl_runs.c.dataset_id == dataset_id)
    rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def latest_run(connection: Connection, dataset_id: str) -> dict | None:
    runs = list_runs(connection, dataset_id)
    return runs[0] if runs else None
