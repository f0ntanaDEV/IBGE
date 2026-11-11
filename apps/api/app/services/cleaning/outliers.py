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


_MIN_ABS_DELTA = 0.05
_MIN_DELTA_FENCE = 0.8
_MIN_LEVEL_RATIO = 4.0
_SHOCK_YEARS = {2020, 2021}


def _variation_flags(frame: pd.DataFrame, col: str, series: list[str], method: str, factor: float) -> pd.Series:
    """Marca salto anual fora da referência e grande frente à amplitude da série. 2020–2021 ficam fora da referência."""
    if "ano" not in frame.columns or not series:
        return pd.Series(False, index=frame.index)
    ordered = frame.sort_values(series + ["ano"], kind="mergesort")
    previous = ordered.groupby(series, dropna=False, sort=False)[col].shift(1)
    delta = ordered[col] / previous.replace(0, np.nan) - 1
    delta = delta.replace([np.inf, -np.inf], np.nan)
    work = ordered[series].copy()
    work["_delta"] = delta.to_numpy()
    work["_ano"] = ordered["ano"].to_numpy()
    work["_value"] = ordered[col].to_numpy()
    work["_change"] = (ordered[col] - previous).abs().to_numpy()
    reference = work.loc[~work["_ano"].isin(_SHOCK_YEARS)]
    if method == "mad":
        center = reference.groupby(series, dropna=False, sort=False)["_delta"].median()
        ref = reference.join(center.rename("_center"), on=series)
        mad = (ref["_delta"] - ref["_center"]).abs().groupby([ref[name] for name in series], dropna=False, sort=False).median()
        merged = work.join(center.rename("_center"), on=series).join(mad.rename("_mad"), on=series)
        score = _MAD_SCALE * (merged["_delta"] - merged["_center"]) / merged["_mad"].replace(0, np.nan)
        distance = (merged["_delta"] - merged["_center"]).abs()
        flagged = merged["_delta"].notna() & merged["_mad"].notna() & merged["_mad"].gt(0) & score.abs().gt(factor) & distance.gt(_MIN_DELTA_FENCE)
    else:
        quantiles = (
            reference.groupby(series, dropna=False, sort=False)["_delta"]
            .quantile([0.25, 0.5, 0.75])
            .unstack()
            .rename(columns={0.25: "_q1", 0.5: "_median", 0.75: "_q3"})
        )
        merged = work.join(quantiles, on=series)
        iqr = merged["_q3"] - merged["_q1"]
        fence = (factor * iqr).clip(lower=_MIN_DELTA_FENCE)
        flagged = merged["_delta"].notna() & merged["_median"].notna() & (merged["_delta"] - merged["_median"]).abs().gt(fence)
    flagged = flagged & work["_delta"].abs().ge(_MIN_ABS_DELTA) & _level_jump(work, reference, series)
    return flagged.reindex(frame.index).fillna(False).astype(bool)


def _level_jump(work: pd.DataFrame, reference: pd.DataFrame, series: list[str]) -> pd.Series:
    """Exige |x − x anterior| maior que 4× o IQR do nível, para não marcar taxas perto de zero."""
    quantiles = (
        reference.groupby(series, dropna=False, sort=False)["_value"]
        .quantile([0.25, 0.75])
        .unstack()
        .rename(columns={0.25: "_x1", 0.75: "_x3"})
    )
    levels = work.join(quantiles, on=series)
    width = (levels["_x3"] - levels["_x1"]).fillna(0)
    return work["_change"].gt(_MIN_LEVEL_RATIO * width)


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
