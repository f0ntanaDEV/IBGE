"""Caso de uso: processar um dataset, exportar, cachear e carregar no MySQL."""

import json
from pathlib import Path

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.domain.dataset import Catalog, DatasetConfig, load_catalog
from app.domain.report import QualityReport
from app.domain.territory import safe_name
from app.services.cleaning.pipeline import prepare, run_frame
from app.services.cleaning.reader import read_dataset, read_upload
from app.services.export import export_table
from app.services.loader import load_mysql
from app.services.store import ParquetStore

UPLOAD_SUFFIXES = {".csv", ".xlsx"}
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


def catalog_or_404(dataset_id: str, catalog: Catalog | None = None) -> DatasetConfig:
    try:
        return (catalog or load_catalog()).get(dataset_id)
    except KeyError:
        raise AppError("not_found", f"Dataset {dataset_id} não existe", 404) from None


def required_columns(cfg: DatasetConfig) -> list[str]:
    if cfg.reshape is not None:
        return [safe_name(name) for name in cfg.reshape.wide_to_long.id_vars]
    columns = list(cfg.key)
    for name in ("sigla", "local"):
        if name not in columns:
            columns.append(name)
    if cfg.metrics != "auto":
        columns.extend(name for name in cfg.metrics if name not in columns)
    return columns


def validate_upload(path: Path, cfg: DatasetConfig) -> None:
    if path.suffix.lower() not in UPLOAD_SUFFIXES:
        raise AppError("invalid_file", "Envie um arquivo .csv ou .xlsx", 422)
    if path.stat().st_size > MAX_UPLOAD_BYTES:
        raise AppError("file_too_large", "Arquivo acima de 50 MB", 422)
    frame = read_upload(path, cfg)
    normalized = {safe_name(column) for column in frame.columns}
    missing = [column for column in required_columns(cfg) if column not in normalized]
    if cfg.reshape is not None and not any(str(column).isdigit() and len(str(column)) == 4 for column in normalized):
        missing.append("ano")
    if missing:
        raise AppError("missing_columns", "Colunas obrigatórias ausentes", 422, {"missing_columns": missing})


def source_path(cfg: DatasetConfig, source: str, settings: Settings) -> Path:
    if source == "original":
        path = settings.raw_dir / cfg.file
    elif source == "sujo":
        path = settings.raw_dir / f"{cfg.id}_sujo.xlsx"
    elif source == "upload":
        folder = settings.raw_dir / "uploads"
        path = next((folder / f"{cfg.id}{suffix}" for suffix in (".xlsx", ".csv") if (folder / f"{cfg.id}{suffix}").exists()), None)
        if path is None:
            raise AppError("not_found", "Nenhum upload encontrado para este dataset", 404)
    else:
        raise AppError("invalid_source", "source deve ser original, upload ou sujo", 422)
    if not path.exists():
        raise AppError("not_found", f"Arquivo não encontrado: {path.name}", 404)
    return path


def process_dataset(
    dataset_id: str,
    *,
    source: str,
    confirm: bool,
    cleaning: dict | None,
    store: ParquetStore,
    settings: Settings | None = None,
) -> QualityReport:
    settings = settings or get_settings()
    cfg = catalog_or_404(dataset_id)
    options = cleaning or {}
    strategy = options.get("outlier_strategy") or cfg.outlier.strategy
    if strategy != "flag" and source == "original" and not confirm:
        raise AppError(
            "confirmation_required",
            "Alterar a base oficial exige confirm=true",
            409,
        )
    path = source_path(cfg, source, settings)
    raw = read_upload(path, cfg) if path.suffix.lower() == ".csv" else read_dataset(path, cfg)
    others = {}
    if cfg.id == "ds1":
        ds4 = load_catalog().get("ds4")
        ds4_path = settings.raw_dir / ds4.file
        if ds4_path.exists():
            others["ds4"], _metrics = prepare(read_dataset(ds4_path, ds4), ds4)
    frame, metrics, report = run_frame(
        raw,
        cfg,
        source=source,
        null_threshold=options.get("null_threshold"),
        outlier_method=options.get("outlier_method"),
        outlier_factor=options.get("outlier_factor"),
        outlier_strategy=options.get("outlier_strategy"),
        others=others,
    )
    paths = export_table(frame, cfg.id, settings.processed_dir)
    report_path = paths["parquet"].with_suffix(".report.json")
    report_path.write_text(report.model_dump_json(), encoding="utf-8")
    metrics_path = settings.processed_dir / f"{cfg.id}_metrics.json"
    metrics_path.write_text(json.dumps(metrics, ensure_ascii=False), encoding="utf-8")
    store.put(cfg.id, frame)
    if settings.mysql_required:
        from app.db import get_engine

        try:
            load_mysql(get_engine(), frame, cfg.table, cfg.id, source, report, metrics)
        except AppError:
            raise
        except Exception as exc:
            raise AppError("database_error", "Falha ao carregar o MySQL; a carga anterior foi mantida", 503) from exc
    return report
