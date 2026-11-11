"""Grava o snapshot das notícias do IBGE em apps/api/news_snapshot."""

import gzip
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[2]
NEWS_URL = "https://servicodados.ibge.gov.br/api/v3/noticias/?busca={term}&qtd=10&page={page}"


def terms() -> list[str]:
    text = (API_ROOT / "datasets.yaml").read_text(encoding="utf-8")
    found: list[str] = []
    for line in text.splitlines():
        if "news_keywords" not in line and "news_terms" not in line:
            continue
        found.extend(re.findall(r'"([^"]+)"', line))
    unique: list[str] = []
    for term in found:
        if term not in unique:
            unique.append(term)
    return unique


def main() -> None:
    folder = API_ROOT / "news_snapshot"
    folder.mkdir(parents=True, exist_ok=True)
    fetched_at = time.time()
    kept: set[str] = set()
    for term in terms():
        for page in range(1, 4):
            url = NEWS_URL.format(term=urllib.parse.quote_plus(f'"{term.strip()}"'), page=page)
            request = urllib.request.Request(url, headers={"Accept-Encoding": "gzip"})
            with urllib.request.urlopen(request, timeout=20) as response:
                raw = response.read()
            if raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
            payload = json.loads(raw.decode("utf-8"))
            digest = hashlib.sha256(url.encode()).hexdigest()
            kept.add(f"{digest}.json")
            body = {"fetched_at": fetched_at, "payload": payload}
            (folder / f"{digest}.json").write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
            print(f"{term} page={page} items={len(payload.get('items', []))}", flush=True)
            if not payload.get("items"):
                break
    for path in folder.glob("*.json"):
        if path.name not in kept:
            path.unlink()


if __name__ == "__main__":
    main()
