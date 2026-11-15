"""Fatos da página de qualidade, lidos dos relatórios gravados."""

import json
from datetime import datetime

from app.core.config import get_settings
from app.domain.clock import as_brasilia
from app.domain.published_report import publish_report
from app.domain.kpi_rules import evaluate
from app.services.facts.models import Fact
from app.services.quality_summary import summarize_validations

DATASETS = ("ds1", "ds2", "ds3", "ds4", "ds5")


def _manifest_demo() -> tuple[int, int]:
    folder = get_settings().raw_dir
    duplicates = 0
    nulls = 0
    for dataset_id in DATASETS:
        path = folder / f"{dataset_id}_sujo.manifest.json"
        if not path.exists():
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        duplicates += int(payload.get("exact_duplicates") or 0) + int(payload.get("key_duplicates") or 0)
        nulls += sum(int(value) for value in (payload.get("nulls_injected") or {}).values())
    return duplicates, nulls


def _finished(path) -> datetime:
    token = path.name.split("_", 1)[1][:15]
    return datetime.strptime(token, "%Y%m%dT%H%M%S")


def latest_raw(dataset_id: str, source: str) -> tuple[dict, datetime] | None:
    """Relatório mais recente no disco ou, se a limpeza apagou a fonte, no MySQL."""
    found = _latest(dataset_id, source)
    if found is not None:
        return found
    try:
        from app.db import get_engine
        from app.repositories.etl_runs import list_runs

        with get_engine().connect() as connection:
            rows = list_runs(connection, dataset_id)
    except Exception:
        return None
    for row in rows:
        payload = row.get("report_json")
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                continue
        if not isinstance(payload, dict):
            continue
        found_source = payload.get("source") or row.get("source") or "original"
        if found_source != source:
            continue
        finished = row.get("finished_at")
        when = finished if isinstance(finished, datetime) else datetime.now()
        return payload, when
    return None


def _latest(dataset_id: str, source: str) -> tuple[dict, datetime] | None:
    folder = get_settings().processed_dir
    paths = sorted(folder.glob(f"{dataset_id}_*.report.json"))
    chosen = None
    for path in paths:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if (payload.get("source") or "original") == source:
            chosen = (payload, _finished(path))
    return chosen


def validation_overview(source: str) -> dict:
    items = []
    for dataset_id in DATASETS:
        raw = latest_raw(dataset_id, source)
        if raw is None:
            continue
        report = publish_report(raw[0], finished_at=raw[1], started_at=raw[1])
        for check in report.validations:
            items.append(
                {
                    "dataset_id": dataset_id,
                    "rule": check.rule,
                    "ok": check.ok,
                    "status": check.status,
                    "motivo": check.motivo,
                    "max_diff": check.max_diff,
                    "note": check.note,
                }
            )
    summary = summarize_validations(items)
    return {**summary, "items": items}


def build(_cod: int) -> list[Fact]:
    original = []
    dirty = []
    for dataset_id in DATASETS:
        raw = latest_raw(dataset_id, "original")
        if raw is not None:
            original.append(publish_report(raw[0], finished_at=raw[1], started_at=raw[1]))
        messy = latest_raw(dataset_id, "sujo")
        if messy is not None:
            dirty.append(publish_report(messy[0], finished_at=messy[1], started_at=messy[1]))
    rows = sum(item.rows_out for item in original)
    duplicates = sum(item.duplicates.exact + item.duplicates.by_key for item in original)
    structural = sum(sum(item.nulls.structural.values()) for item in original)
    imputed = sum(item.nulls.total_imputed for item in original)
    summary = validation_overview("original")
    approved = summary["approved"]
    outliers = sum(sum(item.outliers.by_column.values()) for item in original)
    outlier_pct = outliers / rows * 100 if rows else 0
    validation_pct = (approved / summary["total"] * 100) if summary["total"] else 100
    validation_status = evaluate("validacoes", {"value": validation_pct})["status"]
    outlier_status = evaluate("atipicos", {"value": outlier_pct})["status"]
    demo_dup = sum(item.duplicates.exact + item.duplicates.by_key for item in dirty)
    demo_imputed = sum(item.nulls.total_imputed for item in dirty)
    if dirty and demo_dup == 0 and demo_imputed == 0:
        demo_dup, demo_imputed = _manifest_demo()
    finished = [item.finished_at for item in original if isinstance(item.finished_at, datetime)]
    zoned = as_brasilia(max(finished)) if finished else None
    last = zoned.strftime("%d/%m/%Y %H:%M") if zoned else ""
    return [
        Fact(id="linhas", label="Linhas tratadas nas 5 bases", value=rows, kind="count"),
        Fact(id="duplicatas", label="Duplicatas removidas", value=duplicates, kind="count"),
        Fact(id="nulos_estruturais", label="Nulos estruturais mantidos", value=structural, kind="count"),
        Fact(id="nulos_imputados", label="Nulos imputados", value=imputed, kind="count"),
        Fact(
            id="validacoes",
            label="Validações aprovadas nas 5 bases",
            value=approved,
            kind="count",
            detail=summary["text"],
            status=validation_status,
        ),
        Fact(id="outliers", label="Valores atípicos", value=outliers, kind="count", status=outlier_status),
        Fact(
            id="demo",
            label="Base de demonstração (suja)",
            value=demo_dup if dirty else "execução ainda não registrada",
            kind="count" if dirty else "raw",
            detail=None if not dirty else f"{demo_dup} duplicatas removidas · {demo_imputed} nulos imputados",
        ),
        Fact(id="ultima", label="Última execução bem-sucedida", value=last, kind="raw"),
    ]
