from datetime import datetime

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import IdempotencyRecord, ProductionRecord, SalesOrder, SalesOrderItem, WorkOrder

router = APIRouter(prefix="/api/v1/work-orders", tags=["work-orders"])

ELIGIBLE_SO_STATUSES = {"READY_PRODUCTION"}
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
    item = db.scalar(
        select(SalesOrderItem).where(
            SalesOrderItem.sales_order_id == order.sales_order_id,
            SalesOrderItem.so_item_id == int(so_item_id),
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    if item.status == "INACTIVE":
        raise HTTPException(status_code=409, detail={"code": "SO_ITEM_INACTIVE", "message": "Sales Order Item is inactive", "details": {}})
    return item


def _next_number(db):
    values = db.scalars(select(WorkOrder.work_order_number)).all()
    maximum = max([int(value[2:]) for value in values if value and value.startswith("WO") and value[2:].isdigit()] or [0])
    return f"WO{maximum + 1:06d}"


def _wo_data(db, wo):
    order = db.get(SalesOrder, wo.sales_order_id)
    item = db.scalar(select(SalesOrderItem).where(
        SalesOrderItem.sales_order_id == wo.sales_order_id,
        SalesOrderItem.so_item_id == wo.so_item_id,
    ))
    data = dict(wo.data or {})
    data.update({
        "workOrderId": wo.work_order_id,
        "workOrderNumber": wo.work_order_number,
        "salesOrderId": wo.sales_order_id,
        "soNumber": order.order_number if order else str(wo.sales_order_id),
        "soItemId": str(wo.so_item_id),
        "productId": item.item_code if item else data.get("productId"),
        "quantity": float(item.quantity) if item else data.get("quantity"),
        "unitPrice": float(item.unit_price) if item else data.get("unitPrice"),
        "status": wo.status,
        "createdAt": wo.created_at.isoformat() if wo.created_at else None,
        "updatedAt": wo.updated_at.isoformat() if wo.updated_at else None,
    })
    return data


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
def create_work_orders(
    so_number: str,
    payload: WorkOrderCreateInput,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    endpoint = f"POST /api/v1/work-orders/sales-orders/{so_number}"
    request_data = {"soNumber": so_number, **payload.model_dump(mode="json")}
    key = idempotency_key.strip()
    with Session(engine) as db:
        existing = db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == key))
        if existing:
            stored = dict(existing.response_data or {})
            if existing.endpoint != endpoint:
                raise HTTPException(status_code=409, detail={"code": "IDEMPOTENCY_CONFLICT", "message": "Idempotency-Key was already used for a different request", "details": {}})
            stored.pop("_requestHash", None)
            return stored

        order = _order(db, so_number)
        if order.status not in ELIGIBLE_SO_STATUSES:
            raise HTTPException(status_code=409, detail={"code": "SO_NOT_READY_FOR_PRODUCTION", "message": "Sales Order must be READY_PRODUCTION before Work Order creation", "details": {"status": order.status}})
        item = _item(db, order, payload.soItemId)
        existing_wo = db.scalar(select(WorkOrder).where(
            WorkOrder.sales_order_id == order.sales_order_id,
            WorkOrder.so_item_id == item.so_item_id,
            WorkOrder.status != "INACTIVE",
        ))
        if existing_wo:
            raise HTTPException(status_code=409, detail={"code": "WORK_ORDER_EXISTS", "message": "An active Work Order already exists for this Sales Order Item", "details": {"workOrderNumber": existing_wo.work_order_number}})

        wo = WorkOrder(
            sales_order_id=order.sales_order_id,
            so_item_id=item.so_item_id,
            work_order_number=_next_number(db),
            status="READY_PRODUCTION",
            data={
                "source": "SALES_ORDER",
                "salesOrderNumber": order.order_number,
                "soItemId": str(item.so_item_id),
                "productId": item.item_code,
                "quantity": float(item.quantity),
                "unitPrice": float(item.unit_price),
            },
        )
        db.add(wo)
        db.flush()
        response = _success(_wo_data(db, wo))
        db.add(IdempotencyRecord(idempotency_key=key, endpoint=endpoint, response_data=response))
        db.commit()
        return response


@router.post("/{work_order_number}/start")
def start_work_order(work_order_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        if wo.status != "READY_PRODUCTION":
            raise HTTPException(status_code=409, detail={"code": "INVALID_WORK_ORDER_TRANSITION", "message": "Only READY_PRODUCTION Work Orders can start", "details": {"status": wo.status}})
        order = db.get(SalesOrder, wo.sales_order_id)
        wo.status = "IN_PRODUCTION"
        if order and order.status == "READY_PRODUCTION":
            order.status = "IN_PRODUCTION"
        db.add(ProductionRecord(work_order_id=wo.work_order_id, status="IN_PRODUCTION", data={"source": "WORK_ORDER_START", "startedAt": datetime.utcnow().isoformat()}))
        db.commit()
        return _success(_wo_data(db, wo))


@router.post("/{work_order_number}/complete")
def complete_work_order(work_order_number: str, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        wo = db.scalar(select(WorkOrder).where(WorkOrder.work_order_number == work_order_number))
        if not wo:
            raise HTTPException(status_code=404, detail=f"Work Order not found: {work_order_number}")
        if wo.status != "IN_PRODUCTION":
            raise HTTPException(status_code=409, detail={"code": "INVALID_WORK_ORDER_TRANSITION", "message": "Only IN_PRODUCTION Work Orders can complete", "details": {"status": wo.status}})
        order = db.get(SalesOrder, wo.sales_order_id)
        wo.status = "COMPLETED_PRODUCTION"
        db.add(ProductionRecord(work_order_id=wo.work_order_id, status="COMPLETED_PRODUCTION", data={"source": "WORK_ORDER_COMPLETE", "completedAt": datetime.utcnow().isoformat()}))
        if order:
            active_wos = db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id == order.sales_order_id, WorkOrder.status != "INACTIVE")).all()
            if active_wos and all(row.status == "COMPLETED_PRODUCTION" for row in active_wos):
                order.status = "PACKING"
        db.commit()
        return _success(_wo_data(db, wo))
