from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, IdempotencyRecord, Payment, SalesOrder, SalesOrderItem

router = APIRouter(prefix="/api/v1", tags=["payments"])


class PaymentCreateInput(BaseModel):
    amount: Decimal = Field(gt=0)
    paymentDate: datetime
    method: str
    reference: str


def _success(data, meta=None):
    return {"data": data, "meta": meta or {}}


def _request_hash(payload):
    import hashlib
    import json

    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode()
    ).hexdigest()


def _payment_status(total_paid: Decimal, order_total: Decimal) -> str:
    total_paid = max(Decimal("0"), total_paid)
    order_total = max(Decimal("0"), order_total)
    if total_paid <= 0:
        return "UNPAID"
    if order_total > 0 and total_paid >= order_total:
        return "PAID"
    return "PARTIALLY PAID"


def _order_total(db: Session, sales_order_id: int) -> Decimal:
    value = db.scalar(
        select(func.coalesce(func.sum(SalesOrderItem.quantity * SalesOrderItem.unit_price), 0)).where(
            SalesOrderItem.sales_order_id == sales_order_id,
            SalesOrderItem.status == "ACTIVE",
        )
    )
    return Decimal(str(value or 0))


def _total_paid(db: Session, sales_order_id: int) -> Decimal:
    value = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.sales_order_id == sales_order_id
        )
    )
    return Decimal(str(value or 0))


def _external_customer_id(customer):
    return customer.customer_code or str(customer.customer_id)


def _payment_data(db: Session, payment: Payment, order: SalesOrder | None = None):
    if order is None:
        order = db.get(SalesOrder, payment.sales_order_id)
    customer = db.get(Customer, order.customer_id) if order else None
    order_total = _order_total(db, payment.sales_order_id)
    total_paid = _total_paid(db, payment.sales_order_id)
    status = _payment_status(total_paid, order_total)
    data = dict(payment.data or {})
    data.update(
        {
            "paymentId": str(payment.payment_id),
            "soNumber": order.order_number if order else str(payment.sales_order_id),
            "customerId": _external_customer_id(customer) if customer else None,
            "amount": float(payment.amount),
            "paymentDate": payment.paid_at.isoformat() if payment.paid_at else None,
            "method": payment.payment_method,
            "reference": payment.payment_reference,
            "status": status,
            "totalPaid": float(total_paid),
            "balance": float(max(Decimal("0"), order_total - total_paid)),
            "orderTotal": float(order_total),
        }
    )
    return data


@router.get("/sales-orders/{so_number}/payments")
def sales_order_payments(
    so_number: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=100),
    sort: str = "payment_id",
    status: str | None = None,
    dateFrom: datetime | None = None,
    dateTo: datetime | None = None,
):
    allowed_sorts = {
        "payment_id": Payment.payment_id,
        "paymentId": Payment.payment_id,
        "amount": Payment.amount,
        "paymentDate": Payment.paid_at,
        "createdAt": Payment.created_at,
    }
    descending = sort.startswith("-")
    sort_field = sort[1:] if descending else sort
    if sort_field not in allowed_sorts:
        raise HTTPException(status_code=422, detail=f"Unsupported sort field: {sort_field}")

    with Session(engine) as db:
        order = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
        if not order:
            raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")
        stmt = select(Payment).where(Payment.sales_order_id == order.sales_order_id)
        if dateFrom:
            stmt = stmt.where(Payment.paid_at >= dateFrom)
        if dateTo:
            stmt = stmt.where(Payment.paid_at <= dateTo)
        rows = db.scalars(stmt).all()
        if status:
            normalized = status.strip().upper().replace("_", " ")
            if normalized not in {"UNPAID", "PARTIALLY PAID", "PAID"}:
                raise HTTPException(status_code=422, detail="Unsupported payment status")
            rows = [row for row in rows if _payment_data(db, row, order)["status"] == normalized]
        reverse = descending
        rows.sort(key=lambda row: (getattr(row, sort_field if sort_field in {"payment_id", "amount"} else "payment_id") or 0), reverse=reverse)
        total = len(rows)
        start = (page - 1) * pageSize
        page_rows = rows[start : start + pageSize]
        meta = {"page": page, "pageSize": pageSize, "total": total, "totalPages": max(1, (total + pageSize - 1) // pageSize)}
        return _success([_payment_data(db, row, order) for row in page_rows], meta)


@router.get("/payments/{payment_id}")
def payment_detail(payment_id: str):
    if not payment_id.isdigit():
        raise HTTPException(status_code=404, detail=f"Payment not found: {payment_id}")
    with Session(engine) as db:
        payment = db.get(Payment, int(payment_id))
        if not payment:
            raise HTTPException(status_code=404, detail=f"Payment not found: {payment_id}")
        return _success(_payment_data(db, payment))


@router.post("/sales-orders/{so_number}/payments", status_code=201)
def create_payment(
    so_number: str,
    payload: PaymentCreateInput,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    method = payload.method.strip()
    reference = payload.reference.strip()
    if not method:
        raise HTTPException(status_code=422, detail="method is required")
    if not reference:
        raise HTTPException(status_code=422, detail="reference is required")

    endpoint = f"POST /api/v1/sales-orders/{so_number}/payments"
    request_data = payload.model_dump(mode="json")
    request_hash = _request_hash(request_data)
    key = idempotency_key.strip()

    with Session(engine) as db:
        existing = db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == key))
        if existing:
            stored = dict(existing.response_data or {})
            stored_hash = stored.get("_requestHash")
            if existing.endpoint != endpoint or (stored_hash and stored_hash != request_hash):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "IDEMPOTENCY_CONFLICT",
                        "message": "Idempotency-Key was already used for a different request",
                        "details": {},
                    },
                )
            stored.pop("_requestHash", None)
            return stored

        order = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
        if not order:
            raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")

        order_total = _order_total(db, order.sales_order_id)
        total_paid_before = _total_paid(db, order.sales_order_id)
        balance_before = max(Decimal("0"), order_total - total_paid_before)
        if payload.amount > balance_before and order_total > 0:
            raise HTTPException(status_code=422, detail="Payment amount exceeds outstanding balance")

        payment = Payment(
            sales_order_id=order.sales_order_id,
            amount=payload.amount,
            payment_method=method,
            payment_reference=reference,
            paid_at=payload.paymentDate,
            data={"source": "PAYMENT_V3", "idempotencyKey": key},
        )
        db.add(payment)
        db.flush()
        response = _success(_payment_data(db, payment, order))
        stored = dict(response)
        stored["_requestHash"] = request_hash
        db.add(IdempotencyRecord(idempotency_key=key, endpoint=endpoint, response_data=stored))
        db.commit()
        return response
