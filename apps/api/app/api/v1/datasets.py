"""Datasets: consulta, upload, processamento e download."""

import json
from pathlib import Path

from typing import Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.api.deps import assert_nivel_compativel, known_territory_codes, territory_params
from app.core.config import get_settings
from app.core.errors import AppError
from app.domain.published_report import QualityReport as PublishedQualityReport
from app.domain.published_report import publish_report
from app.domain.dataset import load_catalog
from app.services.analytics import (
    apply_filters,
    compute_claims,
    heatmap,
    json_loads,
    map_values,
    parse_faixa_list,
    parse_int_list,
    pyramid,
    scatter,
    slope,
    summary,
)
from app.services.cleaning.reader import read_upload
from app.services.etl import catalog_or_404, process_dataset, validate_upload
from app.services.store import ParquetStore
from app.integrations.ibge_news import fetch_news, news_cache

router = APIRouter(prefix="/datasets", tags=["datasets"])


class CleaningIn(BaseModel):
    null_threshold: float | None = None
    outlier_method: str | None = None
    outlier_factor: float | None = None
    outlier_strategy: str | None = None


class ProcessIn(BaseModel):
    source: str = "original"
    cleaning: CleaningIn | None = None
    confirm: bool = False


def _store() -> ParquetStore:
    return ParquetStore(get_settings().processed_dir)


def _reports(dataset_id: str) -> list[dict]:
    folder = get_settings().processed_dir
    paths = sorted(folder.glob(f"{dataset_id}_*.report.json"))
    return [json.loads(path.read_text(encoding="utf-8")) for path in paths]


@router.get("")
def list_datasets() -> list[dict]:
    items = []
    for cfg in load_catalog().datasets:
        reports = _reports(cfg.id)
        last = reports[-1] if reports else None
        items.append(
            {
                "id": cfg.id,
                "name": cfg.name,
                "table": cfg.table,
                "last_run": None
                if last is None
                else {
                    "source": last.get("source"),
                    "rows_in": last.get("rows_in", last.get("rows_before")),
                    "rows_out": last.get("rows_out", last.get("rows_after")),
                    "duration_s": last.get("duration_s"),
                },
            }
        )
    return items


@router.get("/{dataset_id}/metrics")
def metrics(dataset_id: str) -> list[dict]:
    cfg = catalog_or_404(dataset_id)
    path = get_settings().processed_dir / f"{dataset_id}_metrics.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    if cfg.metrics != "auto":
        return [
            {"coluna": name, "rotulo_original": name, "descricao": name, "unidade": ""}
            for name in cfg.metrics
        ]
    raise AppError("not_found", "Métricas ainda não geradas. Processe o dataset.", 404)


@router.post("/{dataset_id}/upload")
def upload(dataset_id: str, file: UploadFile = File(...)) -> dict:
    cfg = catalog_or_404(dataset_id)
    suffix = Path(file.filename or "").suffix.lower()
    payload = file.file.read()
    settings = get_settings()
    folder = settings.raw_dir / "uploads"
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f"{dataset_id}{suffix or '.bin'}"
    dest.write_bytes(payload)
    try:
        validate_upload(dest, cfg)
    except AppError:
        dest.unlink(missing_ok=True)
        raise
    frame = read_upload(dest, cfg)
    return {
        "dataset_id": dataset_id,
        "filename": dest.name,
        "bytes": len(payload),
        "columns": [str(column) for column in frame.columns],
        "preview": json_loads(frame.head(10)),
    }


@router.post("/{dataset_id}/process")
def process(dataset_id: str, body: ProcessIn) -> dict:
    catalog_or_404(dataset_id)
    cleaning = body.cleaning.model_dump(exclude_none=True) if body.cleaning else None
    report = process_dataset(
        dataset_id,
        source=body.source,
        confirm=body.confirm,
        cleaning=cleaning,
        store=_store(),
    )
    return report.model_dump()


def _decode_report(payload: object) -> dict | None:
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            return None
    return payload if isinstance(payload, dict) else None


@router.get("/{dataset_id}/quality-report", response_model=PublishedQualityReport | None)
def quality_report(
    dataset_id: str,
    source: Literal["original", "sujo"] = "original",
) -> PublishedQualityReport | None:
    catalog_or_404(dataset_id)
    reports = [item for item in _reports(dataset_id) if (item.get("source") or "original") == source]
    if not reports:
        return None
    return publish_report(reports[-1])


@router.get("/{dataset_id}/runs")
def runs(dataset_id: str) -> list[dict]:
    catalog_or_404(dataset_id)
    try:
        from app.db import get_engine
        from app.repositories.etl_runs import list_runs

        with get_engine().connect() as connection:
            rows = list_runs(connection, dataset_id)
        if rows:
            normalized = []
            for row in rows:
                item = dict(row)
                parsed = _decode_report(item.get("report_json"))
                if parsed is not None:
                    item["report_json"] = parsed
                normalized.append(item)
            return normalized
    except Exception:
        pass
    return _reports(dataset_id)


@router.get("/{dataset_id}/data")
def data(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ano: int | None = None,
    anos: str | None = None,
    cod: str | None = None,
    faixa: str | None = None,
    nivel: str | None = None,
    sexo: str | None = None,
    idade: int | None = None,
    grupo: str | None = None,
    sort: str | None = None,
    desc: bool = False,
) -> dict:
    codes = parse_int_list(cod, "cod")
    known = known_territory_codes()
    if codes is not None:
        missing = [code for code in codes if code not in known]
        if missing:
            raise AppError("unknown_territory", f"Território {missing[0]} não existe", 422, {"cod": missing[0]})
        if len(codes) == 1:
            assert_nivel_compativel(codes[0], nivel)
    frame = apply_filters(
        _store().get(dataset_id),
        ano=ano,
        anos=parse_int_list(anos, "anos"),
        cod=codes,
        faixa=parse_faixa_list(faixa),
        nivel=nivel,
        sexo=sexo,
        idade=idade,
        grupo=grupo,
    )
    if sort and sort in frame.columns:
        frame = frame.sort_values(sort, ascending=not desc, kind="mergesort")
    start = (page - 1) * page_size
    chunk = frame.iloc[start : start + page_size]
    return {"page": page, "page_size": page_size, "total": int(len(frame)), "items": json_loads(chunk)}


@router.get("/{dataset_id}/summary")
def dataset_summary(
    dataset_id: str,
    ano: int | None = None,
    cod: int | None = Depends(territory_params),
    sexo: str | None = None,
) -> dict:
    cfg = catalog_or_404(dataset_id)
    if cod is None:
        code = None
    else:
        code = cod
    return summary(_store().get(dataset_id), cfg, ano=ano, cod=code, sexo=sexo)


@router.get("/{dataset_id}/pyramid")
def dataset_pyramid(
    dataset_id: str,
    ano: int | None = None,
    cod: int | None = Depends(territory_params),
    compare_ano: int | None = None,
) -> list[dict]:
    cfg = catalog_or_404(dataset_id)
    code = None if cod is None else cod
    return pyramid(_store().get(dataset_id), cfg, ano, code, compare_ano)


@router.get("/{dataset_id}/map")
def dataset_map(dataset_id: str, metric: str, ano: int) -> dict:
    catalog_or_404(dataset_id)
    return map_values(_store().get(dataset_id), metric, ano)


@router.get("/{dataset_id}/heatmap")
def dataset_heatmap(dataset_id: str, cod: int | None = Depends(territory_params), sexo: str | None = None) -> dict:
    if dataset_id != "ds1":
        raise AppError("not_applicable", "Mapa de calor disponível apenas para ds1", 422)
    return heatmap(_store().get(dataset_id), cod, sexo)


@router.get("/{dataset_id}/scatter")
def dataset_scatter(dataset_id: str, anos: str | None = None) -> dict:
    if dataset_id != "ds4":
        raise AppError("not_applicable", "Dispersão disponível apenas para ds4", 422)
    return scatter(_store().get(dataset_id), parse_int_list(anos, "anos"))


@router.get("/{dataset_id}/slope")
def dataset_slope(dataset_id: str, metric: str, ano_a: int, ano_b: int) -> dict:
    catalog_or_404(dataset_id)
    return slope(_store().get(dataset_id), metric, ano_a, ano_b)


@router.get("/{dataset_id}/claims")
def claims(dataset_id: str) -> list[dict]:
    cfg = catalog_or_404(dataset_id)
    settings = get_settings()
    cache = news_cache(settings)
    results = []
    for item in compute_claims(_store().get(dataset_id), cfg):
        terms = item.pop("news_terms")
        news = fetch_news(terms, settings, cache)
        item["available"] = news["available"]
        item["news"] = news["items"]
        results.append(item)
    return results


@router.get("/{dataset_id}/news")
def news(dataset_id: str) -> dict:
    cfg = catalog_or_404(dataset_id)
    settings = get_settings()
    return fetch_news(cfg.news_keywords, settings, news_cache(settings))


@router.get("/{dataset_id}/download")
def download(dataset_id: str, format: str = Query("csv", pattern="^(csv|xlsx)$")):
    catalog_or_404(dataset_id)
    path = _store().latest_file(dataset_id, f".{format}")
    if path is None:
        raise AppError("not_found", "Arquivo tratado não encontrado", 404)
    media = "text/csv" if format == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(path, filename=path.name, media_type=media)
