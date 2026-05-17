"""multi device support

Revision ID: 003_multi_device
Revises: 002_add_kyc_model
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '003_multi_device'
down_revision = '002_add_kyc_model'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create devices table
    op.create_table(
        'devices',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column('public_key', sa.String(length=2048), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id')
    )
    
    # 2. Drop columns from users table
    op.drop_column('users', 'device_public_key')
    op.drop_column('users', 'device_id')


def downgrade() -> None:
    op.add_column('users', sa.Column('device_id', sa.VARCHAR(length=255), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('device_public_key', sa.VARCHAR(length=2048), autoincrement=False, nullable=True))
    op.create_unique_constraint('users_device_id_key', 'users', ['device_id'])
    
    op.drop_table('devices')
