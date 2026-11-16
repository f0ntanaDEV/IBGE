"""Estatística descritiva da silver. Grava docs/eda sem reescrever o relatório."""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from app.core.config import REPO_ROOT, get_settings
from app.domain.dataset import load_catalog
from app.services.store import ParquetStore

INK = "#3f3f46"
MUTED = "#71717a"
GRID = "#e4e4e7"
BLUE = "#4d6d8a"
TEAL = "#426e68"
SAND = "#7a6846"
ROSE = "#8d5e68"
PALETTE = [BLUE, TEAL, SAND, ROSE, "#5c6570"]


def fmt(value: object, casas: int = 2) -> str:
    """Número em pt-BR. Contagens saem sem casa; taxas, com no máximo duas."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "—"
    number = float(value)
    if casas <= 0:
        text = f"{int(round(number)):,}"
    else:
        text = f"{number:,.{casas}f}"
    return text.replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> None:
    """Lê a silver, grava docs/eda/estatisticas.md e os PNG. Não escreve o relatório."""
    settings = get_settings()
    store = ParquetStore(settings.silver_dir)
    frames = {cfg.id: _load(store, cfg.id) for cfg in load_catalog().datasets}
    out = REPO_ROOT / "docs" / "eda"
    out.mkdir(parents=True, exist_ok=True)
    refs = referencias(frames["ds1"], frames["ds3"], frames["ds4"])
    _charts(frames, refs, out)
    (out / "estatisticas.md").write_text(_markdown(store, frames, refs), encoding="utf-8")
    print(json.dumps(refs, ensure_ascii=False), flush=True)


def referencias(ds1: pd.DataFrame, ds3: pd.DataFrame, ds4: pd.DataFrame) -> dict:
    """Pico, 2070, cruzamento 60+ e o ano em que os óbitos passam os nascimentos."""
    ambos = ds1[(ds1["cod"] == 0) & (ds1["sexo"] == "Ambos")].groupby("ano")["populacao"].sum()
    pico_ano = int(ambos.idxmax())
    brasil = ds3[ds3["cod"] == 0]
    cruzamento = brasil[brasil["n_60_mais_t"] > brasil["n_0_14_t"]]["ano"]
    fluxo = ds4[(ds4["cod"] == 0)].dropna(subset=["obt_t", "nasc_t"])
    obitos = fluxo[fluxo["obt_t"] > fluxo["nasc_t"]]["ano"]
    return {
        "pico_ano": pico_ano,
        "pico_pop": int(ambos.loc[pico_ano]),
        "pop_2070": int(ambos.loc[2070]),
        "idosos_superam": int(cruzamento.min()),
        "obitos_superam": int(obitos.min()),
    }


def _load(store: ParquetStore, dataset_id: str) -> pd.DataFrame:
    path = store.latest_file(dataset_id, ".parquet")
    if path is None or "amostra" in path.parts:
        from app.services.etl import process_dataset

        process_dataset(dataset_id, source="original", confirm=True, cleaning=None, store=store, settings=get_settings())
        path = store.latest_file(dataset_id, ".parquet")
    if path is None:
        raise FileNotFoundError(dataset_id)
    return pd.read_parquet(path)


def _charts(frames: dict[str, pd.DataFrame], refs: dict, out: Path) -> None:
    _pyramid(frames["ds1"], out / "piramide_2026_2070.png")
    _serie(frames["ds4"], refs, out / "populacao_2000_2070.png")
    _hist_e0(frames["ds4"], out / "histograma_e0_2026.png")
    _box_tft(frames["ds4"], out / "boxplot_tft_regiao.png")
    _scatter(frames["ds4"], out / "dispersao_e0_tft.png")


def _style(ax) -> None:
    ax.set_facecolor("white")
    ax.tick_params(colors=MUTED, labelsize=8)
    ax.grid(axis="y", color=GRID, linewidth=0.6)
    for spine in ax.spines.values():
        spine.set_color(GRID)
    ax.title.set_color(INK)


def _pyramid(ds1: pd.DataFrame, path: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(8.2, 4.6), sharey=True)
    fig.patch.set_facecolor("white")
    for ax, ano in zip(axes, (2026, 2070), strict=True):
        part = ds1[(ds1["cod"] == 0) & (ds1["ano"] == ano) & (ds1["sexo"].isin(["Homens", "Mulheres"]))]
        homens = part[part["sexo"] == "Homens"].sort_values("idade")
        mulheres = part[part["sexo"] == "Mulheres"].sort_values("idade")
        ax.barh(homens["idade"], -homens["populacao"], color=BLUE, height=1, label="Homens")
        ax.barh(mulheres["idade"], mulheres["populacao"], color=TEAL, height=1, label="Mulheres")
        ax.set_title(str(ano), color=INK, fontsize=10)
        _style(ax)
        ax.grid(False)
    axes[0].set_xlabel("homens ← população → mulheres", color=MUTED, fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _serie(ds4: pd.DataFrame, refs: dict, path: Path) -> None:
    serie = ds4[ds4["cod"] == 0].sort_values("ano")
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    fig.patch.set_facecolor("white")
    ax.plot(serie["ano"], serie["pop_t"], color=BLUE, linewidth=1.6)
    ax.scatter([refs["pico_ano"]], [refs["pico_pop"]], color=SAND, zorder=3)
    ax.annotate(f"pico {refs['pico_ano']}", (refs["pico_ano"], refs["pico_pop"]), textcoords="offset points", xytext=(6, 6), color=INK, fontsize=8)
    _style(ax)
    ax.set_title("População do Brasil", color=INK, fontsize=10)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _hist_e0(ds4: pd.DataFrame, path: Path) -> None:
    ufs = ds4[(ds4["ano"] == 2026) & (ds4["nivel"] == "uf")]
    fig, ax = plt.subplots(figsize=(6.4, 3.6))
    fig.patch.set_facecolor("white")
    ax.hist(ufs["e0_t"], bins=8, color=BLUE, edgecolor="white")
    _style(ax)
    ax.set_title("Esperança de vida ao nascer, UFs, 2026", color=INK, fontsize=10)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _box_tft(ds4: pd.DataFrame, path: Path) -> None:
    ufs = ds4[(ds4["ano"] == 2026) & (ds4["nivel"] == "uf")].copy()
    ufs["regiao"] = (ufs["cod"] // 10).map({1: "Norte", 2: "Nordeste", 3: "Sudeste", 4: "Sul", 5: "Centro-Oeste"})
    groups = [ufs.loc[ufs["regiao"] == nome, "tft"].dropna() for nome in ["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"]]
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    fig.patch.set_facecolor("white")
    box = ax.boxplot(groups, tick_labels=["N", "NE", "SE", "S", "CO"], patch_artist=True)
    for patch, color in zip(box["boxes"], PALETTE, strict=True):
        patch.set_facecolor(color)
        patch.set_alpha(0.85)
    _style(ax)
    ax.set_title("TFT por região, UFs, 2026", color=INK, fontsize=10)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _scatter(ds4: pd.DataFrame, path: Path) -> None:
    ufs = ds4[(ds4["ano"] == 2026) & (ds4["nivel"] == "uf")]
    fig, ax = plt.subplots(figsize=(6.4, 3.8))
    fig.patch.set_facecolor("white")
    ax.scatter(ufs["tft"], ufs["e0_t"], color=BLUE, s=28)
    _style(ax)
    ax.set_xlabel("TFT", color=MUTED, fontsize=8)
    ax.set_ylabel("e0", color=MUTED, fontsize=8)
    ax.set_title("e0 e TFT nas UFs, 2026", color=INK, fontsize=10)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def _markdown(store: ParquetStore, frames: dict[str, pd.DataFrame], refs: dict) -> str:
    lines = [
        "# Estatísticas da silver",
        "",
        "Gerado por `python -m app.tools.eda`. Números com no máximo 2 casas.",
        "",
        "A planilha larga da ds1 tem 9.009 linhas (33 territórios × 3 sexos × 91 idades). "
        "O formato longo repete cada linha nos 71 anos de 2000 a 2070: 9.009 × 71 = 639.639.",
        "",
        "## Forma, tipos, nulos, duplicatas e atípicos",
        "",
    ]
    for cfg in load_catalog().datasets:
        frame = frames[cfg.id]
        before = _before(store, cfg.id)
        keys = [col for col in cfg.key if col in frame.columns]
        dup = int(frame.duplicated(keys).sum()) if keys else 0
        outliers = int(frame["is_outlier"].fillna(False).sum()) if "is_outlier" in frame.columns else 0
        # outlier_motivo fica vazio na linha comum; não entra na contagem de nulos.
        counted = [col for col in frame.columns if col != "outlier_motivo"]
        nulls = int(frame[counted].isna().to_numpy().sum())
        lines.append(f"### {cfg.id}")
        lines.append("")
        lines.append("| | antes | depois |")
        lines.append("|---|---:|---:|")
        lines.append(f"| linhas | {fmt(before.get('rows'), 0)} | {fmt(len(frame), 0)} |")
        lines.append(f"| colunas | {fmt(before.get('cols'), 0)} | {fmt(frame.shape[1], 0)} |")
        lines.append(f"| nulos | {fmt(before.get('nulls'), 0)} | {fmt(nulls, 0)} |")
        lines.append(f"| duplicatas na chave | {fmt(before.get('dup'), 0)} | {fmt(dup, 0)} |")
        lines.append(f"| atípicos | {fmt(before.get('out'), 0)} | {fmt(outliers, 0)} |")
        lines.append("")
        lines.append("Tipos depois da limpeza: " + ", ".join(f"`{col}` {dtype}" for col, dtype in frame.dtypes.items()) + ".")
        lines.append("")
    lines.extend([
        "Os 99 nulos estruturais são `tcg_t`, `tcg_h` e `tcg_m` no ano 2000, "
        "nos 33 territórios. A taxa de crescimento não existe no primeiro ano da série e não é imputada.",
        "",
        "## Describe",
        "",
        "### População por idade, Brasil, 2026, sexo Ambos",
        "",
        _describe(frames["ds1"].loc[
            (frames["ds1"]["cod"] == 0) & (frames["ds1"]["ano"] == 2026) & (frames["ds1"]["sexo"] == "Ambos"),
            "populacao",
        ]),
        "",
        "### UFs em 2026",
        "",
    ])
    ufs = frames["ds4"][(frames["ds4"]["ano"] == 2026) & (frames["ds4"]["nivel"] == "uf")]
    for column, title in (("e0_t", "e0"), ("tft", "TFT"), ("ie60", "IE60"), ("id_med", "idade mediana")):
        lines.append(f"#### {title}")
        lines.append("")
        lines.append(_describe(ufs[column]))
        lines.append("")
    nqx = frames["ds5"][(frames["ds5"]["ano"] == 2026) & (frames["ds5"]["nivel"] == "uf") & (frames["ds5"]["sexo"] == "Ambos")]["nqx"]
    lines.append("#### nqx")
    lines.append("")
    lines.append(_describe(nqx))
    lines.append("")
    lines.extend([
        "## Regiões em 2026",
        "",
        "| região | população | e0 | TFT | IE60 |",
        "|---|---:|---:|---:|---:|",
    ])
    regioes = frames["ds4"][(frames["ds4"]["ano"] == 2026) & (frames["ds4"]["nivel"] == "regiao")].sort_values("cod")
    for _, row in regioes.iterrows():
        lines.append(
            f"| {row['local']} | {fmt(row['pop_t'], 0)} | {fmt(row['e0_t'])} | {fmt(row['tft'])} | {fmt(row['ie60'])} |"
        )
    ufs = frames["ds4"][(frames["ds4"]["ano"] == 2026) & (frames["ds4"]["nivel"] == "uf")]
    corr = float(ufs["e0_t"].corr(ufs["tft"]))
    lines.extend([
        "",
        "## Correlação",
        "",
        f"Pearson e0 × TFT nas 27 UFs em 2026: **{fmt(corr)}**. Gráfico: `dispersao_e0_tft.png`.",
        "",
        "## Referências",
        "",
        f"- Pico em **{refs['pico_ano']}** com **{fmt(refs['pico_pop'], 0)}** pessoas. Gráfico: `populacao_2000_2070.png`.",
        f"- 2070: **{fmt(refs['pop_2070'], 0)}**.",
        f"- 60+ supera 0–14 em **{refs['idosos_superam']}**.",
        f"- Óbitos superam nascimentos em **{refs['obitos_superam']}**.",
        "- Pirâmide: `piramide_2026_2070.png`. Histograma de e0: `histograma_e0_2026.png`. Boxplot de TFT: `boxplot_tft_regiao.png`.",
        "",
    ])
    return "\n".join(lines)


def _describe(series: pd.Series) -> str:
    stats = series.dropna().astype(float)
    casas = 0 if float(stats.max()) >= 1000 else 2
    values = [
        ("média", float(stats.mean())),
        ("mediana", float(stats.median())),
        ("desvio-padrão", float(stats.std())),
        ("mín.", float(stats.min())),
        ("Q1", float(stats.quantile(0.25))),
        ("Q3", float(stats.quantile(0.75))),
        ("máx.", float(stats.max())),
    ]
    rows = ["| | |", "|---|---:|"]
    rows.extend(f"| {label} | {fmt(value, casas)} |" for label, value in values)
    return "\n".join(rows)


def _before(store: ParquetStore, dataset_id: str) -> dict:
    path = store.latest_file(dataset_id, ".parquet")
    empty = {"rows": None, "cols": None, "nulls": None, "dup": None, "out": None}
    if path is None:
        return empty
    report_path = path.with_suffix(".report.json")
    if not report_path.exists():
        return empty
    payload = json.loads(report_path.read_text(encoding="utf-8"))
    nulls = payload.get("nulls_before") or {}
    removed = payload.get("duplicates_removed") or {}
    outliers = payload.get("outliers") or {}
    return {
        "rows": payload.get("rows_before"),
        "cols": None,
        "nulls": sum(int(v) for v in nulls.values()),
        "dup": sum(int(v) for v in removed.values()),
        "out": sum(sum(int(v) for v in item.values()) for item in outliers.values()),
    }


if __name__ == "__main__":
    main()
