"""Cache em disco por URL, com TTL."""

import hashlib
import json
import time
from pathlib import Path


class ResponseCache:
    """ResponseCache."""
    def __init__(self, folder: Path, ttl_s: int) -> None:
        """Entra: folder, ttl_s. Sai com o resultado de init  ."""
        self.folder = folder
        self.ttl_s = ttl_s
        self.folder.mkdir(parents=True, exist_ok=True)

    def fresh(self, url: str) -> object | None:
        """Entra: url. Sai com o resultado de fresh."""
        item = self._read(url)
        if item is None:
            return None
        if time.time() - float(item["fetched_at"]) <= self.ttl_s:
            return item["payload"]
        return None

    def stale(self, url: str) -> object | None:
        """Entra: url. Sai com o resultado de stale."""
        item = self._read(url)
        return None if item is None else item["payload"]

    def write(self, url: str, payload: object) -> None:
        """Entra: url, payload. Sai com o resultado de write."""
        body = {"fetched_at": time.time(), "payload": payload}
        self._path(url).write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")

    def _read(self, url: str) -> dict | None:
        """Entra: url. Sai com o resultado de read."""
        path = self._path(url)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def _path(self, url: str) -> Path:
        """Entra: url. Sai com o resultado de path."""
        digest = hashlib.sha256(url.encode()).hexdigest()
        return self.folder / f"{digest}.json"
