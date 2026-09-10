"""add idempotency records

Revision ID: 003_idempotency_records
Revises: 002_unique_master_codes
"""
from alembic import op
import sqlalchemy as sa

revision = "003_idempotency_records"
down_revision = "002_unique_master_codes"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "idempotency_records",
        sa.Column("idempotency_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column("endpoint", sa.String(length=255), nullable=False),
        sa.Column("response_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_unique_index("uq_idempotency_records_key", "idempotency_records", ["idempotency_key"])


def downgrade():
    op.drop_index("uq_idempotency_records_key", table_name="idempotency_records")
    op.drop_table("idempotency_records")
