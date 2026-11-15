"""Mantém a execução mais recente de cada dataset e de cada fonte."""

import json
from pathlib import Path


def keep_latest(directory: Path) -> list[Path]:
    groups: dict[tuple[str, str], list[Path]] = {}
    for path in sorted(directory.glob("*.report.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        dataset = str(payload.get("dataset_id") or path.name.split("_", 1)[0])
        source = str(payload.get("source") or "original")
        groups.setdefault((dataset, source), []).append(path)
    removed: list[Path] = []
    for paths in groups.values():
        for old in paths[:-1]:
            stem = old.name[: -len(".report.json")]
            for sibling in directory.glob(f"{stem}*"):
                sibling.unlink(missing_ok=True)
                removed.append(sibling)
    return removed
