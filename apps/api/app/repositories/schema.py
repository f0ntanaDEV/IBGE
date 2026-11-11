"""Tabelas de dimensão, fatos e etl_runs."""

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
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


def _col(name: str) -> Column:
    if name in INTEGER:
        return Column(name, Integer)
    if name in TEXT:
        return Column(name, String(TEXT[name]))
    if name in FLAGS:
        return Column(name, Boolean)
    if name == "outlier_motivo":
        return Column(name, Text)
    return Column(name, Float)


def _fact(name: str, columns: list[str], unique: list[str]) -> Table:
    table = Table(name, Base.metadata, *[_col(col) for col in columns])
    table.append_constraint(UniqueConstraint(*unique, name=f"uq_{name}"))
    table.append_constraint(Index(f"ix_{name}_cod_ano", "cod", "ano"))
    return table


dim_territorio = Table(
    "dim_territorio",
    Base.metadata,
    Column("cod", Integer, primary_key=True, autoincrement=False),
    Column("sigla", String(8), nullable=False),
    Column("local", String(80), nullable=False),
    Column("nivel", String(16), nullable=False),
    Column("regiao_cod", Integer),
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
    Column("dataset_id", String(8), nullable=False),
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
