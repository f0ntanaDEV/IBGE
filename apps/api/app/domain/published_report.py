"""Contrato HTTP do relatório de qualidade."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class StepCount(BaseModel):
    before: int
    after: int


class NullsReport(BaseModel):
    by_column: dict[str, StepCount]
    structural: dict[str, int]
    total_imputed: int


class DuplicatesReport(BaseModel):
    exact: int
    by_key: int


class OutliersReport(BaseModel):
    by_column: dict[str, int]
    by_reason: dict[str, int]
    strategy: str
    method: str


class Validation(BaseModel):
    rule: str
    ok: bool
    max_diff: float


class QualityReport(BaseModel):
    dataset_id: str
    source: Literal["original", "sujo", "upload"]
    run_id: int
    started_at: datetime
    finished_at: datetime
    duration_s: float
    rows_in: int
    rows_out: int
    dropped_columns: list[str]
    nulls: NullsReport
    duplicates: DuplicatesReport
    outliers: OutliersReport
    validations: list[Validation]


def publish_report(raw: dict[str, Any], *, run_id: int = 0, started_at: datetime | None = None, finished_at: datetime | None = None) -> QualityReport:
    """Aceita o JSON novo ou o relatório interno do pipeline."""
    if "nulls" in raw and "rows_in" in raw:
        payload = dict(raw)
        payload.setdefault("run_id", run_id)
        if started_at is not None:
            payload.setdefault("started_at", started_at)
        if finished_at is not None:
            payload.setdefault("finished_at", finished_at)
        return QualityReport.model_validate(payload)
    before = {str(key): int(value) for key, value in (raw.get("nulls_before") or {}).items()}
    after = {str(key): int(value) for key, value in (raw.get("nulls_after") or {}).items()}
    structural = {str(key): int(value) for key, value in (raw.get("structural_nulls") or {}).items()}
    by_column = {
        column: StepCount(before=before.get(column, 0), after=after.get(column, 0))
        for column in sorted(set(before) | set(after))
    }
    imputed = 0
    for column, counts in by_column.items():
        if column in structural:
            continue
        imputed += max(0, counts.before - counts.after)
    duplicates = raw.get("duplicates_removed") or {}
    outlier_raw = raw.get("outliers") or {}
    by_outlier: dict[str, int] = {}
    by_reason: dict[str, int] = {}
    for column, reasons in outlier_raw.items():
        if isinstance(reasons, dict):
            total = sum(int(value) for value in reasons.values())
            by_outlier[str(column)] = total
            for reason, value in reasons.items():
                by_reason[str(reason)] = by_reason.get(str(reason), 0) + int(value)
        else:
            by_outlier[str(column)] = int(reasons)
    strategies = raw.get("strategies") or {}
    source = raw.get("source") or "original"
    if source not in {"original", "sujo", "upload"}:
        source = "original"
    now = datetime.now()
    validations = []
    for item in raw.get("validations") or []:
        validations.append(
            Validation(
                rule=str(item.get("rule")),
                ok=bool(item.get("ok")),
                max_diff=float(item.get("max_diff") or 0),
            )
        )
    return QualityReport(
        dataset_id=str(raw.get("dataset_id")),
        source=source,
        run_id=run_id,
        started_at=started_at or now,
        finished_at=finished_at or now,
        duration_s=float(raw.get("duration_s") or 0),
        rows_in=int(raw.get("rows_in") if raw.get("rows_in") is not None else raw.get("rows_before") or 0),
        rows_out=int(raw.get("rows_out") if raw.get("rows_out") is not None else raw.get("rows_after") or 0),
        dropped_columns=list(raw.get("dropped_columns") or raw.get("columns_dropped") or []),
        nulls=NullsReport(by_column=by_column, structural=structural, total_imputed=imputed),
        duplicates=DuplicatesReport(
            exact=int(duplicates.get("exact") or 0),
            by_key=int(duplicates.get("by_key") or duplicates.get("key") or 0),
        ),
        outliers=OutliersReport(
            by_column=by_outlier,
            by_reason=by_reason,
            strategy=str(strategies.get("outlier_strategy") or ""),
            method=str(strategies.get("outlier_method") or ""),
        ),
        validations=validations,
    )
