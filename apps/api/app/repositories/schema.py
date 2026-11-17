"""Camada ouro: tabelas MySQL de dimensão, fatos e etl_runs."""

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    String,
    Table,
    Text,
    func,
)

from app.db import Base
from app.domain.territory import safe_name

DS3_HEADERS = [
    "ANO", "CÓD.", "SIGLA", "LOCAL", "POP_T", "POP_H", "POP_M",
    "0-1_T", "0-1_H", "0-1_M", "0-4_T", "0-4_H", "0-4_M",
    "0-14_T", "0-14_H", "0-14_M", "15-17_T", "15-17_H", "15-17_M",
    "18-21_T", "18-21_H", "18-21_M", "15-59_T", "15-59_H", "15-59_M",
    "15-64_T", "15-64_H", "15-64_M", "60+_T", "60+_H", "60+_M",
    "65+_T", "65+_H", "65+_M", "80+_T", "80+_H", "80+_M",
    "P_H", "P_M", "P_0-1_T", "P_0-1_H", "P_0-1_M", "P_0-4_T", "P_0-4_H", "P_0-4_M",
    "P_0-14_T", "P_0-14_H", "P_0-14_M", "P_15-17_T", "P_15-17_H", "P_15-17_M",
    "P_18-21_T", "P_18-21_H", "P_18-21_M", "P_15-59_T", "P_15-59_H", "P_15-59_M",
    "P_15-64_T", "P_15-64_H", "P_15-64_M", "P_60+_T", "P_60+_H", "P_60+_M",
    "P_65+_T", "P_65+_H", "P_65+_M", "P_80+_T", "P_80+_H", "P_80+_M",
]
DS4_HEADERS = [
    "ANO", "CÓD.", "SIGLA", "LOCAL", "POP_T", "POP_H", "POP_M", "TCG_T", "TCG_H", "TCG_M",
    "RS", "NASC_T", "NASC_H", "NASC_M", "OBT_T", "OBT_H", "OBT_M", "TBN", "TBM", "TCV",
    "e0_T", "e0_H", "e0_M", "e60_T", "e60_H", "e60_M", "TMI_T", "TMI_H", "TMI_M",
    "5q0_T", "5q0_H", "5q0_M", "45q15_T", "45q15_H", "45q15_M", "20q60_T", "20q60_H", "20q60_M",
    "TFT", "TEF_10-14", "TEF_15-19", "TEF_20-24", "TEF_25-29", "TEF_30-34", "TEF_35-39",
    "TEF_40-44", "TEF_45-49", "TEF_50+", "RDJ60", "RDI60", "RDT60", "RDJ65", "RDI65", "RDT65",
    "IE60", "IE65", "IE80", "ID_M", "ID_MED",
]

TEXT = {"sigla": 8, "local": 80, "sexo": 24, "nivel": 16, "grupo_etario": 16}
INTEGER = {"cod", "ano", "idade", "idade_inicio"}
FLAGS = {"is_outlier", "intervalo_aberto"}
# DATA_PROFILE: ds1 tem 91 idades (0 a 90) e ds5 tem 20 idades, a última em 90.
IDADE_MAX = 90
DATASETS = (
    ("ds1", "População por sexo e idade simples"),
    ("ds2", "População por grupo quinquenal"),
    ("ds3", "Grupos etários específicos"),
    ("ds4", "Indicadores"),
    ("ds5", "Tábuas de mortalidade"),
)


def _is_bigint_count(name: str) -> bool:
    """Contagem de pessoas inteira na base original: população e faixas etárias."""
    if name == "populacao" or name.startswith("pop_"):
        return True
    return name.startswith(("n_0_", "n_15_", "n_18_", "n_60_", "n_65_", "n_80_"))


def _is_decimal_count(name: str) -> bool:
    """Nascimentos e óbitos podem vir arredondados, então ficam em DECIMAL(14,2)."""
    return name.startswith(("nasc_", "obt_"))


def _is_count(name: str) -> bool:
    """Entra: name. Sai com o resultado de is count."""
    return _is_bigint_count(name) or _is_decimal_count(name)


def _col(name: str, *, nullable: bool) -> Column:
    """Tipo da coluna: chave inteira, texto, flag, contagem ou taxa. Nenhuma coluna usa FLOAT."""
    if name in INTEGER:
        return Column(name, Integer, nullable=nullable)
    if name in TEXT:
        return Column(name, String(TEXT[name]), nullable=nullable)
    if name in FLAGS:
        return Column(name, Boolean, nullable=nullable)
    if name == "outlier_motivo":
        return Column(name, Text, nullable=nullable)
    if _is_bigint_count(name):
        return Column(name, BigInteger, nullable=nullable)
    if _is_decimal_count(name):
        return Column(name, Numeric(14, 2), nullable=nullable)
    return Column(name, Numeric(18, 6), nullable=nullable)


def _fact(name: str, columns: list[str], pk: list[str]) -> Table:
    """Fato com PK composta, FK de cod, CHECKs nomeados e sigla/local/nivel desnormalizados."""
    # sigla, local e nivel repetem dim_territorio para a API e o Databricks lerem o fato sem join.
    pk_set = set(pk)
    built = []
    for col in columns:
        if col == "cod":
            built.append(
                Column(
                    "cod",
                    Integer,
                    ForeignKey("dim_territorio.cod", name=f"fk_{name}_cod"),
                    nullable=False,
                )
            )
        else:
            built.append(_col(col, nullable=col not in pk_set))
    table = Table(name, Base.metadata, *built)
    table.append_constraint(PrimaryKeyConstraint(*pk, name=f"pk_{name}"))
    table.append_constraint(Index(f"ix_{name}_cod_ano", "cod", "ano"))
    if "sexo" in columns:
        table.append_constraint(
            CheckConstraint(
                "sexo IN ('Ambos', 'Homens', 'Mulheres')",
                name=f"ck_{name}_sexo",
            )
        )
    if "ano" in columns:
        table.append_constraint(CheckConstraint("ano BETWEEN 2000 AND 2070", name=f"ck_{name}_ano"))
    if "idade" in columns and name in {"ds1_populacao_idade", "ds5_tabuas_mortalidade"}:
        table.append_constraint(
            CheckConstraint(f"idade BETWEEN 0 AND {IDADE_MAX}", name=f"ck_{name}_idade")
        )
    if "nqx" in columns:
        table.append_constraint(CheckConstraint("nqx BETWEEN 0 AND 1", name=f"ck_{name}_nqx"))
    counts = [col for col in columns if _is_count(col)]
    if counts:
        rule = " AND ".join(f"{col} >= 0" for col in counts)
        table.append_constraint(CheckConstraint(rule, name=f"ck_{name}_contagens"))
    for check_name, expression in _range_checks(name, columns):
        table.append_constraint(CheckConstraint(expression, name=check_name))
    RANGE_CHECKS[name] = _range_checks(name, columns)
    return table


def _pick(columns: list[str], predicate) -> list[str]:
    """Colunas da tabela que casam com o padrão do CHECK."""
    return [column for column in columns if predicate(column)]


def _between(columns: list[str], low: int, high: int) -> str:
    """Expressão BETWEEN para cada coluna, ligada por AND."""
    return " AND ".join(f"{column} BETWEEN {low} AND {high}" for column in columns)


def _gte(columns: list[str], low: int) -> str:
    """Expressão de mínimo para cada coluna, ligada por AND."""
    return " AND ".join(f"{column} >= {low}" for column in columns)


def _range_checks(table: str, columns: list[str]) -> list[tuple[str, str]]:
    """CHECKs de domínio das taxas. Os prefixos saem das colunas, sem lista manual."""
    prefix = f"ck_{table}"
    found: list[tuple[str, str]] = []

    def add(suffix: str, chosen: list[str], expression: str) -> None:
        """Entra: suffix, chosen, expression. Sai com o resultado de add."""
        if chosen:
            found.append((f"{prefix}_{suffix}", expression))

    if table == "ds3_grupos_etarios":
        proportions = _pick(columns, lambda name: name.startswith("p_") and not name.startswith("pop_"))
        add("proporcoes", proportions, _between(proportions, 0, 1))
    if table == "ds4_indicadores":
        hope = _pick(columns, lambda name: name.startswith("e0_") or name.startswith("e60_"))
        add("esperanca", hope, _between(hope, 0, 120))
        if "tft" in columns:
            add("tft", ["tft"], "tft BETWEEN 0 AND 10")
        fertility = _pick(columns, lambda name: name.startswith("tef_"))
        add("tef", fertility, _between(fertility, 0, 1))
        per_thousand = _pick(
            columns,
            lambda name: name.startswith(("tmi_", "n_5q0_", "n_45q15_", "n_20q60_")),
        )
        add("por_mil", per_thousand, _between(per_thousand, 0, 1000))
        if "rs" in columns:
            add("rs", ["rs"], "rs BETWEEN 50 AND 150")
        ratios = _pick(
            columns,
            lambda name: name in {"ie60", "ie65", "ie80"} or name.startswith(("rdj", "rdi", "rdt")),
        )
        add("razoes", ratios, _gte(ratios, 0))
        ages = [name for name in ("id_m", "id_med") if name in columns]
        add("idade", ages, _between(ages, 0, 120))
    if table == "ds5_tabuas_mortalidade":
        if "nmx" in columns:
            add("nmx", ["nmx"], "nmx >= 0")
        if "nax" in columns:
            add("nax", ["nax"], "nax >= 0")
        if "sx" in columns:
            add("sx", ["sx"], "sx BETWEEN 0 AND 1")
        if "lx" in columns:
            add("lx", ["lx"], "lx BETWEEN 0 AND 100000")
        flows = [name for name in ("ndx", "nlx", "tx") if name in columns]
        add("fluxos", flows, _gte(flows, 0))
        if "ex" in columns:
            add("ex", ["ex"], "ex BETWEEN 0 AND 120")
    return found


RANGE_CHECKS: dict[str, list[tuple[str, str]]] = {}


dim_dataset = Table(
    "dim_dataset",
    Base.metadata,
    Column("id", String(8), primary_key=True),
    Column("nome", String(120), nullable=False),
)

dim_territorio = Table(
    "dim_territorio",
    Base.metadata,
    Column("cod", Integer, primary_key=True, autoincrement=False),
    Column("sigla", String(8), nullable=False),
    Column("local", String(80), nullable=False),
    Column("nivel", String(16), nullable=False),
    Column("regiao_cod", Integer, ForeignKey("dim_territorio.cod", name="fk_dim_territorio_regiao")),
)

dim_metrica = Table(
    "dim_metrica",
    Base.metadata,
    Column("dataset_id", String(8), primary_key=True),
    Column("coluna", String(64), primary_key=True),
    Column("rotulo", String(120), nullable=False),
    Column("descricao", String(255), nullable=False),
    Column("unidade", String(40), nullable=False),
)

etl_runs = Table(
    "etl_runs",
    Base.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("dataset_id", String(8), ForeignKey("dim_dataset.id", name="fk_etl_runs_dataset"), nullable=False),
    Column("source", String(16), nullable=False),
    Column("status", String(16), nullable=False),
    Column("started_at", DateTime, nullable=False, server_default=func.now()),
    Column("finished_at", DateTime),
    Column("rows_in", Integer),
    Column("rows_out", Integer),
    Column("report_json", JSON),
    Column("error", Text),
)

_COMMON_TAIL = ["is_outlier", "outlier_motivo"]
ds1_populacao_idade = _fact(
    "ds1_populacao_idade",
    ["idade", "sexo", "cod", "sigla", "local", "nivel", "ano", "populacao", *_COMMON_TAIL],
    ["idade", "sexo", "cod", "ano"],
)
ds2_populacao_quinquenal = _fact(
    "ds2_populacao_quinquenal",
    ["grupo_etario", "idade_inicio", "sexo", "cod", "sigla", "local", "nivel", "ano", "populacao", *_COMMON_TAIL],
    ["grupo_etario", "sexo", "cod", "ano"],
)
ds3_grupos_etarios = _fact(
    "ds3_grupos_etarios",
    [safe_name(name) for name in DS3_HEADERS] + ["nivel", *_COMMON_TAIL],
    ["cod", "ano"],
)
ds4_indicadores = _fact(
    "ds4_indicadores",
    [safe_name(name) for name in DS4_HEADERS] + ["nivel", *_COMMON_TAIL],
    ["cod", "ano"],
)
ds5_tabuas_mortalidade = _fact(
    "ds5_tabuas_mortalidade",
    [
        "idade", "intervalo", "intervalo_aberto", "sexo", "ano", "cod", "sigla", "local", "nivel",
        "nmx", "nax", "nqx", "lx", "ndx", "nlx", "sx", "tx", "ex", *_COMMON_TAIL,
    ],
    ["idade", "sexo", "cod", "ano"],
)

FACTS = {
    "ds1_populacao_idade": ds1_populacao_idade,
    "ds2_populacao_quinquenal": ds2_populacao_quinquenal,
    "ds3_grupos_etarios": ds3_grupos_etarios,
    "ds4_indicadores": ds4_indicadores,
    "ds5_tabuas_mortalidade": ds5_tabuas_mortalidade,
}
