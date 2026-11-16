"""Recria as fatos com PK, tipos exatos e CHECK. A carga seguinte repõe os dados."""

from alembic import op
from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    inspect,
    text,
)

from app.repositories.schema import DATASETS, FACTS

revision = "003_restricoes_ouro"
down_revision = "002_fk_cod"
branch_labels = None
depends_on = None

FACT_NAMES = tuple(FACTS)


def upgrade() -> None:
    """Apaga e recria as fatos pelo metadata novo e liga as FKs que faltavam."""
    bind = op.get_bind()
    names = set(inspect(bind).get_table_names())
    if "dim_dataset" not in names:
        from app.repositories.schema import dim_dataset

        dim_dataset.create(bind)
    _seed_datasets(bind)
    for name in FACT_NAMES:
        op.execute(text(f"DROP TABLE IF EXISTS `{name}`"))
    for name in FACT_NAMES:
        FACTS[name].create(bind)
    op.execute(text("UPDATE dim_territorio SET regiao_cod = NULL WHERE cod IN (0, 1, 2, 3, 4, 5)"))
    if not _has_fk(bind, "dim_territorio", "fk_dim_territorio_regiao"):
        op.create_foreign_key("fk_dim_territorio_regiao", "dim_territorio", "dim_territorio", ["regiao_cod"], ["cod"])
    if not _has_fk(bind, "etl_runs", "fk_etl_runs_dataset"):
        op.create_foreign_key("fk_etl_runs_dataset", "etl_runs", "dim_dataset", ["dataset_id"], ["id"])


def downgrade() -> None:
    """Volta às fatos da revisão 002: UNIQUE, FLOAT e sem CHECK."""
    bind = op.get_bind()
    if _has_fk(bind, "etl_runs", "fk_etl_runs_dataset"):
        op.drop_constraint("fk_etl_runs_dataset", "etl_runs", type_="foreignkey")
    if _has_fk(bind, "dim_territorio", "fk_dim_territorio_regiao"):
        op.drop_constraint("fk_dim_territorio_regiao", "dim_territorio", type_="foreignkey")
    if "dim_dataset" in set(inspect(bind).get_table_names()):
        op.drop_table("dim_dataset")
    for name in FACT_NAMES:
        op.execute(text(f"DROP TABLE IF EXISTS `{name}`"))
    for table in _legacy_metadata().sorted_tables:
        table.create(bind)


def _seed_datasets(bind) -> None:
    if bind.dialect.name == "mysql":
        bind.execute(
            text("INSERT INTO dim_dataset (id, nome) VALUES (:id, :nome) AS novo ON DUPLICATE KEY UPDATE nome = novo.nome"),
            [{"id": dataset_id, "nome": nome} for dataset_id, nome in DATASETS],
        )
        return
    for dataset_id, nome in DATASETS:
        bind.execute(
            text("INSERT INTO dim_dataset (id, nome) VALUES (:id, :nome) ON CONFLICT(id) DO NOTHING"),
            {"id": dataset_id, "nome": nome},
        )


def _has_fk(bind, table: str, name: str) -> bool:
    if table not in set(inspect(bind).get_table_names()):
        return False
    return any(fk.get("name") == name for fk in inspect(bind).get_foreign_keys(table))


def _legacy_metadata() -> MetaData:
    metadata = MetaData()
    text_cols = {"sigla": 8, "local": 80, "sexo": 24, "nivel": 16, "grupo_etario": 16}
    integers = {"cod", "ano", "idade", "idade_inicio"}
    flags = {"is_outlier", "intervalo_aberto"}

    def _column(name: str) -> Column:
        if name in integers:
            return Column(name, Integer)
        if name in text_cols:
            return Column(name, String(text_cols[name]))
        if name in flags:
            return Column(name, Boolean)
        if name == "outlier_motivo":
            return Column(name, Text)
        return Column(name, Float)

    def _fact(name: str, columns: list[str], unique: list[str]) -> None:
        built = []
        for col in columns:
            if col == "cod":
                built.append(Column("cod", Integer, ForeignKey("dim_territorio.cod", name=f"fk_{name}_cod")))
            else:
                built.append(_column(col))
        table = Table(name, metadata, *built)
        table.append_constraint(UniqueConstraint(*unique, name=f"uq_{name}"))
        table.append_constraint(Index(f"ix_{name}_cod_ano", "cod", "ano"))

    tail = ["is_outlier", "outlier_motivo"]
    _fact(
        "ds1_populacao_idade",
        ["idade", "sexo", "cod", "sigla", "local", "nivel", "ano", "populacao", *tail],
        ["idade", "sexo", "cod", "ano"],
    )
    _fact(
        "ds2_populacao_quinquenal",
        ["grupo_etario", "idade_inicio", "sexo", "cod", "sigla", "local", "nivel", "ano", "populacao", *tail],
        ["grupo_etario", "sexo", "cod", "ano"],
    )
    from app.domain.territory import safe_name
    from app.repositories.schema import DS3_HEADERS, DS4_HEADERS

    _fact("ds3_grupos_etarios", [safe_name(name) for name in DS3_HEADERS] + ["nivel", *tail], ["cod", "ano"])
    _fact("ds4_indicadores", [safe_name(name) for name in DS4_HEADERS] + ["nivel", *tail], ["cod", "ano"])
    _fact(
        "ds5_tabuas_mortalidade",
        [
            "idade", "intervalo", "intervalo_aberto", "sexo", "ano", "cod", "sigla", "local", "nivel",
            "nmx", "nax", "nqx", "lx", "ndx", "nlx", "sx", "tx", "ex", *tail,
        ],
        ["idade", "sexo", "cod", "ano"],
    )
    return metadata
