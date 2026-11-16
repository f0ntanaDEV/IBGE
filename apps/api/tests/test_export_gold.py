"""Exportação ao Databricks sem rede."""

from pathlib import Path

import httpx
import pytest

from app.tools import export_gold


def test_sem_credencial_sai_com_codigo_2(monkeypatch):
    monkeypatch.setenv("DATABRICKS_HOST", "")
    monkeypatch.setenv("DATABRICKS_TOKEN", "")
    from app.core.config import get_settings

    get_settings.cache_clear()
    with pytest.raises(SystemExit) as exc:
        export_gold.main()
    assert exc.value.code == 2
    get_settings.cache_clear()


def test_upload_apaga_e_envia(monkeypatch, tmp_path: Path):
    (tmp_path / "part-00000.parquet").write_bytes(b"parquet")
    calls: list[tuple] = []

    class Fake:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def delete(self, url, headers):
            calls.append(("delete", url, headers["Authorization"]))
            return httpx.Response(200)

        def put(self, url, headers, content):
            calls.append(("put", url, headers["Authorization"], content))
            return httpx.Response(200)

    monkeypatch.setattr(export_gold.httpx, "Client", Fake)
    export_gold.upload_table("https://adb.example", "segredo", "dim_territorio", tmp_path)
    assert calls[0][0] == "delete"
    assert calls[0][1].endswith("/Volumes/ibge/bronze/ouro_mysql/dim_territorio")
    assert calls[0][2] == "Bearer segredo"
    assert calls[1][0] == "put"
    assert calls[1][1].endswith("/dim_territorio/part-00000.parquet")
    assert calls[1][3] == b"parquet"
