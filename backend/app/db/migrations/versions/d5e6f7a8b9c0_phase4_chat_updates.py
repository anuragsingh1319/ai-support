"""add_phase4_chat_schema_updates

Revision ID: d5e6f7a8b9c0
Revises: c1d2e3f4g5h6
Create Date: 2026-08-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'd5e6f7a8b9c0'
down_revision = 'c1d2e3f4g5h6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('conversations', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('messages', sa.Column('metadata', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'metadata')
    op.drop_column('conversations', 'resolved_at')
