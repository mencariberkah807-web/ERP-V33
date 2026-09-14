from datetime import datetime

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import IdempotencyRecord, ProductionRecord, SalesOrder, SalesOrderItem, WorkOrder

router = APIRouter(prefix="/api/v1/work-orders", tags=["work-orders"])

ELIGIBLE_SO_STATUSES = {"NEW_ORDER", "READY_PRODUCTION"}
ACTIVE_WO_STATUSES = {"READY_PRODUCTION", "IN_PRODUCTION", "COMPLETED_PRODUCTION"}


def _success(data, meta=None):
    return {"data": data, "meta": meta or {}}


def _order(db, so_number):
    record = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
    if not record:
        raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")
    return record


def _item(db, order, so_item_id):
    if not str(so_item_id).isdigit():
        raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    item = db.scalar(select(SalesOrderItem).where(
        SalesOrderItem.sales_order_id == order.sales_order_id,
        SalesOrderItem.so_item_id == int(so_item_id),
    ))
    if not item:
        raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    if item.status == "INACTIVE":
        raise HTTPException(status_code=409, detail={"code": "SO_ITEM_INACTIVE", "message": "Sales Order Item is inactive", "details": {}})
    return item


def _next_number(db):
    values = db.scalars(select(WorkOrder.work_order_number)).all()
    numbers = []
    for value in values:
        text = str(value or "")
        if text.startswith("WO-") and text[3:].isdigit():
            numbers.append(int(text[3:]))
        elif text.startswith("WO") and text[2:].isdigit():
            numbers.append(int(text[2:]))
    return f"WO-{max(numbers or [0]) + 1:05d}"


def _wo_data(db, wo):
    order = db.get(SalesOrder, wo.sales_order_id)
    item = db.scalar(select(SalesOrderItem).where(
        SalesOrderItem.sales_order_id == wo.sales_order_id,
        SalesOrderItem.so_item_id == wo.so_item_id,
    ))
    data = dict(wo.data or {})
    if item:
        data.update(dict(item.data or {}))
    data.update({
        "workOrderId": wo.work_order_id,
        "workOrderNumber": wo.work_order_number,
        "salesOrderId": wo.sales_order_id,
        "soNumber": order.order_number if order else str(wo.sales_order_id),
        "soItemId": str(wo.so_item_id),
        "customer": data.get("customer") or ({"id": str(order.customer_id)} if order and order.customer_id is not None else None),
        "marketplace": order.marketplace if order else data.get("marketplace"),
        "orderDate": order.order_date.isoformat() if order and order.order_date else data.get("orderDate"),
        "deadline": order.deadline.isoformat() if order and order.deadline else data.get("deadline"),
        "productId": item.item_code if item else data.get("productId"),
        "productName": item.product_name if item else data.get("productName"),
        "quantity": float(item.quantity) if item else data.get("quantity"),
        "unitPrice": float(item.unit_price) if item else data.get("unitPrice"),
        "status": wo.status,
        "process": data.get("process") or {
            "laserCutting": "PENDING", "uvPrinting": "PENDING", "assembly": "PENDING",
            "laserMarking": "PENDING", "finishing": "PENDING",
        },
        "timeline": data.get("timeline") or [],
        "createdAt": wo.created_at.isoformat() if wo.created_at else None,
        "updatedAt": wo.updated_at.isoformat() if wo.updated_at else None,
    })
    return data


def _get_idempotent(db, key, endpoint):
    existing = db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == key))
    if not existing:
        return None
    if existing.endpoint != endpoint:
        raise HTTPException(status_code=409, detail={"code": "IDEMPOTENCY_CONFLICT", "message": "Idempotency-Key was already used for a different request", "details": {}})
    return dict(existing.response_data or {})


def _save_idempotent(db, key, endpoint, response):
    db.add(IdempotencyRecord(idempotency_key=key, endpoint=endpoint, response_data=response))


class WorkOrderCreateInput(BaseModel):
    soItemId: str


@router.get("")
def list_work_orders(
    soNumber: str | None = Query(default=None),
    status: str | None = Query(default=None),
    active: bool | None = Query(default=None),
):
    with Session(engine) as db:
        stmt = select(WorkOrder).order_by(WorkOrder.work_order_id)
        if soNumber:
            order = _order(db, soNumber)
            stmt = stmt.where(WorkOrder.sales_order_id == order.sales_order_id)
        if status:
            stmt = stmt.where(WorkOrder.status == status.strip().upper().replace(" ", "_"))
        if active is True:
            stmt = stmt.where(WorkOrder.status != "INACTIVE")
        elif active is False:
            stmt = stmt.where(WorkOrder.status == "INACTIVE")
        rows = db.scalars(stmt).all()
        return _success([_wo_data(db, row) for row in rows], {"total": len(rows)})


@router.get("/{work_order_number}")
def get_work_order(work_order_number: str):
    with Session(engine) as db:
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        return _success(_wo_data(db, wo))


@router.post("/sales-orders/{so_number}", status_code=201)
def create_work_order(so_number: str, payload: WorkOrderCreateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    key = idempotency_key.strip()
    endpoint = f"POST /api/v1/work-orders/sales-orders/{so_number}"
    with Session(engine) as db:
        stored = _get_idempotent(db, key, endpoint)
        if stored is not None:
            return stored
        order = _order(db, so_number)
        if order.status not in ELIGIBLE_SO_STATUSES:
            raise HTTPException(status_code=409, detail={"code": "SO_NOT_READY_FOR_PRODUCTION", "message": "Sales Order must be NEW_ORDER or READY_PRODUCTION before Work Order creation", "details": {"status": order.status}})
        item = _item(db, order, payload.soItemId)
        existing = db.scalar(select(WorkOrder).where(
            WorkOrder.sales_order_id == order.sales_order_id,
            WorkOrder.so_item_id == item.so_item_id,
            WorkOrder.status != "INACTIVE",
        ))
        if existing:
            raise HTTPException(status_code=409, detail={"code": "WORK_ORDER_EXISTS", "message": "An active Work Order already exists for this Sales Order Item", "details": {"workOrderNumber": existing.work_order_number}})
        item_data = dict(item.data or {})
        now = datetime.utcnow().isoformat()
        data = {
            **item_data,
            "source": "SALES_ORDER",
            "salesOrderNumber": order.order_number,
            "soItemId": str(item.so_item_id),
            "productId": item.item_code,
            "productName": item.product_name,
            "quantity": float(item.quantity),
            "unitPrice": float(item.unit_price),
            "timeline": [{"status": "READY", "at": now, "actor": "system"}],
        }
        wo = WorkOrder(sales_order_id=order.sales_order_id, so_item_id=item.so_item_id, work_order_number=_next_number(db), status="READY_PRODUCTION", data=data)
        db.add(wo)
        db.flush()
        response = _success(_wo_data(db, wo))
        _save_idempotent(db, key, endpoint, response)
        db.commit()
        return response


@router.post("/{work_order_number}/start")
def start_work_order(work_order_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    key = idempotency_key.strip()
    endpoint = f"POST /api/v1/work-orders/{work_order_number}/start"
    with Session(engine) as db:
        stored = _get_idempotent(db, key, endpoint)
        if stored is not None:
            return stored
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        if wo.status != "READY_PRODUCTION":
            raise HTTPException(status_code=409, detail={"code": "INVALID_WORK_ORDER_TRANSITION", "message": "Only READY_PRODUCTION Work Orders can start", "details": {"status": wo.status}})
        order = db.get(SalesOrder, wo.sales_order_id)
        now = datetime.utcnow().isoformat()
        data = dict(wo.data or {})
        data["timeline"] = [*(data.get("timeline") or []), {"status": "IN PRODUCTION", "at": now, "actor": "production"}]
        wo.data = data
        wo.status = "IN_PRODUCTION"
        if order and order.status in {"NEW_ORDER", "READY_PRODUCTION"}:
            order.status = "IN_PRODUCTION"
        db.add(ProductionRecord(work_order_id=wo.work_order_id, status="IN_PRODUCTION", data={"source": "WORK_ORDER_START", "startedAt": now}))
        db.flush()
        response = _success(_wo_data(db, wo))
        _save_idempotent(db, key, endpoint, response)
        db.commit()
        return response


@router.post("/{work_order_number}/complete")
def complete_work_order(work_order_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    key = idempotency_key.strip()
    endpoint = f"POST /api/v1/work-orders/{work_order_number}/complete"
    with Session(engine) as db:
        stored = _get_idempotent(db, key, endpoint)
        if stored is not None:
            return stored
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        if wo.status != "IN_PRODUCTION":
            raise HTTPException(status_code=409, detail={"code": "INVALID_WORK_ORDER_TRANSITION", "message": "Only IN_PRODUCTION Work Orders can complete", "details": {"status": wo.status}})
        order = db.get(SalesOrder, wo.sales_order_id)
        now = datetime.utcnow().isoformat()
        data = dict(wo.data or {})
        data["timeline"] = [*(data.get("timeline") or []), {"status": "COMPLETED PRODUCTION", "at": now, "actor": "production"}]
        wo.data = data
        wo.status = "COMPLETED_PRODUCTION"
        db.add(ProductionRecord(work_order_id=wo.work_order_id, status="COMPLETED_PRODUCTION", data={"source": "WORK_ORDER_COMPLETE", "completedAt": now}))
        if order:
            active_wos = db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id == order.sales_order_id, WorkOrder.status != "INACTIVE")).all()
            if active_wos and all(row.status == "COMPLETED_PRODUCTION" for row in active_wos):
                order.status = "PACKING"
        db.flush()
        response = _success(_wo_data(db, wo))
        _save_idempotent(db, key, endpoint, response)
        db.commit()
        return response


@router.post("/{work_order_number}/cancel")
def cancel_work_order(work_order_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    key = idempotency_key.strip()
    endpoint = f"POST /api/v1/work-orders/{work_order_number}/cancel"
    with Session(engine) as db:
        stored = _get_idempotent(db, key, endpoint)
        if stored is not None:
            return stored
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        if wo.status == "INACTIVE":
            raise HTTPException(status_code=409, detail={"code": "WORK_ORDER_INACTIVE", "message": "Work Order is already inactive", "details": {}})
        now = datetime.utcnow().isoformat()
        data = dict(wo.data or {})
        data["timeline"] = [*(data.get("timeline") or []), {"status": "INACTIVE", "at": now, "actor": "admin"}]
        wo.data = data
        wo.status = "INACTIVE"
        db.flush()
        response = _success(_wo_data(db, wo))
        _save_idempotent(db, key, endpoint, response)
        db.commit()
        return response
