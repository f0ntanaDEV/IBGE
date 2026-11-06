"""Consistência territorial, soma dos sexos e ds1 versus pop_t da ds4."""

import pandas as pd

from app.domain.dataset import DatasetConfig

COUNT_TOLERANCE = 1.0
PROP_TOLERANCE = 0.05
_RATE_PREFIXES = (
    "tcg",
    "e0",
    "e60",
    "tmi",
    "tbn",
    "tbm",
    "tcv",
    "tft",
    "tef",
    "rs",
    "rdj",
    "rdi",
    "rdt",
    "ie",
    "id",
    "n_5q",
    "n_45q",
    "n_20q",
    "nmx",
    "nax",
    "nqx",
    "lx",
    "ndx",
    "nlx",
    "sx",
    "tx",
    "ex",
)


def is_count(name: str) -> bool:
    if name == "populacao" or name.startswith(("pop", "nasc", "obt")):
        return True
    if name.startswith("n_") and not name.startswith(("n_5q", "n_45q", "n_20q")):
        return True
    return False


def validate(frame: pd.DataFrame, cfg: DatasetConfig, others: dict[str, pd.DataFrame] | None = None) -> list[dict]:
    results: list[dict] = []
    results.extend(_territorial(frame))
    results.extend(_sex_sums(frame))
    if cfg.id == "ds1" and others and "ds4" in others:
        results.append(_ages_match_pop(frame, others["ds4"]))
    return results


def _territorial(frame: pd.DataFrame) -> list[dict]:
    if "nivel" not in frame.columns or "ano" not in frame.columns:
        return []
    dims = [col for col in ("ano", "sexo", "idade", "grupo_etario") if col in frame.columns]
    output = []
    for col in frame.columns:
        if not is_count(col):
            continue
        grouped = frame.groupby(dims + ["nivel"], dropna=False)[col].sum().unstack("nivel")
        for level, rule in (("regiao", "brasil_eq_regioes"), ("uf", "brasil_eq_ufs")):
            if "brasil" not in grouped.columns or level not in grouped.columns:
                continue
            diff = (grouped["brasil"] - grouped[level]).abs()
            max_diff = float(diff.max()) if len(diff) else 0.0
            output.append({"rule": f"{rule}:{col}", "ok": max_diff <= COUNT_TOLERANCE, "max_diff": max_diff})
    return output


def _sex_sums(frame: pd.DataFrame) -> list[dict]:
    groups: dict[str, set[str]] = {}
    for col in frame.columns:
        for suffix in ("_t", "_h", "_m"):
            if col.endswith(suffix):
                groups.setdefault(col[: -len(suffix)], set()).add(suffix)
    output = []
    for prefix, suffixes in groups.items():
        if suffixes != {"_t", "_h", "_m"}:
            continue
        kind = _sex_kind(prefix)
        if kind is None:
            continue
        total = frame[f"{prefix}_t"]
        diff = (frame[f"{prefix}_h"] + frame[f"{prefix}_m"] - total).abs()
        comparable = total.notna() & frame[f"{prefix}_h"].notna() & frame[f"{prefix}_m"].notna()
        max_diff = float(diff[comparable].max()) if bool(comparable.any()) else 0.0
        tolerance = COUNT_TOLERANCE if kind == "count" else PROP_TOLERANCE
        output.append({"rule": f"h_mais_m:{prefix}", "ok": max_diff <= tolerance, "max_diff": max_diff})
    return output


def _sex_kind(prefix: str) -> str | None:
    if prefix.startswith(_RATE_PREFIXES) or prefix in _RATE_PREFIXES:
        return None
    if prefix.startswith("p_") or prefix == "p":
        return "prop"
    if is_count(f"{prefix}_t"):
        return "count"
    return None


def _ages_match_pop(ds1: pd.DataFrame, ds4: pd.DataFrame) -> dict:
    ambos = ds1[ds1["sexo"].map(_is_ambos)]
    left = ambos.groupby(["cod", "ano"])["populacao"].sum()
    right = ds4.groupby(["cod", "ano"])["pop_t"].sum()
    aligned = left.to_frame("populacao").join(right.rename("pop_t"), how="inner")
    if aligned.empty:
        return {"rule": "ds1_idades_eq_ds4_pop", "ok": False, "max_diff": None}
    max_diff = float((aligned["populacao"] - aligned["pop_t"]).abs().max())
    return {"rule": "ds1_idades_eq_ds4_pop", "ok": max_diff <= COUNT_TOLERANCE, "max_diff": max_diff}


def _is_ambos(value: object) -> bool:
    return str(value).strip().lower().startswith("ambos")
