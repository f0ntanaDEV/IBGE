"""Lê o MySQL ouro e envia Parquet ao Volume ibge.bronze.ouro_mysql."""

from pathlib import Path

import httpx
import pandas as pd

from app.core.config import get_settings
from app.db import get_engine
from app.repositories.schema import FACTS

TABLES = [*FACTS.keys(), "dim_territorio", "dim_metrica", "dim_dataset", "etl_runs"]
DEST = Path("/tmp/ouro")


def main() -> None:
    """Exporta as fatos e dimensões. Sem host ou token, termina com código 2."""
    settings = get_settings()
    host = settings.databricks_host.strip().rstrip("/")
    token = settings.databricks_token.strip()
    if not host or not token:
        print("Defina DATABRICKS_HOST e DATABRICKS_TOKEN.")
        raise SystemExit(2)
    engine = get_engine()
    for table in TABLES:
        folder = DEST / table
        folder.mkdir(parents=True, exist_ok=True)
        for old in folder.glob("*.parquet"):
            old.unlink()
        parts = 0
        for chunk in pd.read_sql(f"SELECT * FROM `{table}`", engine, chunksize=50_000):
            chunk.to_parquet(folder / f"part-{parts:05d}.parquet", index=False)
            parts += 1
        upload_table(host, token, table, folder)
    _record(engine)
    print("export_databricks ok", flush=True)


def upload_table(host: str, token: str, table: str, folder: Path) -> None:
    """Apaga a pasta remota da tabela e envia os Parquet. O token não entra no log."""
    headers = {"Authorization": f"Bearer {token}"}
    base = f"{host}/api/2.0/fs"
    with httpx.Client(timeout=120) as client:
        removed = client.delete(f"{base}/directories/Volumes/ibge/bronze/ouro_mysql/{table}", headers=headers)
        if removed.status_code not in {200, 404}:
            removed.raise_for_status()
        for path in sorted(folder.glob("*.parquet")):
            url = f"{base}/files/Volumes/ibge/bronze/ouro_mysql/{table}/{path.name}"
            sent = client.put(url, headers=headers, content=path.read_bytes())
            if sent.status_code >= 400:
                sent.raise_for_status()


def _record(engine) -> None:
    """Entra: engine. Sai com o resultado de record."""
    from datetime import datetime

    from sqlalchemy import text

    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO etl_runs (dataset_id, source, status, started_at, finished_at, rows_out) "
                "VALUES ('ds1', 'export_databricks', 'success', :now, :now, 0)"
            ),
            {"now": datetime.now()},
        )


if __name__ == "__main__":
    main()
