"""Catálogo dos datasets declarado em datasets.yaml."""

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings


class WideToLong(BaseModel):
    id_vars: list[str]
    var_name: str
    value_name: str


class ReshapeSpec(BaseModel):
    wide_to_long: WideToLong


class StructuralNull(BaseModel):
    columns: list[str]
    when: str


class ClaimSpec(BaseModel):
    id: str
    label: str
    compute: str
    news_terms: list[str]


class OutlierDefaults(BaseModel):
    method: Literal["iqr_delta", "mad"] = "iqr_delta"
    factor: float = 3.0
    strategy: Literal["flag", "cap", "remove"] = "flag"


class DatasetConfig(BaseModel):
    id: str
    name: str
    file: str
    sheet: str
    header_row: int = Field(ge=1)
    reshape: ReshapeSpec | None = None
    derive: dict[str, str] = Field(default_factory=dict)
    table: str
    key: list[str]
    series_by: list[str]
    metrics: list[str] | Literal["auto"] = "auto"
    news_keywords: list[str] = Field(default_factory=list)
    claims: list[ClaimSpec] = Field(default_factory=list)
    structural_nulls: list[StructuralNull] = Field(default_factory=list)
    domain_rules: list[str] = Field(default_factory=list)
    engine: str | None = None
    null_threshold: float = 0.6
    outlier: OutlierDefaults = Field(default_factory=OutlierDefaults)

    @field_validator("structural_nulls")
    @classmethod
    def _when_conhecido(cls, value: list[StructuralNull]) -> list[StructuralNull]:
        for item in value:
            if item.when.strip() != "ano == min(ano)":
                raise ValueError(f"condição estrutural não suportada: {item.when}")
        return value


class Catalog(BaseModel):
    datasets: list[DatasetConfig]

    def get(self, dataset_id: str) -> DatasetConfig:
        for item in self.datasets:
            if item.id == dataset_id:
                return item
        raise KeyError(dataset_id)

    def by_filename(self, filename: str) -> DatasetConfig | None:
        for item in self.datasets:
            if item.file == filename:
                return item
        return None


def load_catalog(path: Path | None = None) -> Catalog:
    """Lê datasets.yaml e aplica os defaults de nulos e outliers."""
    settings = get_settings()
    target = path or settings.datasets_path
    raw: dict[str, Any] = yaml.safe_load(target.read_text(encoding="utf-8"))
    defaults = raw.get("defaults") or {}
    outlier = defaults.get("outlier") or {}
    threshold = defaults.get("null_threshold", 0.6)
    items = []
    for entry in raw["datasets"]:
        merged = dict(entry)
        merged.setdefault("null_threshold", threshold)
        merged["outlier"] = {**outlier, **(entry.get("outlier") or {})}
        items.append(merged)
    catalog = Catalog(datasets=items)
    ids = [item.id for item in catalog.datasets]
    if len(ids) != len(set(ids)):
        raise ValueError("ids de dataset duplicados")
    return catalog
