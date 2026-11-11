"""Pipeline puro: leitura já feita entra aqui e sai com o QualityReport."""

from time import perf_counter
from typing import Any

import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.report import QualityReport
from app.services.cleaning.duplicates import dedupe
from app.services.cleaning.missing import drop_sparse, fill_missing, recover_ids, structural_mask
from app.services.cleaning.normalize import normalize
from app.services.cleaning.outliers import apply_outliers
from app.services.cleaning.reshape import reshape
from app.services.cleaning.validate import validate


def prepare(frame: pd.DataFrame, cfg: DatasetConfig) -> tuple[pd.DataFrame, list[dict]]:
    """Normaliza e remodela, sem imputar. Usado também na checagem ds1 × ds4."""
    named, labels = normalize(frame)
    return reshape(named, cfg, labels)


def null_counts(frame: pd.DataFrame) -> dict[str, int]:
    return {str(col): int(frame[col].isna().sum()) for col in frame.columns}


def whitespace_cells(frame: pd.DataFrame) -> int:
    total = 0
    for column in frame.columns:
        series = frame[column]
        if series.dtype != object and not pd.api.types.is_string_dtype(series):
            continue
        for value in series:
            if isinstance(value, str) and value != value.strip():
                total += 1
    return total


def run_frame(
    raw: pd.DataFrame,
    cfg: DatasetConfig,
    *,
    source: str,
    null_threshold: float | None = None,
    outlier_method: str | None = None,
    outlier_factor: float | None = None,
    outlier_strategy: str | None = None,
    others: dict[str, pd.DataFrame] | None = None,
) -> tuple[pd.DataFrame, list[dict], QualityReport]:
    started = perf_counter()
    spaces = whitespace_cells(raw)
    steps: list[dict[str, Any]] = []
    threshold = cfg.null_threshold if null_threshold is None else null_threshold
    method = outlier_method or cfg.outlier.method
    factor = cfg.outlier.factor if outlier_factor is None else outlier_factor
    strategy = outlier_strategy or cfg.outlier.strategy

    shaped, metrics = prepare(raw, cfg)
    steps.append({"step": "reshape", "rows": len(shaped)})
    rows_before = len(shaped)

    recovered, discarded, ids_recovered = recover_ids(shaped, cfg)
    steps.append({"step": "recover_ids", "rows": len(recovered), "discarded": discarded})
    recovered, metrics, dropped = drop_sparse(recovered, cfg, metrics, threshold)
    nulls_pre = recovered.isna().sum(axis=1)
    deduped, dup_counts = dedupe(recovered, cfg, nulls_pre)
    before = null_counts(deduped)
    structural = structural_mask(deduped, cfg)
    structural_counts = {col: int(mask.sum()) for col, mask in structural.items()}
    filled = fill_missing(deduped, cfg, metrics, structural)
    cleaned, outlier_counts = apply_outliers(filled, cfg, metrics, method, factor, strategy)
    checks = validate(cleaned, cfg, others)
    after = null_counts(cleaned)
    steps.append({"step": "done", "rows": len(cleaned)})
    report = QualityReport(
        dataset_id=cfg.id,
        source=source,
        rows_before=rows_before,
        rows_after=len(cleaned),
        nulls_before=before,
        nulls_after=after,
        structural_nulls=structural_counts,
        duplicates_removed=dup_counts,
        outliers=outlier_counts,
        columns_dropped=dropped,
        rows_discarded=discarded,
        validations=checks,
        strategies={
            "null_threshold": threshold,
            "outlier_method": method,
            "outlier_factor": factor,
            "outlier_strategy": strategy,
        },
        duration_s=round(perf_counter() - started, 3),
        whitespace_cells=spaces,
        ids_recovered=ids_recovered,
        steps=steps,
    )
    return cleaned, metrics, report
