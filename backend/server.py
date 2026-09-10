import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, Product, SalesOrder

app = FastAPI(title="ARTKRILIK ERP V3.3 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _external_customer_id(record: Customer) -> str:
    """Expose the existing business code without changing the DB primary key."""
    return record.customer_code or str(record.customer_id)


def _external_product_id(record: Product) -> str:
    """Expose the existing business code without changing the DB primary key."""
    return record.product_code or str(record.product_id)


def _model_data(record):
    data = dict(record.data or {})
    if record.__class__ is Customer:
        external_id = _external_customer_id(record)
        data.setdefault("customerId", external_id)
        data.setdefault("customerCode", record.customer_code)
        data.setdefault("displayName", record.name)
        data.setdefault("status", record.status)
    elif record.__class__ is Product:
        external_id = _external_product_id(record)
        data.setdefault("productId", external_id)
        data.setdefault("productCode", record.product_code)
        data.setdefault("name", record.name)
        data.setdefault("status", record.status)
    else:
        data.setdefault("salesOrderId", record.sales_order_id)
        data.setdefault("soNumber", record.order_number)
        data.setdefault("orderType", record.order_type)
        data.setdefault("status", record.status)
    return data


def _success(data, meta=None):
    return {"data": data, "meta": meta or {}}


def resolve_customer_id(db: Session, external_id: str) -> int:
    """Resolve an API/customer business identifier to the internal DB PK."""
    normalized = str(external_id).strip()
    if not normalized:
        raise HTTPException(status_code=422, detail="customerId is required")

    record = db.scalar(select(Customer).where(Customer.customer_code == normalized))
    if record:
        return record.customer_id

    if normalized.isdigit():
        record = db.get(Customer, int(normalized))
        if record:
            return record.customer_id

    raise HTTPException(status_code=404, detail=f"Customer not found: {normalized}")


def resolve_product_id(db: Session, external_id: str) -> int:
    """Resolve an API/product business identifier to the internal DB PK."""
    normalized = str(external_id).strip()
    if not normalized:
        raise HTTPException(status_code=422, detail="productId is required")

    record = db.scalar(select(Product).where(Product.product_code == normalized))
    if record:
        return record.product_id

    if normalized.isdigit():
        record = db.get(Product, int(normalized))
        if record:
            return record.product_id

    raise HTTPException(status_code=404, detail=f"Product not found: {normalized}")


@app.get("/api/health")
@app.get("/api/v1/health")
def health():
    with Session(engine) as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok", "service": "artkrilik-erp-v33"}


@app.get("/api/v1/customers")
def customers():
    with Session(engine) as db:
        rows = db.scalars(select(Customer).order_by(Customer.customer_id)).all()
    return _success([_model_data(record) for record in rows])


@app.get("/api/v1/products")
def products():
    with Session(engine) as db:
        rows = db.scalars(select(Product).order_by(Product.product_id)).all()
    return _success([_model_data(record) for record in rows])


@app.get("/api/v1/sales-orders")
def sales_orders():
    with Session(engine) as db:
        rows = db.scalars(select(SalesOrder).order_by(SalesOrder.sales_order_id)).all()
    return _success([_model_data(record) for record in rows])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "3000")),
        reload=True,
    )
