"""Cache em memória do Parquet mais recente de cada dataset."""

import threading
from pathlib import Path

import pandas as pd

from app.core.errors import AppError

# Uma cópia por arquivo no processo. Cada request cria um ParquetStore novo;
# sem este mapa, a página ds1 lia o mesmo Parquet várias vezes e estourava 1 GB.
_shared: dict[str, tuple[int, int, pd.DataFrame]] = {}
_lock = threading.Lock()


class ParquetStore:
    def __init__(self, processed_dir: Path) -> None:
        self.processed_dir = processed_dir
        self._frames: dict[str, pd.DataFrame] = {}

    def put(self, dataset_id: str, frame: pd.DataFrame) -> None:
        self._frames[dataset_id] = frame
        path = self.latest_file(dataset_id, ".parquet")
        if path is None:
            return
        key = str(path.resolve())
        with _lock:
            _forget_other(dataset_id, key)
            _shared[key] = (*_stamp(path), frame)

    def latest_file(self, dataset_id: str, suffix: str) -> Path | None:
        files = sorted(self.processed_dir.glob(f"{dataset_id}_*{suffix}"))
        return files[-1] if files else None

    def get(self, dataset_id: str) -> pd.DataFrame:
        cached = self._frames.get(dataset_id)
        if cached is not None:
            return cached
        path = self.latest_file(dataset_id, ".parquet")
        if path is None:
            raise AppError("not_found", f"Base tratada de {dataset_id} não encontrada", 404)
        key = str(path.resolve())
        frame = _shared_frame(key, path)
        if frame is None:
            with _lock:
                frame = _shared_frame(key, path)
                if frame is None:
                    frame = pd.read_parquet(path)
                    _forget_other(dataset_id, key)
                    _shared[key] = (*_stamp(path), frame)
        self._frames[dataset_id] = frame
        return frame


def _stamp(path: Path) -> tuple[int, int]:
    stat = path.stat()
    return stat.st_mtime_ns, stat.st_size


def _forget_other(dataset_id: str, key: str) -> None:
    prefix = f"{dataset_id}_"
    for old in list(_shared):
        if old != key and Path(old).name.startswith(prefix):
            _shared.pop(old, None)


def _shared_frame(key: str, path: Path) -> pd.DataFrame | None:
    found = _shared.get(key)
    if found is None or found[:2] != _stamp(path):
        return None
    return found[2]
