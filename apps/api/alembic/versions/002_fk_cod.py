"""Adiciona a FK de cod para dim_territorio nas cinco tabelas fato."""

from alembic import op
from sqlalchemy import text

revision = "002_fk_cod"
down_revision = "001_initial"
branch_labels = None
depends_on = None

FACTS = (
    "ds1_populacao_idade",
    "ds2_populacao_quinquenal",
    "ds3_grupos_etarios",
    "ds4_indicadores",
    "ds5_tabuas_mortalidade",
)


def _has_fk(table: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return False
    count = bind.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
            "WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = :table "
            "AND CONSTRAINT_NAME = :name AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
        ),
        {"table": table, "name": f"fk_{table}_cod"},
    ).scalar()
    return bool(count)


def upgrade() -> None:
    """Liga cod de cada fato a dim_territorio, se a FK ainda não existe."""
    for table in FACTS:
        if _has_fk(table):
            continue
        op.create_foreign_key(f"fk_{table}_cod", table, "dim_territorio", ["cod"], ["cod"])


def downgrade() -> None:
    """Remove a FK de cod das fatos."""
    for table in FACTS:
        if not _has_fk(table):
            continue
        op.drop_constraint(f"fk_{table}_cod", table, type_="foreignkey")
