"""Cria dimensões, fatos e etl_runs e semeia os 33 territórios."""

from alembic import op

from app.db import Base
from app.domain.territory import territorios_padrao
from app.repositories import schema  # noqa: F401

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind)
    op.bulk_insert(schema.dim_territorio, territorios_padrao())


def downgrade() -> None:
    Base.metadata.drop_all(op.get_bind())
