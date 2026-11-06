"""Formato longo, nível territorial e intervalo aberto da tábua."""

import pandas as pd

from app.domain.dataset import DatasetConfig
from app.domain.territory import nivel_de, safe_name
from app.services.cleaning.normalize import metric_dictionary


def reshape(frame: pd.DataFrame, cfg: DatasetConfig, labels: dict[str, str]) -> tuple[pd.DataFrame, list[dict]]:
    out = frame
    if cfg.reshape is not None:
        spec = cfg.reshape.wide_to_long
        id_vars = [safe_name(name) for name in spec.id_vars]
        years = [col for col in out.columns if str(col).isdigit() and len(str(col)) == 4]
        missing = [name for name in id_vars if name not in out.columns]
        if missing:
            raise ValueError(f"colunas de identificação ausentes: {missing}")
        out = out.melt(id_vars=id_vars, value_vars=years, var_name=spec.var_name, value_name=spec.value_name)
        labels = dict(labels)
        labels[spec.value_name] = "População"
    if "idade_inicio" in cfg.derive and "grupo_etario" in out.columns:
        out["idade_inicio"] = out["grupo_etario"].map(_idade_inicio)
    if "intervalo_de_idade" in out.columns:
        out = out.rename(columns={"intervalo_de_idade": "intervalo"})
        labels = dict(labels)
        labels["intervalo"] = labels.get("intervalo_de_idade", "INTERVALO DE IDADE")
    if "intervalo" in out.columns:
        aberto = out["intervalo"].map(lambda value: isinstance(value, str) and value.strip() == "+")
        out["intervalo_aberto"] = aberto.fillna(False).astype(bool)
        out.loc[aberto.fillna(False), "intervalo"] = pd.NA
        out["intervalo"] = pd.to_numeric(out["intervalo"], errors="coerce")
    for col in ("cod", "ano", "idade", "idade_inicio"):
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce").astype("Int64")
    if "cod" in out.columns:
        out["nivel"] = out["cod"].map(nivel_de)
    for col in metric_dictionary(out, cfg, labels):
        name = col["coluna"]
        if name in out.columns:
            out[name] = pd.to_numeric(out[name], errors="coerce")
    out = out.dropna(how="all").reset_index(drop=True)
    return out, metric_dictionary(out, cfg, labels)


def _idade_inicio(value: object) -> int | None:
    if value is None or (isinstance(value, float) and pd.isna(value)) or pd.isna(value):
        return None
    text = str(value).strip()
    if len(text) < 2 or not text[:2].isdigit():
        return None
    return int(text[:2])
