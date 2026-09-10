import os

from fastapi import FastAPI
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


def _model_data(record):
    data = dict(record.data or {})
    if record.__class__ is Customer:
        data.setdefault("customerId", record.customer_id)
        data.setdefault("customerCode", record.customer_code)
        data.setdefault("displayName", record.name)
        data.setdefault("status", record.status)
    elif record.__class__ is Product:
        data.setdefault("productId", record.product_id)
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
