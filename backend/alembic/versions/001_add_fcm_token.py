"""add fcm_token to users

Revision ID: 001_add_fcm_token
Revises: 
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa

revision = '001_add_fcm_token'
down_revision = '83362d8303fc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('fcm_token', sa.String(512), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'fcm_token')
