"""Fatos da página de qualidade, lidos dos relatórios gravados."""

import json
from datetime import datetime

from app.core.config import get_settings
from app.domain.published_report import publish_report
from app.services.facts.models import Fact


def _finished(path) -> datetime:
    token = path.name.split("_", 1)[1][:15]
    return datetime.strptime(token, "%Y%m%dT%H%M%S")


def _latest(dataset_id: str, source: str) -> tuple[dict, datetime] | None:
    folder = get_settings().processed_dir
    paths = sorted(folder.glob(f"{dataset_id}_*.report.json"))
    chosen = None
    for path in paths:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if (payload.get("source") or "original") == source:
            chosen = (payload, _finished(path))
    return chosen


def build(_cod: int) -> list[Fact]:
    original = []
    dirty = []
    for dataset_id in ("ds1", "ds2", "ds3", "ds4", "ds5"):
        raw = _latest(dataset_id, "original")
        if raw is not None:
            original.append(publish_report(raw[0], finished_at=raw[1], started_at=raw[1]))
        messy = _latest(dataset_id, "sujo")
        if messy is not None:
            dirty.append(publish_report(messy[0], finished_at=messy[1], started_at=messy[1]))
    rows = sum(item.rows_out for item in original)
    duplicates = sum(item.duplicates.exact + item.duplicates.by_key for item in original)
    structural = sum(sum(item.nulls.structural.values()) for item in original)
    imputed = sum(item.nulls.total_imputed for item in original)
    checks = [check for item in original for check in item.validations]
    approved = sum(1 for check in checks if check.ok)
    outliers = sum(sum(item.outliers.by_column.values()) for item in original)
    demo_dup = sum(item.duplicates.exact + item.duplicates.by_key for item in dirty)
    demo_imputed = sum(item.nulls.total_imputed for item in dirty)
    finished = [item.finished_at for item in original if isinstance(item.finished_at, datetime)]
    last = max(finished).date().isoformat() if finished else ""
    return [
        Fact(id="linhas", label="Linhas tratadas nas 5 bases", value=rows, kind="count"),
        Fact(id="duplicatas", label="Duplicatas removidas", value=duplicates, kind="count"),
        Fact(id="nulos_estruturais", label="Nulos estruturais mantidos", value=structural, kind="count"),
        Fact(id="nulos_imputados", label="Nulos imputados", value=imputed, kind="count"),
        Fact(id="validacoes", label="Validações de consistência aprovadas", value=approved, kind="count", detail=f"{approved}/{len(checks)}"),
        Fact(id="outliers", label="Valores sinalizados como atípicos", value=outliers, kind="count"),
        Fact(id="demo", label="Base de demonstração (suja)", value=demo_dup, kind="count", detail=f"nulos imputados: {demo_imputed}"),
        Fact(id="ultima", label="Última execução bem-sucedida", value=last, kind="raw"),
    ]
