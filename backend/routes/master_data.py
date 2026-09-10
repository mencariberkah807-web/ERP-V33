from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, Product

router = APIRouter(prefix="/api/v1")


class CustomerInput(BaseModel):
    customerId: str
    customerName: str
    company: str | None = None
    displayName: str | None = None
    customerType: str
    mobile: str | None = None
    email: str | None = None
    address: str | None = None
    status: str = "Active"
    notes: str | None = None
    photo: str | None = None


class ProductInput(BaseModel):
    productId: str
    sku: str
    productName: str
    categoryId: str
    unit: str
    costPrice: float = 0
    sellingPrice: float = 0
    status: str = "Active"
    material: str | None = None
    specification: str | None = None
    color: str | None = None
    thickness: str | None = None
    length: str | None = None
    width: str | None = None
    height: str | None = None
    description: str | None = None
    image: str | None = None


def success(data):
    return {"data": data, "meta": {}}


def customer_data(record):
    return {**dict(record.data or {}), "customerId": record.customer_code, "customerName": record.name, "status": record.status}


def product_data(record):
    return {**dict(record.data or {}), "productId": record.product_code, "productName": record.name, "status": record.status}


@router.get("/customers/{customer_id}")
def get_customer(customer_id: str):
    with Session(engine) as db:
        record = db.scalar(select(Customer).where(Customer.customer_code == customer_id))
        if not record:
            raise HTTPException(status_code=404, detail=f"Customer not found: {customer_id}")
        return success(customer_data(record))


@router.post("/customers", status_code=201)
def create_customer(payload: CustomerInput):
    with Session(engine) as db:
        if db.scalar(select(Customer).where(Customer.customer_code == payload.customerId)):
            raise HTTPException(status_code=409, detail=f"Customer already exists: {payload.customerId}")
        values = payload.model_dump()
        record = Customer(customer_code=payload.customerId, name=payload.customerName, status=payload.status, data=values)
        db.add(record)
        db.commit()
        db.refresh(record)
        return success(customer_data(record))


@router.patch("/customers/{customer_id}")
def update_customer(customer_id: str, payload: CustomerInput):
    with Session(engine) as db:
        record = db.scalar(select(Customer).where(Customer.customer_code == customer_id))
        if not record:
            raise HTTPException(status_code=404, detail=f"Customer not found: {customer_id}")
        if payload.customerId != customer_id:
            raise HTTPException(status_code=422, detail="customerId cannot change")
        values = payload.model_dump()
        record.name = payload.customerName
        record.status = payload.status
        record.data = values
        db.commit()
        db.refresh(record)
        return success(customer_data(record))


@router.get("/products/{product_id}")
def get_product(product_id: str):
    with Session(engine) as db:
        record = db.scalar(select(Product).where(Product.product_code == product_id))
        if not record:
            raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
        return success(product_data(record))


@router.post("/products", status_code=201)
def create_product(payload: ProductInput):
    with Session(engine) as db:
        if db.scalar(select(Product).where(Product.product_code == payload.productId)):
            raise HTTPException(status_code=409, detail=f"Product already exists: {payload.productId}")
        values = payload.model_dump()
        record = Product(product_code=payload.productId, name=payload.productName, status=payload.status, data=values)
        db.add(record)
        db.commit()
        db.refresh(record)
        return success(product_data(record))


@router.patch("/products/{product_id}")
def update_product(product_id: str, payload: ProductInput):
    with Session(engine) as db:
        record = db.scalar(select(Product).where(Product.product_code == product_id))
        if not record:
            raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
        if payload.productId != product_id:
            raise HTTPException(status_code=422, detail="productId cannot change")
        values = payload.model_dump()
        record.name = payload.productName
        record.status = payload.status
        record.data = values
        db.commit()
        db.refresh(record)
        return success(product_data(record))
