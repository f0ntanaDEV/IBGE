"""Consistência territorial, soma dos sexos e ds1 versus pop_t da ds4."""

import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.validation_rules import evaluate, rule_for
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
            reference = float(grouped["brasil"].abs().max()) if len(grouped) else 0.0
            output.append(_result(f"{rule}:{col}", max_diff, reference))
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
        reference = float(total.abs().max()) if len(total) else 0.0
        output.append(_result(f"h_mais_m:{prefix}", max_diff, reference))
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
        return _result("ds1_idades_eq_ds4_pop", None, 0)
    max_diff = float((aligned["populacao"] - aligned["pop_t"]).abs().max())
    reference = float(aligned["pop_t"].abs().max())
    return _result("ds1_idades_eq_ds4_pop", max_diff, reference)


def _result(rule_id: str, max_diff: float | None, reference: float) -> dict:
    diff = 0.0 if max_diff is None else float(max_diff)
    rule = rule_for(rule_id)
    status = "falha" if max_diff is None else evaluate(rule, diff, reference)
    return {
        "rule": rule_id,
        "ok": status != "falha",
        "max_diff": None if max_diff is None else diff,
        "reference": reference,
        "status": status,
        "note": rule.note,
    }


def _is_ambos(value: object) -> bool:
    return str(value).strip().lower().startswith("ambos")
