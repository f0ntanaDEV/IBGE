"""Grava o snapshot das notícias do IBGE em apps/api/news_snapshot."""

import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[2]
NEWS_URL = "https://servicodados.ibge.gov.br/api/v3/noticias/?busca={term}&qtd=10"


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
    for term in terms():
        url = NEWS_URL.format(term=urllib.parse.quote_plus(term))
        with urllib.request.urlopen(url, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        digest = hashlib.sha256(url.encode()).hexdigest()
        body = {"fetched_at": fetched_at, "payload": payload}
        (folder / f"{digest}.json").write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
        print(f"{term} items={len(payload.get('items', []))}", flush=True)


if __name__ == "__main__":
    main()
