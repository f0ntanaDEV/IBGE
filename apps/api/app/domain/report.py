"""Relatório de qualidade do pipeline (R7.2)."""

from typing import Any

from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    rule: str
    ok: bool
    max_diff: float | None = None


class QualityReport(BaseModel):
    dataset_id: str
    source: str
    rows_before: int
    rows_after: int
    nulls_before: dict[str, int]
    nulls_after: dict[str, int]
    structural_nulls: dict[str, int]
    duplicates_removed: dict[str, int]
    outliers: dict[str, dict[str, int]]
    columns_dropped: list[str]
    rows_discarded: int
    validations: list[ValidationResult]
    strategies: dict[str, Any]
    duration_s: float
    steps: list[dict[str, Any]] = Field(default_factory=list)
