import hashlib
import json
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, IdempotencyRecord, Payment, Product, SalesOrder, SalesOrderItem, WorkOrder

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
    unitPrice: Decimal | None = Field(default=None, ge=0)

class SalesOrderItemUpdateInput(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    unitPrice: Decimal | None = Field(default=None, ge=0)

def _success(data, meta=None): return {"data": data, "meta": meta or {}}
def _fingerprint(payload): return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()
def _idempotency(db, key, endpoint, payload):
    if not key or not key.strip(): raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    record = db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == key.strip()))
    if not record: return None
    stored = dict(record.response_data or {})
    if record.endpoint != endpoint or stored.get("_requestHash") != _fingerprint(payload): raise HTTPException(status_code=409, detail={"code":"IDEMPOTENCY_CONFLICT","message":"Idempotency-Key was already used for a different request","details":{}})
    stored.pop("_requestHash", None); return stored
def _store(db, key, endpoint, payload, response):
    stored = dict(response); stored["_requestHash"] = _fingerprint(payload); db.add(IdempotencyRecord(idempotency_key=key.strip(), endpoint=endpoint, response_data=stored))
def _editable_order(record):
    if record.status not in {"NEW_ORDER", "READY_PRODUCTION"}: raise HTTPException(status_code=409, detail="Sales Order cannot be modified after production has started")
def _order(db, so_number):
    record = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
    if not record: raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")
    return record
def _item(db, record, so_item_id):
    if not str(so_item_id).isdigit(): raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    item = db.scalar(select(SalesOrderItem).where(SalesOrderItem.sales_order_id == record.sales_order_id, SalesOrderItem.so_item_id == int(so_item_id)))
    if not item: raise HTTPException(status_code=404, detail=f"Sales Order Item not found: {so_item_id}")
    return item
def _item_data(item): return {**dict(item.data or {}), "soItemId": str(item.so_item_id), "productId": item.item_code, "quantity": float(item.quantity), "unitPrice": float(item.unit_price), "status": item.status}
def _request(key, endpoint, payload, db): return _idempotency(db, key or "", endpoint, payload)
def _resolve_unit_price(product, requested_price):
    if requested_price is not None: return requested_price
    product_data = dict(product.data or {})
    selling_price = product_data.get("sellingPrice", product_data.get("selling_price", 0))
    return Decimal(str(selling_price or 0))

def _payment_status_condition(normalized_payment):
    payment_totals = select(Payment.sales_order_id, func.coalesce(func.sum(Payment.amount), 0).label("paid_amount")).group_by(Payment.sales_order_id).subquery()
    order_totals = select(SalesOrderItem.sales_order_id, func.coalesce(func.sum(SalesOrderItem.quantity * SalesOrderItem.unit_price), 0).label("order_total")).where(SalesOrderItem.status != "INACTIVE").group_by(SalesOrderItem.sales_order_id).subquery()
    paid_amount = func.coalesce(payment_totals.c.paid_amount, 0)
    order_total = func.coalesce(order_totals.c.order_total, 0)
    joined = select(SalesOrder.sales_order_id).outerjoin(payment_totals, payment_totals.c.sales_order_id == SalesOrder.sales_order_id).outerjoin(order_totals, order_totals.c.sales_order_id == SalesOrder.sales_order_id)
    if normalized_payment == "PAID": return SalesOrder.sales_order_id.in_(joined.where(order_total > 0, paid_amount >= order_total))
    if normalized_payment == "UNPAID": return SalesOrder.sales_order_id.in_(joined.where(paid_amount <= 0))
    if normalized_payment == "PARTIALLY_PAID": return SalesOrder.sales_order_id.in_(joined.where(order_total > 0, paid_amount > 0, paid_amount < order_total))
    raise HTTPException(status_code=422, detail="Unsupported paymentStatus; use PAID, PARTIALLY_PAID, or UNPAID")

@router.get("")
def list_sales_orders(page: int = Query(default=1, ge=1), pageSize: int = Query(default=25, ge=1, le=100), sort: str = Query(default="sales_order_id"), orderType: str | None = Query(default=None), status: str | None = Query(default=None), customerId: str | None = Query(default=None), dateFrom: date | None = Query(default=None), dateTo: date | None = Query(default=None), active: bool | None = Query(default=None), paymentStatus: str | None = Query(default=None)):
    allowed_sorts = {"sales_order_id": SalesOrder.sales_order_id, "soNumber": SalesOrder.order_number, "orderDate": SalesOrder.order_date, "status": SalesOrder.status, "orderType": SalesOrder.order_type, "customerId": SalesOrder.customer_id}
    sort_key = sort.lstrip("-")
    if sort_key not in allowed_sorts: raise HTTPException(status_code=422, detail=f"Unsupported sort field: {sort_key}")
    descending = sort.startswith("-")
    with Session(engine) as db:
        conditions = []
        if orderType: conditions.append(SalesOrder.order_type == orderType.strip().upper().replace(" ", "_"))
        if status: conditions.append(SalesOrder.status == status.strip().upper().replace(" ", "_"))
        if customerId:
            normalized = customerId.strip(); customer = db.scalar(select(Customer).where(Customer.customer_code == normalized))
            if customer: conditions.append(SalesOrder.customer_id == customer.customer_id)
            elif normalized.isdigit(): conditions.append(SalesOrder.customer_id == int(normalized))
            else: return _success([], {"page": page, "pageSize": pageSize, "total": 0, "totalPages": 0})
        if dateFrom: conditions.append(SalesOrder.order_date >= dateFrom)
        if dateTo: conditions.append(SalesOrder.order_date <= dateTo)
        if active is True: conditions.append(SalesOrder.status != "INACTIVE")
        elif active is False: conditions.append(SalesOrder.status == "INACTIVE")
        if paymentStatus: conditions.append(_payment_status_condition(paymentStatus.strip().upper().replace(" ", "_")))
        base = select(SalesOrder).where(*conditions); count = db.scalar(select(func.count()).select_from(base.subquery())) or 0
        ordering = allowed_sorts[sort_key].desc() if descending else allowed_sorts[sort_key].asc()
        rows = db.scalars(base.order_by(ordering, SalesOrder.sales_order_id.asc()).offset((page - 1) * pageSize).limit(pageSize)).all(); result=[]
        for record in rows:
            customer=db.get(Customer,record.customer_id); items=db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id==record.sales_order_id).order_by(SalesOrderItem.so_item_id)).all()
            result.append({"salesOrderId":record.sales_order_id,"soNumber":record.order_number,"orderType":record.order_type,"status":record.status,"customerId":customer.customer_code if customer and customer.customer_code else str(record.customer_id),"orderDate":record.order_date.isoformat() if record.order_date else None,"deadline":record.deadline.isoformat() if record.deadline else None,"priority":record.priority,"marketplace":record.marketplace,"marketplaceCustomer":record.marketplace_customer,"trackingNumber":record.tracking_number,"items":[_item_data(item) for item in items]})
        return _success(result, {"page":page,"pageSize":pageSize,"total":count,"totalPages":(count+pageSize-1)//pageSize})

@router.patch("/{so_number}")
def update_sales_order(so_number, payload: SalesOrderUpdateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    endpoint="PATCH /api/v1/sales-orders/{soNumber}"; request_data={"soNumber":so_number, **payload.model_dump(mode="json", exclude_none=True)}
    with Session(engine) as db:
        existing=_request(idempotency_key, endpoint, request_data, db)
        if existing is not None: return existing
        record=_order(db, so_number); _editable_order(record)
        if payload.orderDate is not None:
            try: record.order_date=date.fromisoformat(payload.orderDate)
            except ValueError: raise HTTPException(status_code=422, detail="orderDate must be YYYY-MM-DD")
        if payload.deadline is not None:
            try: record.deadline=date.fromisoformat(payload.deadline)
            except ValueError: raise HTTPException(status_code=422, detail="deadline must be YYYY-MM-DD")
        for source,target in (("priority","priority"),("marketplace","marketplace"),("marketplaceCustomer","marketplace_customer"),("trackingNumber","tracking_number")):
            value=getattr(payload,source)
            if value is not None: setattr(record,target,value)
        response=_success({"soNumber":record.order_number,"status":record.status,"priority":record.priority,"orderDate":record.order_date.isoformat() if record.order_date else None,"deadline":record.deadline.isoformat() if record.deadline else None}); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response

@router.post("/{so_number}/cancel")
def cancel_sales_order(so_number, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    endpoint="POST /api/v1/sales-orders/{soNumber}/cancel"; request_data={"soNumber":so_number}
    with Session(engine) as db:
        existing=_request(idempotency_key,endpoint,request_data,db)
        if existing is not None: return existing
        record=_order(db,so_number)
        if record.status in {"IN_PRODUCTION","PACKING","RTS","COMPLETED"}: raise HTTPException(status_code=409, detail={"code":"CANNOT_CANCEL_AFTER_PRODUCTION_START","message":"Sales Order cannot be cancelled after production has started","details":{}})
        record.status="INACTIVE"
        for item in db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id==record.sales_order_id,SalesOrderItem.status!="INACTIVE")).all():
            item.status="INACTIVE"
            for wo in db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id==record.sales_order_id,WorkOrder.so_item_id==item.so_item_id,WorkOrder.status!="INACTIVE")).all(): wo.status="INACTIVE"
        response=_success({"soNumber":record.order_number,"status":record.status}); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response

@router.get("/{so_number}/items")
def get_sales_order_items(so_number, page: int = Query(default=1, ge=1), pageSize: int = Query(default=25, ge=1, le=100), sort: str = Query(default="so_item_id"), status: str | None = Query(default=None), active: bool | None = Query(default=None)):
    allowed_sorts = {"so_item_id": SalesOrderItem.so_item_id, "soItemId": SalesOrderItem.so_item_id, "productId": SalesOrderItem.item_code, "quantity": SalesOrderItem.quantity, "unitPrice": SalesOrderItem.unit_price, "status": SalesOrderItem.status}
    sort_key = sort.lstrip("-")
    if sort_key not in allowed_sorts: raise HTTPException(status_code=422, detail=f"Unsupported sort field: {sort_key}")
    descending = sort.startswith("-")
    with Session(engine) as db:
        record=_order(db,so_number); conditions=[SalesOrderItem.sales_order_id==record.sales_order_id]
        if status: conditions.append(SalesOrderItem.status == status.strip().upper().replace(" ", "_"))
        if active is True: conditions.append(SalesOrderItem.status != "INACTIVE")
        elif active is False: conditions.append(SalesOrderItem.status == "INACTIVE")
        base=select(SalesOrderItem).where(*conditions); count=db.scalar(select(func.count()).select_from(base.subquery())) or 0
        ordering=allowed_sorts[sort_key].desc() if descending else allowed_sorts[sort_key].asc()
        items=db.scalars(base.order_by(ordering, SalesOrderItem.so_item_id.asc()).offset((page-1)*pageSize).limit(pageSize)).all()
        return _success([_item_data(item) for item in items], {"page":page,"pageSize":pageSize,"total":count,"totalPages":(count+pageSize-1)//pageSize})

@router.post("/{so_number}/items", status_code=201)
def add_sales_order_item(so_number,payload:SalesOrderItemCreateInput,idempotency_key:str|None=Header(default=None,alias="Idempotency-Key")):
    endpoint="POST /api/v1/sales-orders/{soNumber}/items"; request_data={"soNumber":so_number,**payload.model_dump(mode="json")}
    with Session(engine) as db:
        existing=_request(idempotency_key,endpoint,request_data,db)
        if existing is not None: return existing
        record=_order(db,so_number); _editable_order(record); normalized=payload.productId.strip(); product=db.scalar(select(Product).where(Product.product_code==normalized))
        if not product and normalized.isdigit(): product=db.get(Product,int(normalized))
        if not product: raise HTTPException(status_code=404,detail=f"Product not found: {normalized}")
        unit_price=_resolve_unit_price(product,payload.unitPrice)
        item=SalesOrderItem(sales_order_id=record.sales_order_id,product_id=product.product_id,item_code=product.product_code,product_name=product.name,quantity=payload.quantity,unit_price=unit_price,status="ACTIVE"); db.add(item); db.flush()
        response=_success(_item_data(item)); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response

@router.patch("/{so_number}/items/{so_item_id}")
def update_sales_order_item(so_number,so_item_id,payload:SalesOrderItemUpdateInput,idempotency_key:str|None=Header(default=None,alias="Idempotency-Key")):
    endpoint="PATCH /api/v1/sales-orders/{soNumber}/items/{soItemId}"; request_data={"soNumber":so_number,"soItemId":so_item_id,**payload.model_dump(mode="json",exclude_none=True)}
    with Session(engine) as db:
        existing=_request(idempotency_key,endpoint,request_data,db)
        if existing is not None: return existing
        record=_order(db,so_number); _editable_order(record); item=_item(db,record,so_item_id)
        if item.status=="INACTIVE": raise HTTPException(status_code=409,detail={"code":"SO_ITEM_NOT_ACTIVE","message":"Sales Order Item is inactive","details":{}})
        if payload.quantity is not None: item.quantity=payload.quantity
        if payload.unitPrice is not None: item.unit_price=payload.unitPrice
        db.flush(); response=_success(_item_data(item)); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response

@router.post("/{so_number}/items/{so_item_id}/cancel")
def cancel_sales_order_item(so_number,so_item_id,idempotency_key:str|None=Header(default=None,alias="Idempotency-Key")):
    endpoint="POST /api/v1/sales-orders/{soNumber}/items/{soItemId}/cancel"; request_data={"soNumber":so_number,"soItemId":so_item_id}
    with Session(engine) as db:
        existing=_request(idempotency_key,endpoint,request_data,db)
        if existing is not None: return existing
        record=_order(db,so_number); _editable_order(record); item=_item(db,record,so_item_id)
        if item.status=="INACTIVE": response=_success(_item_data(item)); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response
        item.status="INACTIVE"
        for wo in db.scalars(select(WorkOrder).where(WorkOrder.sales_order_id==record.sales_order_id,WorkOrder.so_item_id==item.so_item_id,WorkOrder.status!="INACTIVE")).all(): wo.status="INACTIVE"
        active=db.scalar(select(SalesOrderItem.so_item_id).where(SalesOrderItem.sales_order_id==record.sales_order_id,SalesOrderItem.status=="ACTIVE").limit(1))
        if active is None: record.status="INACTIVE"
        db.flush(); response=_success(_item_data(item)); _store(db,idempotency_key,endpoint,request_data,response); db.commit(); return response
