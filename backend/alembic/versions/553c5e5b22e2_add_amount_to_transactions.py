"""add amount to transactions

Revision ID: 553c5e5b22e2
Revises: 004_add_disputes
Create Date: 2026-06-10 23:14:16.843487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '553c5e5b22e2'
down_revision: Union[str, None] = '004_add_disputes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('transactions', sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('transactions', 'amount')
