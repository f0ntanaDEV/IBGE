"""Acrescenta os CHECKs de domínio das taxas. Recusa a revisão se a ouro já violar o limite."""

from alembic import op
from sqlalchemy import inspect, text

from app.repositories.schema import RANGE_CHECKS

revision = "004_checks_taxas"
down_revision = "003_restricoes_ouro"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Confere cada expressão e só então cria o CHECK que ainda não existe."""
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())
    for table, checks in RANGE_CHECKS.items():
        if table not in existing:
            continue
        present = {item["name"] for item in inspect(bind).get_check_constraints(table)}
        for name, expression in checks:
            if name in present:
                continue
            count = bind.execute(text(f"SELECT COUNT(*) FROM `{table}` WHERE NOT ({expression})")).scalar()
            if int(count or 0) > 0:
                raise RuntimeError(f"{name}: {int(count)} linhas fora do limite")
            op.create_check_constraint(name, table, expression)


def downgrade() -> None:
    """Remove os CHECKs de taxa acrescentados nesta revisão."""
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())
    for table, checks in RANGE_CHECKS.items():
        if table not in existing:
            continue
        present = {item["name"] for item in inspect(bind).get_check_constraints(table)}
        for name, _expression in checks:
            if name in present:
                op.drop_constraint(name, table, type_="check")
