"""Cache em disco por URL, com TTL."""

import hashlib
import json
import time
from pathlib import Path


class ResponseCache:
    def __init__(self, folder: Path, ttl_s: int) -> None:
        self.folder = folder
        self.ttl_s = ttl_s
        self.folder.mkdir(parents=True, exist_ok=True)

    def fresh(self, url: str) -> object | None:
        item = self._read(url)
        if item is None:
            return None
        if time.time() - float(item["fetched_at"]) <= self.ttl_s:
            return item["payload"]
        return None

    def stale(self, url: str) -> object | None:
        item = self._read(url)
        return None if item is None else item["payload"]

    def write(self, url: str, payload: object) -> None:
        body = {"fetched_at": time.time(), "payload": payload}
        self._path(url).write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")

    def _read(self, url: str) -> dict | None:
        path = self._path(url)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def _path(self, url: str) -> Path:
        digest = hashlib.sha256(url.encode()).hexdigest()
        return self.folder / f"{digest}.json"
