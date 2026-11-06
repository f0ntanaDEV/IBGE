"""Cria dimensões, fatos e etl_runs e semeia os 33 territórios."""

from alembic import op
from sqlalchemy import text

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
    existing = bind.execute(text("SELECT COUNT(*) FROM dim_territorio")).scalar() or 0
    if existing == 0:
        op.bulk_insert(schema.dim_territorio, territorios_padrao())


def downgrade() -> None:
    Base.metadata.drop_all(op.get_bind())
