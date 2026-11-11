"""Carga idempotente: staging, lotes de 10 mil linhas e troca atômica."""

from datetime import datetime

import pandas as pd
from sqlalchemy import delete, insert, text
from sqlalchemy.engine import Engine

from app.domain.report import QualityReport
from app.domain.territory import regiao_cod_de, territorios_padrao
from app.repositories.schema import FACTS, dim_metrica, dim_territorio, etl_runs

BATCH = 10_000


def load_mysql(
    engine: Engine,
    frame: pd.DataFrame,
    table_name: str,
    dataset_id: str,
    source: str,
    report: QualityReport,
    metrics: list[dict],
) -> None:
    """Grava o fato e registra etl_runs. Em falha, a tabela anterior permanece."""
    from app.db import Base

    Base.metadata.create_all(engine)
    table = FACTS[table_name]
    started = datetime.now()
    with engine.begin() as connection:
        run_id = connection.execute(
            insert(etl_runs).values(
                dataset_id=dataset_id,
                source=source,
                status="running",
                started_at=started,
                rows_in=report.rows_before,
            )
        ).inserted_primary_key[0]
    staging = f"{table_name}__stg"
    previous = f"{table_name}__old"
    with engine.begin() as connection:
        connection.execute(text(f"DROP TABLE IF EXISTS {staging}"))
        connection.execute(text(f"DROP TABLE IF EXISTS {previous}"))
        if _same_row_count(connection, table_name, len(frame)):
            connection.execute(
                etl_runs.update()
                .where(etl_runs.c.id == run_id)
                .values(
                    status="success",
                    finished_at=datetime.now(),
                    rows_out=len(frame),
                    report_json=report.model_dump(),
                    error=None,
                )
            )
            return
    try:
        with engine.begin() as connection:
            connection.execute(text(f"CREATE TABLE {staging} LIKE {table_name}"))
            if connection.dialect.name == "mysql":
                connection.execute(text(f"ALTER TABLE `{staging}` MODIFY `outlier_motivo` TEXT"))
        _insert_batches(engine, staging, table, frame)
        with engine.begin() as connection:
            _replace_dimensions(connection, frame, dataset_id, metrics)
            connection.execute(text(f"RENAME TABLE {table_name} TO {previous}, {staging} TO {table_name}"))
            connection.execute(text(f"DROP TABLE IF EXISTS {previous}"))
            connection.execute(
                etl_runs.update()
                .where(etl_runs.c.id == run_id)
                .values(
                    status="success",
                    finished_at=datetime.now(),
                    rows_out=len(frame),
                    report_json=report.model_dump(),
                    error=None,
                )
            )
    except Exception as exc:
        with engine.begin() as connection:
            connection.execute(text(f"DROP TABLE IF EXISTS {staging}"))
            connection.execute(
                etl_runs.update()
                .where(etl_runs.c.id == run_id)
                .values(status="failed", finished_at=datetime.now(), error=str(exc)[:2000])
            )
        raise


def _same_row_count(connection, table_name: str, rows: int) -> bool:
    """Evita a segunda cópia no volume de 500 MB do Railway quando a carga já está lá."""
    if connection.dialect.name != "mysql":
        return False
    exists = connection.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = :name"
    ), {"name": table_name}).scalar()
    if not exists:
        return False
    current = connection.execute(text(f"SELECT COUNT(*) FROM `{table_name}`")).scalar()
    return int(current or 0) == rows


def _insert_batches(engine: Engine, staging: str, table, frame: pd.DataFrame) -> None:
    columns = [col.name for col in table.columns]
    present = [col for col in columns if col in frame.columns]
    subset = frame.loc[:, present]
    records = [_record(row, present) for row in subset.itertuples(index=False, name=None)]
    statement = text(_insert_sql(staging, present))
    for offset in range(0, len(records), BATCH):
        chunk = records[offset : offset + BATCH]
        if not chunk:
            continue
        with engine.begin() as connection:
            connection.execute(statement, chunk)


def _insert_sql(table: str, columns: list[str]) -> str:
    cols = ", ".join(f"`{col}`" for col in columns)
    vals = ", ".join(f":{col}" for col in columns)
    return f"INSERT INTO `{table}` ({cols}) VALUES ({vals})"


def _record(values: tuple, columns: list[str]) -> dict:
    payload = {}
    for name, value in zip(columns, values, strict=True):
        payload[name] = _plain(value)
    return payload


def _plain(value: object) -> object:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    if hasattr(value, "item"):
        return value.item()
    return value


def _replace_dimensions(connection, frame: pd.DataFrame, dataset_id: str, metrics: list[dict]) -> None:
    territories = {row["cod"]: row for row in territorios_padrao()}
    if {"cod", "sigla", "local", "nivel"} <= set(frame.columns):
        grouped = frame.dropna(subset=["cod"]).groupby("cod", sort=False).first()
        for cod, row in grouped.iterrows():
            code = int(cod)
            current = territories.get(code, {"cod": code, "regiao_cod": regiao_cod_de(code)})
            current["sigla"] = row["sigla"]
            current["local"] = row["local"]
            current["nivel"] = row["nivel"]
            current["regiao_cod"] = regiao_cod_de(code)
            territories[code] = current
    if connection.dialect.name == "mysql":
        connection.execute(text("SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',NO_AUTO_VALUE_ON_ZERO')"))
        try:
            connection.execute(text("ALTER TABLE dim_territorio MODIFY COLUMN cod INT NOT NULL"))
        except Exception:
            pass
    connection.execute(delete(dim_territorio))
    connection.execute(insert(dim_territorio), list(territories.values()))
    connection.execute(delete(dim_metrica).where(dim_metrica.c.dataset_id == dataset_id))
    if metrics:
        connection.execute(
            insert(dim_metrica),
            [
                {
                    "dataset_id": dataset_id,
                    "coluna": item["coluna"],
                    "rotulo": item["rotulo_original"][:120],
                    "descricao": item["descricao"][:255],
                    "unidade": item["unidade"][:40],
                }
                for item in metrics
            ],
        )
