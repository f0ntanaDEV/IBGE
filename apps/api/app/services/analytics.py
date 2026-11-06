"""Resumos, pirâmide, rankings, mapas e marcos calculados."""

import re
from datetime import date

import pandas as pd

from app.core.errors import AppError
from app.domain.dataset import DatasetConfig
from app.services.cleaning.validate import is_count

# RDT65 do IBGE é dependentes por 100 pessoas de 15–64 anos. Abaixo de 50 há bônus.
BONUS_RDT_PER_100 = 50.0
BONUS_RDT_RATIO = 0.5
_FAIXA_RE = re.compile(r"^(?:(\d+)\+|(\d+)-(\d+)|(\d+))$")


def parse_int_list(value: str | int | None, name: str) -> list[int] | None:
    """Aceita `12`, `12,31` ou None. Rejeita vazio e token não inteiro."""
    if value is None:
        return None
    if isinstance(value, int) and not isinstance(value, bool):
        return [value]
    text = str(value).strip()
    if not text:
        return None
    parts = [part.strip() for part in text.split(",")]
    if any(part == "" for part in parts):
        raise AppError("validation_error", f"Lista inválida em {name}", 422, {"param": name})
    numbers = []
    for part in parts:
        if not re.fullmatch(r"-?\d+", part):
            raise AppError("validation_error", f"Valor inválido em {name}: {part}", 422, {"param": name})
        numbers.append(int(part))
    return numbers


def parse_faixa_list(value: str | None) -> list[str] | None:
    """Aceita `0-14`, `60+` e idade simples, separados por vírgula."""
    if value is None or not str(value).strip():
        return None
    parts = [part.strip() for part in str(value).split(",")]
    if any(part == "" for part in parts):
        raise AppError("validation_error", "Lista inválida em faixa", 422, {"param": "faixa"})
    for part in parts:
        if _FAIXA_RE.match(part) is None:
            raise AppError("validation_error", f"Faixa inválida: {part}", 422, {"param": "faixa"})
    return parts


def apply_filters(
    frame: pd.DataFrame,
    *,
    ano: int | None = None,
    anos: str | list[int] | None = None,
    cod: int | str | list[int] | None = None,
    nivel: str | None = None,
    sexo: str | None = None,
    idade: int | None = None,
    grupo: str | None = None,
    faixa: str | list[str] | None = None,
) -> pd.DataFrame:
    out = frame
    years = anos if isinstance(anos, list) else parse_int_list(anos, "anos")
    if years is not None and "ano" in out.columns:
        out = out[out["ano"].isin(years)]
    if ano is not None and "ano" in out.columns:
        out = out[out["ano"] == int(ano)]
    codes = cod if isinstance(cod, list) else parse_int_list(cod, "cod")
    if codes is not None and "cod" in out.columns:
        out = out[out["cod"].isin(codes)]
    if nivel is not None and "nivel" in out.columns:
        out = out[out["nivel"] == nivel]
    if sexo is not None and "sexo" in out.columns:
        wanted = sexo.strip().lower()
        out = out[out["sexo"].astype(str).str.strip().str.lower() == wanted]
    if idade is not None and "idade" in out.columns:
        out = out[out["idade"] == int(idade)]
    bands = faixa if isinstance(faixa, list) else parse_faixa_list(faixa)
    if bands:
        out = _filter_faixa(out, bands)
    if grupo is not None and "grupo_etario" in out.columns:
        out = out[out["grupo_etario"].astype(str).str.strip() == grupo.strip()]
    return out


def summary(
    frame: pd.DataFrame,
    cfg: DatasetConfig,
    *,
    ano: int | None = None,
    cod: int | None = None,
    sexo: str | None = None,
) -> dict:
    metric = _main_metric(cfg, frame)
    current = apply_filters(frame, ano=ano, cod=cod, sexo=sexo)
    year = ano if ano is not None else _latest_year(current)
    scoped = apply_filters(frame, ano=year, cod=cod, sexo=sexo)
    additive = is_count(metric)
    value = _aggregate(scoped, metric, additive)
    kpis = [{"id": metric, "label": _label(metric), "value": value, "unidade": _unit(metric)}]
    if year is not None:
        previous = _aggregate(
            apply_filters(frame, ano=int(year) - 1, cod=cod, sexo=sexo),
            metric,
            additive,
        )
        if value is not None and previous not in (None, 0):
            kpis.append(
                {
                    "id": "variacao",
                    "label": "Variação em relação ao ano anterior",
                    "value": value / previous - 1,
                    "unidade": "proporção",
                }
            )
    for extra in ("tft", "e0_t", "tmi_t"):
        if extra in frame.columns and extra != metric:
            kpis.append(
                {
                    "id": extra,
                    "label": _label(extra),
                    "value": _aggregate(scoped, extra, False),
                    "unidade": _unit(extra),
                }
            )
    series = _series(apply_filters(frame, cod=cod, sexo=sexo), metric, additive)
    rankings = _rankings(scoped if year is not None else current, metric, additive)
    return {"kpis": kpis, "series": series, "rankings": rankings}


def pyramid(frame: pd.DataFrame, cfg: DatasetConfig, ano: int | None, cod: int | None, compare_ano: int | None) -> list[dict]:
    """Um ano (com comparação opcional) ou, sem ano, todas as idades de todos os anos."""
    if cfg.id not in {"ds1", "ds2"}:
        raise AppError("not_applicable", "Pirâmide disponível apenas para ds1 e ds2", 422)
    faixa = "idade" if cfg.id == "ds1" else "grupo_etario"
    scoped = apply_filters(frame, cod=cod)
    if ano is None:
        parts = []
        if "ano" in scoped.columns:
            for year, chunk in scoped.groupby("ano", sort=True):
                part = _pyramid_frame(chunk, faixa)
                part["ano"] = int(year)
                parts.append(part)
        table = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame(columns=["faixa", "homens", "mulheres", "ano"])
    else:
        table = _pyramid_frame(apply_filters(scoped, ano=ano), faixa)
        if compare_ano is not None:
            other = _pyramid_frame(apply_filters(scoped, ano=compare_ano), faixa)
            other = other.rename(columns={"homens": "homens_compare", "mulheres": "mulheres_compare"})
            table = table.merge(other, on="faixa", how="outer")
    return json_records(_sort_pyramid(table, frame, cfg).drop(columns="_ord", errors="ignore"))


def compute_claims(frame: pd.DataFrame, cfg: DatasetConfig) -> list[dict]:
    results = []
    for spec in cfg.claims:
        function = CLAIMS.get(spec.id)
        if function is None:
            continue
        calculated = function(frame)
        results.append(
            {
                "id": spec.id,
                "label": spec.label,
                "value": calculated["value"],
                "detail": calculated.get("detail", {}),
                "news_terms": spec.news_terms,
            }
        )
    return results


def projection_2022(frame: pd.DataFrame, cod: int) -> float | None:
    if "pop_t" in frame.columns:
        rows = frame[(frame["cod"] == cod) & (frame["ano"] == 2022)]
        if not rows.empty:
            return float(rows["pop_t"].iloc[0])
    if "populacao" in frame.columns and "sexo" in frame.columns:
        rows = frame[(frame["cod"] == cod) & (frame["ano"] == 2022) & frame["sexo"].map(sexo_kind).eq("t")]
        if not rows.empty:
            return float(rows["populacao"].sum())
    return None


def sexo_kind(value: object) -> str:
    text = str(value).strip().lower()
    if text in {"h", "homem", "homens"} or text.startswith("hom"):
        return "h"
    if text in {"m", "mulher", "mulheres"} or text.startswith("mul"):
        return "m"
    if text.startswith("amb") or text in {"t", "total"}:
        return "t"
    return text


def json_records(frame: pd.DataFrame) -> list[dict]:
    if frame.empty:
        return []
    return json_loads(frame)


def json_loads(frame: pd.DataFrame) -> list[dict]:
    import json

    return json.loads(frame.to_json(orient="records"))


def _sort_pyramid(table: pd.DataFrame, frame: pd.DataFrame, cfg: DatasetConfig) -> pd.DataFrame:
    if table.empty:
        return table
    if cfg.id == "ds2" and "idade_inicio" in frame.columns:
        order = frame.groupby("grupo_etario")["idade_inicio"].min()
        table["_ord"] = table["faixa"].map(order)
    else:
        table["_ord"] = pd.to_numeric(table["faixa"], errors="coerce")
    columns = ["ano", "_ord"] if "ano" in table.columns else ["_ord"]
    return table.sort_values(columns, kind="mergesort")


def _pyramid_frame(frame: pd.DataFrame, faixa: str) -> pd.DataFrame:
    if frame.empty:
        return pd.DataFrame(columns=["faixa", "homens", "mulheres"])
    homens = frame[frame["sexo"].map(sexo_kind).eq("h")].groupby(faixa)["populacao"].sum()
    mulheres = frame[frame["sexo"].map(sexo_kind).eq("m")].groupby(faixa)["populacao"].sum()
    table = pd.concat([homens.rename("homens"), mulheres.rename("mulheres")], axis=1).reset_index()
    return table.rename(columns={faixa: "faixa"}).fillna(0)


def _main_metric(cfg: DatasetConfig, frame: pd.DataFrame) -> str:
    if cfg.metrics != "auto":
        for name in cfg.metrics:
            if name in frame.columns:
                return name
    for name in ("pop_t", "populacao", "ex", "e0_t"):
        if name in frame.columns:
            return name
    numeric = [col for col in frame.columns if pd.api.types.is_numeric_dtype(frame[col])]
    return numeric[0]


def _aggregate(frame: pd.DataFrame, metric: str, additive: bool) -> float | None:
    if frame.empty or metric not in frame.columns or frame[metric].dropna().empty:
        return None
    if additive:
        return float(frame[metric].sum())
    if "idade" in frame.columns and frame["idade"].eq(0).any():
        return float(frame.loc[frame["idade"].eq(0), metric].mean())
    return float(frame[metric].mean())


def _series(frame: pd.DataFrame, metric: str, additive: bool) -> list[dict]:
    if "ano" not in frame.columns or metric not in frame.columns or frame.empty:
        return []
    grouped = frame.groupby("ano")[metric]
    values = grouped.sum() if additive else grouped.mean()
    table = values.rename("valor").reset_index()
    return json_loads(table)


def _rankings(frame: pd.DataFrame, metric: str, additive: bool) -> list[dict]:
    if frame.empty or "nivel" not in frame.columns or metric not in frame.columns:
        return []
    ufs = frame[frame["nivel"] == "uf"]
    if ufs.empty:
        return []
    grouped = ufs.groupby(["cod", "sigla", "local"], dropna=False)[metric]
    values = (grouped.sum() if additive else grouped.mean()).sort_values(ascending=False).head(10)
    return json_loads(values.rename("valor").reset_index())


def _latest_year(frame: pd.DataFrame) -> int | None:
    if "ano" not in frame.columns or frame.empty:
        return None
    return int(frame["ano"].max())


def _reference_year(frame: pd.DataFrame) -> int:
    current = date.today().year
    years = {int(year) for year in frame["ano"].dropna().unique()}
    return current if current in years else max(years)


def _claim_pico(frame: pd.DataFrame) -> dict:
    ambos = frame[(frame["cod"] == 0) & frame["sexo"].map(sexo_kind).eq("t")]
    totals = ambos.groupby("ano")["populacao"].sum()
    year = int(totals.idxmax())
    return {"value": year, "detail": {"populacao": float(totals.loc[year])}}


def _claim_idosos(frame: pd.DataFrame) -> dict:
    brasil = frame[frame["cod"] == 0]
    crossed = brasil[brasil["n_60_mais_t"] > brasil["n_0_14_t"]]
    if crossed.empty:
        return {"value": None}
    return {"value": int(crossed["ano"].min())}


def _claim_tft(frame: pd.DataFrame) -> dict:
    year = _reference_year(frame)
    row = frame[(frame["cod"] == 0) & (frame["ano"] == year)].iloc[0]
    value = float(row["tft"])
    return {"value": value, "detail": {"ano": year, "reposicao": 2.1, "abaixo_reposicao": value < 2.1}}


def _claim_e0(frame: pd.DataFrame) -> dict:
    year = _reference_year(frame)
    row = frame[(frame["cod"] == 0) & (frame["ano"] == year)].iloc[0]
    return {"value": float(row["e0_t"]), "detail": {"ano": year}}


def _label(metric: str) -> str:
    labels = {
        "populacao": "População",
        "pop_t": "População total",
        "tft": "Taxa de fecundidade total",
        "e0_t": "Esperança de vida ao nascer",
        "tmi_t": "Mortalidade infantil",
        "ex": "Esperança de vida",
        "variacao": "Variação",
    }
    return labels.get(metric, metric)


def _unit(metric: str) -> str:
    if metric in {"populacao", "pop_t"}:
        return "pessoas"
    if metric == "tft":
        return "filhos por mulher"
    if metric in {"e0_t", "ex"}:
        return "anos"
    if metric == "tmi_t":
        return "por mil"
    return "número"


CLAIMS = {
    "pico_populacional": _claim_pico,
    "idosos_superam_jovens": _claim_idosos,
    "fecundidade_abaixo_reposicao": _claim_tft,
    "esperanca_vida": _claim_e0,
}


def map_values(frame: pd.DataFrame, metric: str, ano: int) -> dict:
    """Um valor por UF no ano, somando idades e usando o sexo total quando existir."""
    _require_metric(frame, metric)
    scoped = apply_filters(frame, ano=ano, nivel="uf")
    scoped = _sexo_total(scoped)
    if scoped.empty:
        return {"ano": ano, "metric": metric, "items": []}
    grouped = scoped.groupby(["cod", "sigla", "local"], dropna=False)[metric]
    values = grouped.sum() if is_count(metric) else grouped.mean()
    items = values.rename("valor").reset_index().sort_values("cod", kind="mergesort")
    return {"ano": ano, "metric": metric, "items": json_loads(items)}


def heatmap(frame: pd.DataFrame, cod: int | None, sexo: str | None) -> dict:
    """Células idade × ano da ds1 para um território e um sexo."""
    code = 0 if cod is None else int(cod)
    label = sexo or "Ambos"
    scoped = apply_filters(frame, cod=code)
    if "sexo" in scoped.columns:
        scoped = scoped[scoped["sexo"].map(sexo_kind).eq(sexo_kind(label))]
    if scoped.empty or "idade" not in scoped.columns:
        return {"cod": code, "sexo": label, "cells": []}
    table = scoped.groupby(["idade", "ano"], as_index=False)["populacao"].sum()
    table = table.rename(columns={"populacao": "valor"}).sort_values(["idade", "ano"], kind="mergesort")
    return {"cod": code, "sexo": label, "cells": json_loads(table)}


def scatter(frame: pd.DataFrame, anos: list[int] | None) -> dict:
    """e0, TFT e população das UFs, um ponto por território e ano."""
    for metric in ("e0_t", "tft", "pop_t"):
        _require_metric(frame, metric)
    scoped = apply_filters(frame, anos=anos, nivel="uf")
    columns = ["ano", "cod", "sigla", "local", "e0_t", "tft", "pop_t"]
    table = scoped[columns].sort_values(["ano", "cod"], kind="mergesort")
    items = json_loads(table.rename(columns={"e0_t": "e0", "pop_t": "populacao"}))
    return {"items": items}


def slope(frame: pd.DataFrame, metric: str, ano_a: int, ano_b: int) -> dict:
    """Valor da métrica em dois anos, por UF."""
    _require_metric(frame, metric)
    left = _uf_metric(frame, metric, ano_a).rename(columns={"valor": "valor_a"})
    right = _uf_metric(frame, metric, ano_b).rename(columns={"valor": "valor_b"})
    merged = left.merge(right, on=["cod", "sigla", "local"], how="outer")
    merged["delta"] = merged["valor_b"] - merged["valor_a"]
    merged = merged.sort_values("cod", kind="mergesort")
    return {"metric": metric, "ano_a": ano_a, "ano_b": ano_b, "items": json_loads(merged)}


def milestones(frames: dict[str, pd.DataFrame], cod: int) -> dict:
    """Marcos de um território a partir das bases tratadas. Nada fica fixo no código."""
    code = int(cod)
    return {
        "cod": code,
        "pico": _peak(frames, code),
        "cruzamento_idosos_jovens": _crossing(frames.get("ds3"), code),
        "tft_abaixo_reposicao": _first_year(frames.get("ds4"), code, "tft", lambda series: series < 2.1, 2.1),
        "nascimentos_abaixo_obitos": _births_below_deaths(frames.get("ds4"), code),
        "bonus": _bonus(frames.get("ds4"), code),
    }


def _require_metric(frame: pd.DataFrame, metric: str) -> None:
    if metric not in frame.columns:
        raise AppError("invalid_metric", f"Métrica inexistente: {metric}", 422, {"metric": metric})


def _sexo_total(frame: pd.DataFrame) -> pd.DataFrame:
    if "sexo" not in frame.columns:
        return frame
    kinds = frame["sexo"].map(sexo_kind)
    if kinds.eq("t").any():
        return frame[kinds.eq("t")]
    return frame


def _uf_metric(frame: pd.DataFrame, metric: str, ano: int) -> pd.DataFrame:
    scoped = _sexo_total(apply_filters(frame, ano=ano, nivel="uf"))
    if scoped.empty:
        return pd.DataFrame(columns=["cod", "sigla", "local", "valor"])
    grouped = scoped.groupby(["cod", "sigla", "local"], dropna=False)[metric]
    values = grouped.sum() if is_count(metric) else grouped.mean()
    return values.rename("valor").reset_index()


def _filter_faixa(frame: pd.DataFrame, bands: list[str]) -> pd.DataFrame:
    if "idade" in frame.columns and "grupo_etario" not in frame.columns:
        mask = pd.Series(False, index=frame.index)
        ages = pd.to_numeric(frame["idade"], errors="coerce")
        for band in bands:
            low, high = _faixa_bounds(band)
            mask = mask | ages.between(low, high)
        return frame[mask]
    if "grupo_etario" in frame.columns:
        keep = frame["grupo_etario"].map(lambda label: _grupo_na_faixa(label, bands))
        return frame[keep]
    raise AppError("not_applicable", "Este dataset não tem faixa etária", 422)


def _faixa_bounds(band: str) -> tuple[int, int]:
    if band.endswith("+"):
        return int(band[:-1]), 200
    if "-" in band:
        low, high = band.split("-", 1)
        return int(low), int(high)
    age = int(band)
    return age, age


def _grupo_na_faixa(label: object, bands: list[str]) -> bool:
    text = str(label)
    numbers = [int(item) for item in re.findall(r"\d+", text)]
    if not numbers:
        return False
    start = numbers[0]
    end = 200 if "+" in text or "mais" in text.lower() else (numbers[1] if len(numbers) > 1 else start)
    return any(start <= _faixa_bounds(band)[1] and end >= _faixa_bounds(band)[0] for band in bands)


def _peak(frames: dict[str, pd.DataFrame], cod: int) -> dict:
    ds1 = frames.get("ds1")
    if ds1 is not None and "populacao" in ds1.columns:
        scoped = _sexo_total(ds1[ds1["cod"] == cod])
        if not scoped.empty:
            totals = scoped.groupby("ano")["populacao"].sum()
            year = int(totals.idxmax())
            return {"ano": year, "populacao": float(totals.loc[year]), "fonte": "ds1"}
    for source in ("ds4", "ds3"):
        frame = frames.get(source)
        if frame is None or "pop_t" not in frame.columns:
            continue
        scoped = frame[frame["cod"] == cod]
        if scoped.empty:
            continue
        totals = scoped.groupby("ano")["pop_t"].sum()
        year = int(totals.idxmax())
        return {"ano": year, "populacao": float(totals.loc[year]), "fonte": source}
    return {"ano": None, "populacao": None, "fonte": None}


def _crossing(frame: pd.DataFrame | None, cod: int) -> dict:
    if frame is None or "n_60_mais_t" not in frame.columns or "n_0_14_t" not in frame.columns:
        return {"ano": None}
    scoped = frame[frame["cod"] == cod]
    crossed = scoped[scoped["n_60_mais_t"] > scoped["n_0_14_t"]]
    if crossed.empty:
        return {"ano": None}
    return {"ano": int(crossed["ano"].min())}


def _first_year(frame: pd.DataFrame | None, cod: int, metric: str, predicate, limiar: float) -> dict:
    if frame is None or metric not in frame.columns:
        return {"ano": None, "limiar": limiar}
    scoped = frame[frame["cod"] == cod].dropna(subset=[metric])
    matched = scoped[predicate(scoped[metric])]
    if matched.empty:
        return {"ano": None, "limiar": limiar}
    return {"ano": int(matched["ano"].min()), "limiar": limiar}


def _births_below_deaths(frame: pd.DataFrame | None, cod: int) -> dict:
    if frame is None or "nasc_t" not in frame.columns or "obt_t" not in frame.columns:
        return {"ano": None}
    scoped = frame[frame["cod"] == cod].dropna(subset=["nasc_t", "obt_t"])
    matched = scoped[scoped["nasc_t"] < scoped["obt_t"]]
    if matched.empty:
        return {"ano": None}
    return {"ano": int(matched["ano"].min())}


def _bonus(frame: pd.DataFrame | None, cod: int) -> dict:
    empty = {"limiar": BONUS_RDT_PER_100, "ano_inicio": None, "ano_fim": None, "ponto_virada": None, "rdt65_min": None}
    if frame is None or "rdt65" not in frame.columns:
        return empty
    scoped = frame[frame["cod"] == cod].dropna(subset=["rdt65"])
    if scoped.empty:
        return empty
    series = scoped.groupby("ano")["rdt65"].mean().sort_index()
    threshold = BONUS_RDT_RATIO if float(series.max()) <= 5 else BONUS_RDT_PER_100
    turning = int(series.idxmin())
    years = [int(year) for year in series.index]
    flags = [float(value) < threshold for value in series.to_numpy()]
    runs: list[tuple[int, int]] = []
    index = 0
    while index < len(years):
        if not flags[index]:
            index += 1
            continue
        end = index
        while end + 1 < len(years) and flags[end + 1] and years[end + 1] == years[end] + 1:
            end += 1
        runs.append((years[index], years[end]))
        index = end + 1
    window = next((run for run in runs if run[0] <= turning <= run[1]), runs[0] if runs else None)
    return {
        "limiar": threshold,
        "ano_inicio": None if window is None else window[0],
        "ano_fim": None if window is None else window[1],
        "ponto_virada": turning,
        "rdt65_min": float(series.loc[turning]),
    }
