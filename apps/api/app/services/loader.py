"""Camada ouro: troca a fato original em uma transação e não grava a base suja nas fatos."""

from collections.abc import Callable, Iterator
from datetime import datetime

import pandas as pd
from sqlalchemy import delete, insert, text
from sqlalchemy.engine import Engine

from app.domain.report import QualityReport
from app.domain.territory import regiao_cod_de, territorios_padrao
from app.repositories.schema import DATASETS, FACTS, dim_metrica
from app.services.golden import validate_golden

BATCH = 10_000
Source = pd.DataFrame | Callable[[], Iterator[pd.DataFrame]]


def load_mysql(
    engine: Engine,
    frame: Source,
    table_name: str,
    dataset_id: str,
    source: str,
    report: QualityReport,
    metrics: list[dict],
    references: dict | None = None,
) -> None:
    """Grava etl_runs. A fonte suja não altera as fatos; a original troca as linhas e valida o golden."""
    from app.db import Base

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        _ensure_datasets(connection)
    if source == "sujo":
        # Nenhuma rota lê linhas sujas no MySQL: o app usa o relatório. As fatos ouro ficam intocadas.
        _finish_run(engine, dataset_id, source, report, "success", report.rows_after, None)
        return
    run_id = _start_run(engine, dataset_id, source, report)
    table = FACTS[table_name]
    try:
        territories = {row["cod"]: dict(row) for row in territorios_padrao()}
        for batch in _batches(frame):
            _merge_territories(territories, batch)
        with engine.begin() as connection:
            if connection.dialect.name == "mysql":
                connection.execute(text("SET SESSION sql_mode = CONCAT(@@SESSION.sql_mode, ',NO_AUTO_VALUE_ON_ZERO')"))
            _upsert_territories(connection, territories)
            _replace_metrics(connection, dataset_id, metrics)
            # DELETE + INSERT na mesma transação preserva PK, FK e CHECK. O undo de ~640 mil linhas cabe no Docker.
            connection.execute(delete(table))
            total = 0
            for batch in _batches(frame):
                total += _insert_frame(connection, table, batch)
            validate_golden(connection, dataset_id, references)
            from app.repositories.schema import etl_runs

            connection.execute(
                etl_runs.update()
                .where(etl_runs.c.id == run_id)
                .values(
                    status="success",
                    finished_at=datetime.now(),
                    rows_out=total,
                    report_json=report.model_dump(),
                    error=None,
                )
            )
    except Exception as exc:
        _mark_failed(engine, run_id, exc, report)
        raise


def iter_parquet_batches(path, batch_size: int = BATCH) -> Callable[[], Iterator[pd.DataFrame]]:
    """Devolve um gerador novo a cada chamada, em lotes, sem montar o Parquet inteiro."""
    import pyarrow.parquet as pq

    def _iter() -> Iterator[pd.DataFrame]:
        parquet = pq.ParquetFile(path)
        for batch in parquet.iter_batches(batch_size=batch_size):
            yield batch.to_pandas()

    return _iter


def _batches(frame: Source) -> Iterator[pd.DataFrame]:
    if callable(frame):
        yield from frame()
        return
    for offset in range(0, len(frame), BATCH):
        yield frame.iloc[offset : offset + BATCH]


def _start_run(engine: Engine, dataset_id: str, source: str, report: QualityReport) -> int:
    from app.repositories.schema import etl_runs

    with engine.begin() as connection:
        return connection.execute(
            insert(etl_runs).values(
                dataset_id=dataset_id,
                source=source,
                status="running",
                started_at=datetime.now(),
                rows_in=report.rows_before,
            )
        ).inserted_primary_key[0]


def _finish_run(engine, dataset_id: str, source: str, report: QualityReport, status: str, rows_out: int, error: str | None) -> None:
    from app.repositories.schema import etl_runs

    with engine.begin() as connection:
        connection.execute(
            insert(etl_runs).values(
                dataset_id=dataset_id,
                source=source,
                status=status,
                started_at=datetime.now(),
                finished_at=datetime.now(),
                rows_in=report.rows_before,
                rows_out=rows_out,
                report_json=report.model_dump(),
                error=error,
            )
        )


def _mark_failed(engine: Engine, run_id: int, exc: Exception, report: QualityReport) -> None:
    from app.repositories.schema import etl_runs

    with engine.begin() as connection:
        connection.execute(
            etl_runs.update()
            .where(etl_runs.c.id == run_id)
            .values(
                status="failed",
                finished_at=datetime.now(),
                error=str(exc)[:2000],
                report_json=report.model_dump(),
            )
        )


def _ensure_datasets(connection) -> None:
    """Garante o catálogo antes da FK de etl_runs."""
    rows = [{"id": dataset_id, "nome": nome} for dataset_id, nome in DATASETS]
    if connection.dialect.name == "mysql":
        connection.execute(
            text(
                "INSERT INTO dim_dataset (id, nome) VALUES (:id, :nome) AS novo "
                "ON DUPLICATE KEY UPDATE nome = novo.nome"
            ),
            rows,
        )
        return
    for row in rows:
        connection.execute(
            text(
                "INSERT INTO dim_dataset (id, nome) VALUES (:id, :nome) "
                "ON CONFLICT(id) DO UPDATE SET nome = excluded.nome"
            ),
            row,
        )


def _merge_territories(territories: dict, frame: pd.DataFrame) -> None:
    if not {"cod", "sigla", "local", "nivel"} <= set(frame.columns):
        return
    grouped = frame.dropna(subset=["cod"]).groupby("cod", sort=False).first()
    for cod, row in grouped.iterrows():
        code = int(cod)
        current = territories.get(
            code,
            {"cod": code, "regiao_cod": regiao_cod_de(code), "sigla": "", "local": "", "nivel": ""},
        )
        current["sigla"] = None if pd.isna(row["sigla"]) else str(row["sigla"])
        current["local"] = None if pd.isna(row["local"]) else str(row["local"])
        current["nivel"] = None if pd.isna(row["nivel"]) else str(row["nivel"])
        current["regiao_cod"] = regiao_cod_de(code)
        territories[code] = current


def _upsert_territories(connection, territories: dict) -> None:
    # Regiões antes das UFs: a FK regiao_cod aponta para um cod que já existe.
    ordered = sorted(territories.values(), key=lambda row: (int(row["cod"]) > 5, int(row["cod"])))
    if connection.dialect.name == "mysql":
        statement = text(
            "INSERT INTO dim_territorio (cod, sigla, local, nivel, regiao_cod) "
            "VALUES (:cod, :sigla, :local, :nivel, :regiao_cod) AS novo "
            "ON DUPLICATE KEY UPDATE sigla = novo.sigla, local = novo.local, "
            "nivel = novo.nivel, regiao_cod = novo.regiao_cod"
        )
    else:
        statement = text(
            "INSERT INTO dim_territorio (cod, sigla, local, nivel, regiao_cod) "
            "VALUES (:cod, :sigla, :local, :nivel, :regiao_cod) "
            "ON CONFLICT(cod) DO UPDATE SET sigla = excluded.sigla, local = excluded.local, "
            "nivel = excluded.nivel, regiao_cod = excluded.regiao_cod"
        )
    connection.execute(statement, ordered)


def _replace_metrics(connection, dataset_id: str, metrics: list[dict]) -> None:
    connection.execute(delete(dim_metrica).where(dim_metrica.c.dataset_id == dataset_id))
    if not metrics:
        return
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


def _insert_frame(connection, table, frame: pd.DataFrame) -> int:
    # itertuples segue a ordem do frame; a tabela põe nivel antes de ano.
    columns = [name for name in frame.columns if name in table.c]
    if frame.empty or not columns:
        return 0
    ordered = frame.loc[:, columns]
    statement = text(_insert_sql(table.name, columns))
    records = [_record(row, columns) for row in ordered.itertuples(index=False, name=None)]
    connection.execute(statement, records)
    return len(records)


def _insert_sql(table: str, columns: list[str]) -> str:
    cols = ", ".join(f"`{col}`" for col in columns)
    vals = ", ".join(f":{col}" for col in columns)
    return f"INSERT INTO `{table}` ({cols}) VALUES ({vals})"


def _record(values: tuple, columns: list[str]) -> dict:
    return {name: _plain(value) for name, value in zip(columns, values, strict=True)}


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
