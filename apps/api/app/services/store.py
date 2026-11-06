"""Cache em memória do Parquet mais recente de cada dataset."""

from pathlib import Path

import pandas as pd

from app.core.errors import AppError


class ParquetStore:
    def __init__(self, processed_dir: Path) -> None:
        self.processed_dir = processed_dir
        self._frames: dict[str, pd.DataFrame] = {}

    def put(self, dataset_id: str, frame: pd.DataFrame) -> None:
        self._frames[dataset_id] = frame

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
        frame = pd.read_parquet(path)
        self._frames[dataset_id] = frame
        return frame
