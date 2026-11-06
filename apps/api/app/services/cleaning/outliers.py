"""Outliers por variação dentro da série e regras de domínio da tábua."""

import numpy as np
import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.territory import SKIP_OUTLIER
from app.services.cleaning.missing import _fill_series

_MAD_SCALE = 0.6745


def apply_outliers(
    frame: pd.DataFrame,
    cfg: DatasetConfig,
    metrics: list[dict],
    method: str,
    factor: float,
    strategy: str,
) -> tuple[pd.DataFrame, dict[str, dict[str, int]]]:
    out = frame.copy()
    reasons: list[pd.Series] = []
    counts: dict[str, dict[str, int]] = {}
    series = [col for col in cfg.series_by if col in out.columns]
    flagged_any = pd.Series(False, index=out.index)

    for item in metrics:
        col = item["coluna"]
        if col not in out.columns or col in SKIP_OUTLIER:
            continue
        stat = _variation_flags(out, col, series, method, factor)
        domain = _domain_flags(out, cfg, col)
        flagged = stat | domain
        if not bool(flagged.any()):
            continue
        motivo = pd.Series(pd.NA, index=out.index, dtype="object")
        if bool(stat.any()):
            motivo.loc[stat] = f"{col}: {method}"
            counts.setdefault(col, {})[method] = int(stat.sum())
        if bool(domain.any()):
            label = f"{col}: dominio"
            motivo.loc[domain] = motivo.loc[domain].map(lambda current, label=label: f"{current}; {label}" if pd.notna(current) else label)
            counts.setdefault(col, {})["dominio"] = int(domain.sum())
        reasons.append(motivo)
        flagged_any = flagged_any | flagged
        if strategy == "cap":
            out[col] = _cap(out, col, series, flagged)

    if strategy == "remove":
        removed = int(flagged_any.sum())
        out = out.loc[~flagged_any].reset_index(drop=True)
        counts["_rows_removed"] = {"remove": removed}
        return out, counts

    if strategy in {"flag", "cap"}:
        out["is_outlier"] = flagged_any.to_numpy()
        if reasons:
            combined = reasons[0]
            for extra in reasons[1:]:
                combined = combined.combine(extra, _join_reasons)
            out["outlier_motivo"] = combined
        else:
            out["outlier_motivo"] = pd.NA
    return out, counts


def _join_reasons(left: object, right: object) -> object:
    if pd.isna(left):
        return right
    if pd.isna(right):
        return left
    return f"{left}; {right}"


def _variation_flags(frame: pd.DataFrame, col: str, series: list[str], method: str, factor: float) -> pd.Series:
    if "ano" not in frame.columns or not series:
        return pd.Series(False, index=frame.index)
    ordered = frame.sort_values(series + ["ano"], kind="mergesort")
    previous = ordered.groupby(series, dropna=False, sort=False)[col].shift(1)
    delta = ordered[col] / previous.replace(0, np.nan) - 1
    delta = delta.replace([np.inf, -np.inf], np.nan)
    work = ordered[series].copy()
    work["_delta"] = delta.to_numpy()
    grouped = work.groupby(series, dropna=False, sort=False)["_delta"]
    if method == "mad":
        center = grouped.transform("median")
        mad = (work["_delta"] - center).abs().groupby([work[name] for name in series], dropna=False, sort=False).transform("median")
        score = _MAD_SCALE * (work["_delta"] - center) / mad.replace(0, np.nan)
        flagged = work["_delta"].notna() & mad.notna() & (mad > 0) & score.abs().gt(factor)
    else:
        quantiles = grouped.quantile([0.25, 0.75]).unstack().rename(columns={0.25: "_q1", 0.75: "_q3"})
        merged = work.join(quantiles, on=series)
        iqr = merged["_q3"] - merged["_q1"]
        flagged = merged["_delta"].notna() & (
            (merged["_delta"] < merged["_q1"] - factor * iqr) | (merged["_delta"] > merged["_q3"] + factor * iqr)
        )
    return flagged.reindex(frame.index).fillna(False).astype(bool)


def _domain_flags(frame: pd.DataFrame, cfg: DatasetConfig, col: str) -> pd.Series:
    flagged = pd.Series(False, index=frame.index)
    rules = set(cfg.domain_rules)
    if col == "nqx" and "0 <= nqx <= 1" in rules:
        flagged = flagged | (frame[col].notna() & ((frame[col] < 0) | (frame[col] > 1)))
    if col == "ex" and "ex >= 0" in rules:
        flagged = flagged | (frame[col].notna() & (frame[col] < 0))
    if col == "lx" and any(rule.startswith("lx non_increasing") for rule in rules):
        if {"cod", "sexo", "ano", "idade"} <= set(frame.columns):
            ordered = frame.sort_values(["cod", "sexo", "ano", "idade"], kind="mergesort")
            previous = ordered.groupby(["cod", "sexo", "ano"], dropna=False, sort=False)["lx"].shift(1)
            bad = ordered["lx"].notna() & previous.notna() & ordered["lx"].gt(previous + 1e-6)
            flagged = flagged | bad.reindex(frame.index).fillna(False).astype(bool)
    return flagged


def _cap(frame: pd.DataFrame, col: str, series: list[str], flagged: pd.Series) -> pd.Series:
    sort_by = series + (["ano"] if "ano" in frame.columns else [])
    ordered = frame.sort_values(sort_by, kind="mergesort") if sort_by else frame
    masked = ordered[col].mask(flagged.reindex(ordered.index).fillna(False))
    if series:
        filled = masked.groupby([ordered[name] for name in series], dropna=False, sort=False).transform(_fill_series)
    else:
        filled = _fill_series(masked)
    filled = filled.reindex(frame.index)
    replaced = frame[col].copy()
    can_replace = flagged.reindex(frame.index).fillna(False) & filled.notna()
    replaced.loc[can_replace] = filled.loc[can_replace]
    return replaced
