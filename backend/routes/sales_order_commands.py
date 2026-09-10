from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Payment, SalesOrder, SalesOrderItem, WorkOrder

router = APIRouter(prefix="/api/v1/sales-orders", tags=["sales-orders"])


class SalesOrderUpdateInput(BaseModel):
    orderDate: str | None = None
    deadline: str | None = None
    priority: str | None = None
    marketplace: str | None = None
    marketplaceCustomer: str | None = None
    trackingNumber: str | None = None


class SalesOrderItemCreateInput(BaseModel):
    productId: str
    quantity: Decimal = Field(gt=0)
    unitPrice: Decimal = Field(default=Decimal("0"), ge=0)


class SalesOrderItemUpdateInput(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    unitPrice: Decimal | None = Field(default=None, ge=0)


def _editable_order(record: SalesOrder):
    if record.status not in {"NEW_ORDER", "READY_PRODUCTION"}:
        raise HTTPException(status_code=409, detail="Sales Order cannot be modified after production has started")


def _order(db: Session, so_number: str) -> SalesOrder:
    record = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
    if not record:
        raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")
    return record


def _item(db: Session, record: SalesOrder, so_item_id: str) -> SalesOrderItem:
    if not str(so_item_id).isdigit():
        raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    item = db.scalar(select(SalesOrderItem).where(SalesOrderItem.sales_order_id == record.sales_order_id, SalesOrderItem.so_item_id == int(so_item_id)))
    if not item:
        raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    return item


def _item_data(item: SalesOrderItem):
    return {**dict(item.data or {}), "soItemId": str(item.so_item_id), "productId": item.item_code, "quantity": float(item.quantity), "unitPrice": float(item.unit_price), "status": item.status}


def _success(data):
    return {"data": data, "meta": {}}


@router.patch("/{so_number}")
def update_sales_order(so_number: str, payload: SalesOrderUpdateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key:
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        record = _order(db, so_number)
        _editable_order(record)
        if payload.orderDate is not None:
            from datetime import date
            try: record.order_date = date.fromisoformat(payload.orderDate)
            except ValueError: raise HTTPException(status_code=422, detail="orderDate must be YYYY-MM-DD")
        if payload.deadline is not None:
            from datetime import date
            try: record.deadline = date.fromisoformat(payload.deadline)
            except ValueError: raise HTTPException(status_code=422, detail="deadline must be YYYY-MM-DD")
        for source, target in (("priority", "priority"), ("marketplace", "marketplace"), ("marketplaceCustomer", "marketplace_customer"), ("trackingNumber", "tracking_number")):
            value = getattr(payload, source)
            if value is not None: setattr(record, target, value)
        db.commit(); db.refresh(record)
        return _success({"soNumber": record.order_number, "status": record.status})


@router.post("/{so_number}/cancel")
def cancel_sales_order(so_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key:
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        record = _order(db, so_number)
        if record.status in {"IN_PRODUCTION", "PACKING", "RTS", "COMPLETED"}:
            raise HTTPException(status_code=409, detail="CANNOT_CANCEL_AFTER_PRODUCTION_START")
        if record.status == "INACTIVE":
            return _success({"soNumber": record.order_number, "status": record.status})
        record.status = "INACTIVE"
        for item in db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id == record.sales_order_id, SalesOrderItem.status != "INACTIVE")).all():
            item.status = "INACTIVE"
            for wo in db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id == record.sales_order_id, WorkOrder.so_item_id == item.so_item_id, WorkOrder.status != "INACTIVE")).all():
                wo.status = "INACTIVE"
        db.commit()
        return _success({"soNumber": record.order_number, "status": record.status})


@router.get("/{so_number}/items")
def get_sales_order_items(so_number: str):
    with Session(engine) as db:
        record = _order(db, so_number)
        items = db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id == record.sales_order_id).order_by(SalesOrderItem.so_item_id)).all()
        return _success([_item_data(item) for item in items])


@router.post("/{so_number}/items", status_code=201)
def add_sales_order_item(so_number: str, payload: SalesOrderItemCreateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key:
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        record = _order(db, so_number); _editable_order(record)
        normalized = payload.productId.strip()
        from database.models import Product
        product = db.scalar(select(Product).where(Product.product_code == normalized))
        if not product and normalized.isdigit(): product = db.get(Product, int(normalized))
        if not product: raise HTTPException(status_code=404, detail=f"Product not found: {normalized}")
        item = SalesOrderItem(sales_order_id=record.sales_order_id, product_id=product.product_id, item_code=product.product_code, product_name=product.name, quantity=payload.quantity, unit_price=payload.unitPrice, status="ACTIVE")
        db.add(item); db.commit(); db.refresh(item)
        return _success(_item_data(item))


@router.patch("/{so_number}/items/{so_item_id}")
def update_sales_order_item(so_number: str, so_item_id: str, payload: SalesOrderItemUpdateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key:
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        record = _order(db, so_number); _editable_order(record)
        item = _item(db, record, so_item_id)
        if item.status == "INACTIVE": raise HTTPException(status_code=409, detail="SO_ITEM_NOT_ACTIVE")
        if payload.quantity is not None: item.quantity = payload.quantity
        if payload.unitPrice is not None: item.unit_price = payload.unitPrice
        db.commit(); db.refresh(item)
        return _success(_item_data(item))


@router.post("/{so_number}/items/{so_item_id}/cancel")
def cancel_sales_order_item(so_number: str, so_item_id: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key:
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        record = _order(db, so_number)
        _editable_order(record)
        item = _item(db, record, so_item_id)
        if item.status == "INACTIVE": return _success(_item_data(item))
        item.status = "INACTIVE"
        for wo in db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id == record.sales_order_id, WorkOrder.so_item_id == item.so_item_id, WorkOrder.status != "INACTIVE")).all():
            wo.status = "INACTIVE"
        active_count = db.scalar(select(SalesOrderItem.so_item_id).where(SalesOrderItem.sales_order_id == record.sales_order_id, SalesOrderItem.status == "ACTIVE").limit(1))
        if active_count is None: record.status = "INACTIVE"
        db.commit(); db.refresh(item)
        return _success(_item_data(item))
