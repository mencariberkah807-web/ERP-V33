"""initial ERP relational schema

Revision ID: 001_initial_erp
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_erp"
down_revision: Union[str, Sequence[str], None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("customer_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("customer_code", sa.String(length=100), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="Active"),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("customer_id"),
    )
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_code", sa.String(length=100), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="Active"),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("product_id"),
    )
    op.create_table(
        "sales_orders",
        sa.Column("sales_order_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_number", sa.String(length=100), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("order_type", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="NEW_ORDER"),
        sa.Column("order_date", sa.Date(), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("priority", sa.String(length=30), nullable=True),
        sa.Column("marketplace", sa.String(length=100), nullable=True),
        sa.Column("marketplace_customer", sa.String(length=255), nullable=True),
        sa.Column("tracking_number", sa.String(length=150), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.customer_id"]),
        sa.PrimaryKeyConstraint("sales_order_id"),
        sa.UniqueConstraint("order_number"),
        sa.CheckConstraint("order_type IN ('DIRECT_ORDER', 'MARKETPLACE')", name="ck_sales_orders_order_type"),
        sa.CheckConstraint("status IN ('NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE')", name="ck_sales_orders_status"),
    )
    op.create_table(
        "sales_order_items",
        sa.Column("so_item_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sales_order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("item_code", sa.String(length=100), nullable=True),
        sa.Column("product_name", sa.String(length=255), nullable=True),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.Column("unit_price", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="ACTIVE"),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.product_id"]),
        sa.ForeignKeyConstraint(["sales_order_id"], ["sales_orders.sales_order_id"]),
        sa.PrimaryKeyConstraint("so_item_id"),
        sa.UniqueConstraint("sales_order_id", "so_item_id", name="uq_sales_order_item_identity"),
        sa.CheckConstraint("quantity > 0", name="ck_sales_order_items_quantity"),
        sa.CheckConstraint("unit_price >= 0", name="ck_sales_order_items_unit_price"),
        sa.CheckConstraint("status IN ('ACTIVE', 'INACTIVE')", name="ck_sales_order_items_status"),
    )
    op.create_table(
        "payments",
        sa.Column("payment_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sales_order_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("payment_reference", sa.String(length=150), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sales_order_id"], ["sales_orders.sales_order_id"]),
        sa.PrimaryKeyConstraint("payment_id"),
        sa.CheckConstraint("amount > 0", name="ck_payments_amount"),
    )
    op.create_table(
        "work_orders",
        sa.Column("work_order_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sales_order_id", sa.Integer(), nullable=False),
        sa.Column("so_item_id", sa.Integer(), nullable=False),
        sa.Column("work_order_number", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="READY_PRODUCTION"),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sales_order_id", "so_item_id"], ["sales_order_items.sales_order_id", "sales_order_items.so_item_id"], name="fk_work_order_sales_order_item"),
        sa.PrimaryKeyConstraint("work_order_id"),
        sa.UniqueConstraint("work_order_number"),
        sa.CheckConstraint("status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')", name="ck_work_orders_status"),
    )
    op.create_table(
        "production_records",
        sa.Column("production_record_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="READY_PRODUCTION"),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["work_order_id"], ["work_orders.work_order_id"]),
        sa.PrimaryKeyConstraint("production_record_id"),
        sa.CheckConstraint("status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')", name="ck_production_records_status"),
    )
    op.create_table(
        "fulfillment",
        sa.Column("fulfillment_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sales_order_id", sa.Integer(), nullable=False),
        sa.Column("packing_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("handover_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sales_order_id"], ["sales_orders.sales_order_id"]),
        sa.PrimaryKeyConstraint("fulfillment_id"),
        sa.UniqueConstraint("sales_order_id"),
    )
    op.create_table(
        "audit_records",
        sa.Column("audit_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", sa.String(length=100), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("actor_id", sa.String(length=100), nullable=True),
        sa.Column("event_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("audit_id"),
    )
    for name, table, columns in [
        ("ix_sales_orders_customer", "sales_orders", ["customer_id"]),
        ("ix_sales_orders_status", "sales_orders", ["status"]),
        ("ix_sales_orders_order_type", "sales_orders", ["order_type"]),
        ("ix_sales_order_items_order", "sales_order_items", ["sales_order_id"]),
        ("ix_payments_order", "payments", ["sales_order_id"]),
        ("ix_work_orders_order", "work_orders", ["sales_order_id", "so_item_id"]),
        ("ix_work_orders_status", "work_orders", ["status"]),
        ("ix_production_work_order_status", "production_records", ["work_order_id", "status"]),
        ("ix_fulfillment_order", "fulfillment", ["sales_order_id"]),
        ("ix_audit_entity", "audit_records", ["entity_type", "entity_id", "created_at"]),
    ]:
        op.create_index(name, table, columns)
    op.create_index("ux_work_orders_active_so_item", "work_orders", ["sales_order_id", "so_item_id"], unique=True, sqlite_where=sa.text("status <> 'INACTIVE'"))


def downgrade() -> None:
    for name, table in [
        ("ux_work_orders_active_so_item", "work_orders"),
        ("ix_audit_entity", "audit_records"),
        ("ix_fulfillment_order", "fulfillment"),
        ("ix_production_work_order_status", "production_records"),
        ("ix_work_orders_status", "work_orders"),
        ("ix_work_orders_order", "work_orders"),
        ("ix_payments_order", "payments"),
        ("ix_sales_order_items_order", "sales_order_items"),
        ("ix_sales_orders_order_type", "sales_orders"),
        ("ix_sales_orders_status", "sales_orders"),
        ("ix_sales_orders_customer", "sales_orders"),
    ]:
        op.drop_index(name, table_name=table)
    for table in ["audit_records", "fulfillment", "production_records", "work_orders", "payments", "sales_order_items", "sales_orders", "products", "customers"]:
        op.drop_table(table)
