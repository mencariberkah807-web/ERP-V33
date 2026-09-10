from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, JSON, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .connection import Base


class Customer(Base):
    __tablename__ = "customers"
    customer_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Active", nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Product(Base):
    __tablename__ = "products"
    product_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Active", nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SalesOrder(Base):
    __tablename__ = "sales_orders"
    sales_order_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.customer_id"), nullable=False)
    order_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="NEW_ORDER", nullable=False)
    order_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[str | None] = mapped_column(String(30), nullable=True)
    marketplace: Mapped[str | None] = mapped_column(String(100), nullable=True)
    marketplace_customer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(150), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    __table_args__ = (
        CheckConstraint("order_type IN ('DIRECT_ORDER', 'MARKETPLACE')", name="ck_sales_orders_order_type"),
        CheckConstraint("status IN ('NEW_ORDER', 'READY_PRODUCTION', 'IN_PRODUCTION', 'PACKING', 'RTS', 'COMPLETED', 'INACTIVE')", name="ck_sales_orders_status"),
        Index("ix_sales_orders_customer", "customer_id"),
        Index("ix_sales_orders_status", "status"),
        Index("ix_sales_orders_order_type", "order_type"),
    )


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"
    so_item_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.sales_order_id"), nullable=False)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.product_id"), nullable=True)
    item_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    __table_args__ = (
        UniqueConstraint("sales_order_id", "so_item_id", name="uq_sales_order_item_identity"),
        CheckConstraint("quantity > 0", name="ck_sales_order_items_quantity"),
        CheckConstraint("unit_price >= 0", name="ck_sales_order_items_unit_price"),
        CheckConstraint("status IN ('ACTIVE', 'INACTIVE')", name="ck_sales_order_items_status"),
        Index("ix_sales_order_items_order", "sales_order_id"),
    )


class Payment(Base):
    __tablename__ = "payments"
    payment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.sales_order_id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_reference: Mapped[str | None] = mapped_column(String(150), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount"),
        Index("ix_payments_order", "sales_order_id"),
    )


class WorkOrder(Base):
    __tablename__ = "work_orders"
    work_order_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.sales_order_id"), nullable=False)
    so_item_id: Mapped[int] = mapped_column(ForeignKey("sales_order_items.so_item_id"), nullable=False)
    work_order_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="READY_PRODUCTION", nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    __table_args__ = (
        CheckConstraint("status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')", name="ck_work_orders_status"),
        Index("ix_work_orders_order", "sales_order_id", "so_item_id"),
        Index("ix_work_orders_status", "status"),
    )


class ProductionRecord(Base):
    __tablename__ = "production_records"
    production_record_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.work_order_id"), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="READY_PRODUCTION", nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    __table_args__ = (
        CheckConstraint("status IN ('READY_PRODUCTION', 'IN_PRODUCTION', 'COMPLETED_PRODUCTION', 'INACTIVE')", name="ck_production_records_status"),
        Index("ix_production_work_order_status", "work_order_id", "status"),
    )


class Fulfillment(Base):
    __tablename__ = "fulfillment"
    fulfillment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.sales_order_id"), unique=True, nullable=False)
    packing_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    handover_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    __table_args__ = (Index("ix_fulfillment_order", "sales_order_id"),)


class AuditRecord(Base):
    __tablename__ = "audit_records"
    audit_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    event_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (Index("ix_audit_entity", "entity_type", "entity_id", "created_at"),)
