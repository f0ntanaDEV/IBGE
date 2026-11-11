"""Contexto da visão geral."""

from app.domain.territory import REGIOES
from app.services.context.common import censo_item, frame, item
from app.services.context.models import ContextItem
from app.services.facts.common import cell as read_cell, territory


POP = "População, 2000–2070"
POP_LABEL = "População 2000–2070"
MARCOS = "Marcos da projeção"


def _pop(cod: int, year: int, kind: str) -> float | None:
    column = {"t": "pop_t", "h": "pop_h", "m": "pop_m"}[kind]
    return read_cell(territory("ds4", cod), year, column)


def build(cod: int, ano: int, sexo: str) -> list[ContextItem]:
    kind = sexo
    current = _pop(cod, ano, kind)
    previous = _pop(cod, ano - 1, kind)
    data = territory("ds4", cod)
    column = {"t": "pop_t", "h": "pop_h", "m": "pop_m"}[kind]
    peak_year = None
    peak_value = None
    if not data.empty and column in data.columns:
        ordered = data.dropna(subset=[column])
        if not ordered.empty:
            row = ordered.loc[ordered[column].idxmax()]
            peak_year = int(row["ano"])
            peak_value = float(row[column])
    birth_col = {"t": "nasc_t", "h": "nasc_h", "m": "nasc_m"}[kind]
    death_col = {"t": "obt_t", "h": "obt_h", "m": "obt_m"}[kind]
    births = read_cell(data, ano, birth_col)
    deaths = read_cell(data, ano, death_col)
    prev_births = read_cell(data, ano - 1, birth_col)
    prev_deaths = read_cell(data, ano - 1, death_col)
    items: list[ContextItem] = []
    if current is not None:
        items.append(item("pop", "População", int(round(current)), "count", POP, POP_LABEL))
    if current is not None and previous:
        delta = current - previous
        items.append(
            item(
                "var_anual",
                "Variação em relação ao ano anterior",
                int(round(delta)),
                "count",
                POP,
                POP_LABEL,
                "{delta} ({pct})",
                [("delta", int(round(delta)), "count"), ("pct", delta / previous, "percent")],
            )
        )
    if peak_year is not None and peak_value and current is not None:
        items.append(
            item(
                "pico",
                "Pico populacional",
                peak_year,
                "year",
                POP,
                POP_LABEL,
                "{pct} do pico",
                [("pct", current / peak_value, "percent")],
            )
        )
    if births is not None and deaths is not None:
        items.append(
            item(
                "cresc_natural",
                "Nascimentos menos óbitos",
                int(round(births - deaths)),
                "count",
                MARCOS,
                "Marcos",
            )
        )
    if current is not None and previous is not None and prev_births is not None and prev_deaths is not None:
        migration = current - previous - (prev_births - prev_deaths)
        items.append(
            item(
                "migracao",
                "Saldo migratório implícito (estimado)",
                int(round(migration)),
                "count",
                POP,
                POP_LABEL,
                "Derivado: variação da população menos o crescimento natural. Não é publicado pelo IBGE.",
            )
        )
    brazil = _pop(0, ano, "t")
    if cod != 0 and current is not None and brazil:
        items.append(
            item(
                "participacao",
                "Participação na população do Brasil",
                current / brazil,
                "percent",
                POP,
                POP_LABEL,
            )
        )
    elif cod == 0 and brazil:
        regions = frame("ds4")
        regions = regions[(regions["ano"] == ano) & (regions["cod"].isin(REGIOES))]
        if not regions.empty:
            top = regions.loc[regions["pop_t"].idxmax()]
            items.append(
                item(
                    "participacao.alt",
                    "Região mais populosa",
                    f"{top['local']}",
                    "raw",
                    POP,
                    POP_LABEL,
                    "{pct} da população do Brasil",
                    [("pct", float(top["pop_t"]) / brazil, "percent")],
                )
            )
    census = censo_item(cod, POP, POP_LABEL)
    if census is not None:
        items.append(census)
    return items[:7]
