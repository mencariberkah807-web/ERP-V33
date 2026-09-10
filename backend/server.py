import os
from datetime import date
from decimal import Decimal

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, Product, SalesOrder, SalesOrderItem
from routes.master_data import router as master_data_router

app = FastAPI(title="ARTKRILIK ERP V3.3 API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(master_data_router)

class SalesOrderItemInput(BaseModel):
    soItemId: str | None = None
    productId: str
    quantity: Decimal = Field(gt=0)
    unitPrice: Decimal = Field(default=Decimal("0"), ge=0)

class SalesOrderCreateInput(BaseModel):
    orderType: str
    customerId: str
    items: list[SalesOrderItemInput] = Field(min_length=1)
    orderDate: date | None = None
    deadline: date | None = None
    priority: str | None = None
    marketplace: str | None = None
    marketplaceCustomer: str | None = None
    trackingNumber: str | None = None

def _external_customer_id(record: Customer) -> str:
    return record.customer_code or str(record.customer_id)

def _external_product_id(record: Product) -> str:
    return record.product_code or str(record.product_id)

def _model_data(record):
    data = dict(record.data or {})
    if record.__class__ is Customer:
        data.setdefault("customerId", _external_customer_id(record)); data.setdefault("customerCode", record.customer_code); data.setdefault("displayName", record.name); data.setdefault("status", record.status)
    elif record.__class__ is Product:
        data.setdefault("productId", _external_product_id(record)); data.setdefault("productCode", record.product_code); data.setdefault("name", record.name); data.setdefault("status", record.status)
    elif record.__class__ is SalesOrder:
        data.setdefault("salesOrderId", record.sales_order_id); data.setdefault("soNumber", record.order_number); data.setdefault("orderType", record.order_type); data.setdefault("status", record.status)
    return data

def _sales_order_data(db: Session, record: SalesOrder):
    data = _model_data(record); customer = db.get(Customer, record.customer_id)
    data.setdefault("customerId", _external_customer_id(customer) if customer else str(record.customer_id)); data.setdefault("orderDate", record.order_date.isoformat() if record.order_date else None); data.setdefault("deadline", record.deadline.isoformat() if record.deadline else None); data.setdefault("priority", record.priority); data.setdefault("marketplace", record.marketplace); data.setdefault("marketplaceCustomer", record.marketplace_customer); data.setdefault("trackingNumber", record.tracking_number)
    items = db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id == record.sales_order_id).order_by(SalesOrderItem.so_item_id)).all()
    data["items"] = [{**dict(item.data or {}), "soItemId": str(item.so_item_id), "productId": _external_product_id(db.get(Product, item.product_id)) if item.product_id else item.item_code, "quantity": float(item.quantity), "unitPrice": float(item.unit_price), "status": item.status} for item in items]
    return data

def _success(data, meta=None): return {"data": data, "meta": meta or {}}

def resolve_customer_id(db: Session, external_id: str) -> int:
    normalized = str(external_id).strip()
    if not normalized: raise HTTPException(status_code=422, detail="customerId is required")
    record = db.scalar(select(Customer).where(Customer.customer_code == normalized))
    if record: return record.customer_id
    if normalized.isdigit():
        record = db.get(Customer, int(normalized))
        if record: return record.customer_id
    raise HTTPException(status_code=404, detail=f"Customer not found: {normalized}")

def resolve_product_id(db: Session, external_id: str) -> int:
    normalized = str(external_id).strip()
    if not normalized: raise HTTPException(status_code=422, detail="productId is required")
    record = db.scalar(select(Product).where(Product.product_code == normalized))
    if record: return record.product_id
    if normalized.isdigit():
        record = db.get(Product, int(normalized))
        if record: return record.product_id
    raise HTTPException(status_code=404, detail=f"Product not found: {normalized}")

def _next_order_number(db: Session) -> str:
    maximum = 0
    for value in db.scalars(select(SalesOrder.order_number)).all():
        if value and value.startswith("SO") and value[2:].isdigit(): maximum = max(maximum, int(value[2:]))
    return f"SO{maximum + 1:06d}"

@app.get("/api/health")
@app.get("/api/v1/health")
def health():
    with Session(engine) as db: db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok", "service": "artkrilik-erp-v33"}

@app.get("/api/v1/customers")
def customers():
    with Session(engine) as db: rows = db.scalars(select(Customer).order_by(Customer.customer_id)).all()
    return _success([_model_data(record) for record in rows])

@app.get("/api/v1/products")
def products():
    with Session(engine) as db: rows = db.scalars(select(Product).order_by(Product.product_id)).all()
    return _success([_model_data(record) for record in rows])

@app.get("/api/v1/sales-orders")
def sales_orders():
    with Session(engine) as db:
        rows = db.scalars(select(SalesOrder).order_by(SalesOrder.sales_order_id)).all()
        return _success([_sales_order_data(db, record) for record in rows])

@app.get("/api/v1/sales-orders/{so_number}")
def sales_order_detail(so_number: str):
    with Session(engine) as db:
        record = db.scalar(select(SalesOrder).where(SalesOrder.order_number == so_number))
        if not record: raise HTTPException(status_code=404, detail=f"Sales Order not found: {so_number}")
        return _success(_sales_order_data(db, record))

@app.post("/api/v1/sales-orders", status_code=201)
def create_sales_order(payload: SalesOrderCreateInput, idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    normalized_type = payload.orderType.strip().upper().replace(" ", "_")
    if normalized_type not in {"DIRECT_ORDER", "MARKETPLACE"}: raise HTTPException(status_code=422, detail="orderType must be Direct Order or Marketplace")
    if not idempotency_key: raise HTTPException(status_code=422, detail="Idempotency-Key is required")
    with Session(engine) as db:
        try:
            customer_id = resolve_customer_id(db, payload.customerId)
            product_rows = [(item, resolve_product_id(db, item.productId)) for item in payload.items]
            order = SalesOrder(order_number=_next_order_number(db), customer_id=customer_id, order_type=normalized_type, status="NEW_ORDER", order_date=payload.orderDate, deadline=payload.deadline, priority=payload.priority, marketplace=payload.marketplace, marketplace_customer=payload.marketplaceCustomer, tracking_number=payload.trackingNumber)
            db.add(order); db.flush()
            for item, product_id in product_rows:
                product = db.get(Product, product_id)
                db.add(SalesOrderItem(sales_order_id=order.sales_order_id, product_id=product_id, item_code=product.product_code, product_name=product.name, quantity=item.quantity, unit_price=item.unitPrice, status="ACTIVE"))
            db.commit(); db.refresh(order)
            return _success(_sales_order_data(db, order))
        except Exception:
            db.rollback(); raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "3000")), reload=True)
