"""Renomeia colunas, limpa strings e coerge números."""

import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.territory import safe_name

TEXT_COLUMNS = {"sigla", "local", "sexo", "grupo_etario", "intervalo", "intervalo_de_idade"}


def normalize(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
    """Retorna o frame com colunas snake_case e o mapa nome_normalizado → rótulo original."""
    out = frame.copy()
    labels: dict[str, str] = {}
    names: list[str] = []
    used: dict[str, int] = {}
    for original in frame.columns:
        base = safe_name(original)
        count = used.get(base, 0) + 1
        used[base] = count
        name = base if count == 1 else f"{base}_{count}"
        names.append(name)
        labels[name] = str(original).strip()
    out.columns = names
    for col in out.columns:
        if out[col].dtype == object or pd.api.types.is_string_dtype(out[col]):
            out[col] = out[col].map(_clean_text)
    for col in out.columns:
        if col in TEXT_COLUMNS or pd.api.types.is_numeric_dtype(out[col]):
            continue
        converted = pd.to_numeric(out[col], errors="coerce")
        nonempty = out[col].map(lambda value: pd.notna(value) and str(value).strip() != "")
        if int(nonempty.sum()) == 0 or int(converted.notna().sum()) >= int(nonempty.sum()) * 0.5:
            out[col] = converted
    return out, labels


def _clean_text(value: object) -> object:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return pd.NA
    if not isinstance(value, str):
        return value
    text = value.strip()
    return pd.NA if text == "" else text


def metric_names(frame: pd.DataFrame, cfg: DatasetConfig) -> list[str]:
    if cfg.metrics != "auto":
        return [name for name in cfg.metrics if name in frame.columns]
    skip = TEXT_COLUMNS | {
        "cod",
        "ano",
        "idade",
        "idade_inicio",
        "nivel",
        "intervalo_aberto",
        "is_outlier",
        "outlier_motivo",
    }
    names = []
    for col in frame.columns:
        if col in skip or str(col).isdigit():
            continue
        if pd.api.types.is_numeric_dtype(frame[col]):
            names.append(col)
    return names


def metric_dictionary(frame: pd.DataFrame, cfg: DatasetConfig, labels: dict[str, str]) -> list[dict]:
    items = []
    for name in metric_names(frame, cfg):
        rotulo = labels.get(name, _default_label(name))
        items.append(
            {
                "coluna": name,
                "rotulo_original": rotulo,
                "descricao": _describe(name, rotulo),
                "unidade": _unit(name),
            }
        )
    return items


def _default_label(name: str) -> str:
    if name == "populacao":
        return "População"
    return name


def _describe(name: str, rotulo: str) -> str:
    known = {
        "populacao": "População projetada",
        "pop_t": "População total",
        "tft": "Taxa de fecundidade total",
        "e0_t": "Esperança de vida ao nascer, ambos os sexos",
        "tcg_t": "Taxa de crescimento geométrico, ambos os sexos",
        "tmi_t": "Taxa de mortalidade infantil, ambos os sexos",
        "nqx": "Probabilidade de morte entre as idades",
        "nmx": "Taxa central de mortalidade na idade. No resumo, o valor é o da idade 0, em óbitos por mil.",
        "lx": "Sobreviventes à idade exata",
        "ex": "Esperança de vida à idade exata",
    }
    return known.get(name, rotulo)


def _unit(name: str) -> str:
    if name in {"populacao"} or name.startswith(("pop_", "nasc_", "obt_", "n_0", "n_15", "n_18", "n_60", "n_65", "n_80")):
        return "pessoas"
    if name.startswith("p_") or name.startswith("tcg") or name in {"tbn", "tbm", "tcv"}:
        return "percentual"
    if name.startswith(("e0", "e60", "ex")) or name in {"id_m", "id_med"}:
        return "anos"
    if name == "tft" or name.startswith("tef_"):
        return "filhos por mulher"
    if name.startswith("tmi") or name.startswith(("n_5q", "n_45q", "n_20q")) or name in {"nqx", "nmx"}:
        return "taxa"
    if name in {"lx", "ndx", "nlx", "tx", "sx", "nax"}:
        return "tábua"
    return "número"
