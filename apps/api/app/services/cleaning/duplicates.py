"""Duplicatas exatas e por chave. Brasil e regiões permanecem: o cod entra na chave."""

import pandas as pd

from app.domain.dataset import DatasetConfig


def dedupe(frame: pd.DataFrame, cfg: DatasetConfig, nulls_before: pd.Series) -> tuple[pd.DataFrame, dict[str, int]]:
    exact_mask = frame.duplicated(keep="first")
    kept = frame.loc[~exact_mask].copy()
    scores = nulls_before.reindex(kept.index).fillna(0)
    kept = kept.assign(_nulls_pre=scores)
    kept = kept.sort_values("_nulls_pre", kind="mergesort")
    key = [col for col in cfg.key if col in kept.columns]
    key_mask = kept.duplicated(subset=key, keep="first") if key else pd.Series(False, index=kept.index)
    result = kept.loc[~key_mask].drop(columns="_nulls_pre").reset_index(drop=True)
    return result, {"exact": int(exact_mask.sum()), "key": int(key_mask.sum())}
