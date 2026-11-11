"""Recuperação de identificadores, nulos estruturais e imputação por série."""

import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.territory import nivel_de


def _id_gaps(frame: pd.DataFrame) -> int:
    total = 0
    for col in ("cod", "sigla", "local"):
        if col in frame.columns:
            total += int(frame[col].isna().sum())
    return total


def recover_ids(frame: pd.DataFrame, cfg: DatasetConfig) -> tuple[pd.DataFrame, int, int]:
    """Preenche cod/sigla/local pelo mapa do próprio arquivo e descarta ids restantes nulos."""
    out = frame.copy()
    missing_before = _id_gaps(out)
    if {"cod", "sigla", "local"} <= set(out.columns):
        known = out.dropna(subset=["cod", "sigla", "local"])
        if not known.empty:
            cod_sigla = known.groupby("cod")["sigla"].agg(lambda series: series.mode().iloc[0])
            cod_local = known.groupby("cod")["local"].agg(lambda series: series.mode().iloc[0])
            sigla_cod = known.groupby("sigla")["cod"].agg(lambda series: series.mode().iloc[0])
            local_cod = known.groupby("local")["cod"].agg(lambda series: series.mode().iloc[0])
            out["cod"] = out["cod"].fillna(out["sigla"].map(sigla_cod))
            out["cod"] = out["cod"].fillna(out["local"].map(local_cod))
            out["sigla"] = out["sigla"].fillna(out["cod"].map(cod_sigla))
            out["local"] = out["local"].fillna(out["cod"].map(cod_local))
    if "cod" in out.columns:
        out["nivel"] = out["cod"].map(nivel_de)
    required = [
        col
        for col in ("cod", "sigla", "local", "sexo", "ano", "idade", "grupo_etario")
        if col in out.columns and (col in cfg.key or col in {"cod", "sigla", "local", "sexo", "ano", "idade"})
    ]
    invalid = pd.Series(False, index=out.index)
    for col in required:
        invalid = invalid | out[col].isna()
    discarded = int(invalid.sum())
    recovered = missing_before - _id_gaps(out)
    return out.loc[~invalid].reset_index(drop=True), discarded, recovered


def structural_mask(frame: pd.DataFrame, cfg: DatasetConfig) -> dict[str, pd.Series]:
    """Posições que permanecem nulas: ex. TCG no primeiro ano da série."""
    masks: dict[str, pd.Series] = {}
    if "ano" not in frame.columns or frame.empty:
        return masks
    first = frame["ano"].min()
    for rule in cfg.structural_nulls:
        if rule.when.strip() != "ano == min(ano)":
            continue
        for col in rule.columns:
            if col not in frame.columns:
                continue
            masks[col] = frame["ano"].eq(first) & frame[col].isna()
    return masks


def drop_sparse(
    frame: pd.DataFrame, cfg: DatasetConfig, metrics: list[dict], threshold: float
) -> tuple[pd.DataFrame, list[dict], list[str]]:
    protected = set(cfg.key) | {"sigla", "local", "nivel", "sexo", "idade", "grupo_etario", "ano", "cod"}
    dropped: list[str] = []
    if frame.empty:
        return frame, metrics, dropped
    for col in list(frame.columns):
        if col in protected:
            continue
        ratio = float(frame[col].isna().mean())
        if ratio > threshold:
            dropped.append(col)
    out = frame.drop(columns=dropped) if dropped else frame
    kept = [item for item in metrics if item["coluna"] not in dropped]
    return out, kept, dropped


def fill_missing(
    frame: pd.DataFrame,
    cfg: DatasetConfig,
    metrics: list[dict],
    structural: dict[str, pd.Series],
) -> pd.DataFrame:
    """Interpola na série; nas pontas usa o vizinho; sem série, a mediana do nível e ano."""
    series = [col for col in cfg.series_by if col in frame.columns]
    sort_by = series + (["ano"] if "ano" in frame.columns else [])
    out = frame.sort_values(sort_by, kind="mergesort") if sort_by else frame.copy()
    for item in metrics:
        col = item["coluna"]
        if col not in out.columns:
            continue
        out[col] = pd.to_numeric(out[col], errors="coerce")
        if int(out[col].isna().sum()) == 0:
            continue
        protected = structural.get(col)
        if protected is None:
            protected = pd.Series(False, index=out.index)
        else:
            protected = protected.reindex(out.index).fillna(False)
        original = out[col].copy()
        if series and "ano" in out.columns:
            filled = out.groupby(series, dropna=False, sort=False)[col].transform(_fill_series)
        else:
            filled = _fill_series(out[col])
        if {"nivel", "ano"} <= set(out.columns):
            median = out.groupby(["nivel", "ano"], dropna=False)[col].transform("median")
            filled = filled.fillna(median)
        out[col] = filled.mask(protected, original)
    return out


def _fill_series(series: pd.Series) -> pd.Series:
    if series.notna().sum() == 0:
        return series
    filled = series.interpolate(method="linear", limit_direction="both")
    return filled.ffill().bfill()
