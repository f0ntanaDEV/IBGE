"""O Parquet tratado é lido uma vez por processo."""

import threading
from pathlib import Path

import pandas as pd

from app.services import store as store_module
from app.services.store import ParquetStore


def test_parquet_is_read_once_across_stores(tmp_path: Path, monkeypatch) -> None:
    path = tmp_path / "ds1_2026.parquet"
    pd.DataFrame({"idade": [0], "populacao": [10]}).to_parquet(path)
    reads = {"n": 0}
    original = pd.read_parquet

    def counting(source, *args, **kwargs):
        reads["n"] += 1
        return original(source, *args, **kwargs)

    monkeypatch.setattr(store_module.pd, "read_parquet", counting)
    barrier = threading.Barrier(4)

    def load() -> None:
        barrier.wait()
        frame = ParquetStore(tmp_path).get("ds1")
        assert int(frame["populacao"].iloc[0]) == 10

    threads = [threading.Thread(target=load) for _ in range(4)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert reads["n"] == 1
    again = ParquetStore(tmp_path).get("ds1")
    assert reads["n"] == 1
    assert int(again["populacao"].iloc[0]) == 10
