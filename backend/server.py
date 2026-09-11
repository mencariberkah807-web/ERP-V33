import hashlib
import json
import os
from datetime import date, datetime
from decimal import Decimal

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Customer, IdempotencyRecord, Payment, Product, SalesOrder, SalesOrderItem, WorkOrder
from routes.master_data import router as master_data_router
from routes.payment_commands import router as payment_commands_router
from routes.sales_order_commands import router as sales_order_commands_router
from routes.work_order_commands import router as work_order_commands_router

app = FastAPI(title="ARTKRILIK ERP V3.3 API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(master_data_router)
app.include_router(payment_commands_router)
app.include_router(sales_order_commands_router)
app.include_router(work_order_commands_router)
ERROR_CODES={400:"BAD_REQUEST",401:"UNAUTHORIZED",403:"FORBIDDEN",404:"NOT_FOUND",409:"CONFLICT",422:"VALIDATION_ERROR",500:"INTERNAL_SERVER_ERROR"}
def _error_response(status_code,message,details=None): return JSONResponse(status_code=status_code,content={"error":{"code":ERROR_CODES.get(status_code,"API_ERROR"),"message":message,"details":details or {}}})
@app.exception_handler(HTTPException)
async def http_exception_handler(request:Request,exc:HTTPException):
    detail=exc.detail
    if isinstance(detail,dict): return JSONResponse(status_code=exc.status_code,content={"error":{"code":detail.get("code") or ERROR_CODES.get(exc.status_code,"API_ERROR"),"message":str(detail.get("message") or "Request failed"),"details":detail.get("details") or {}}})
    return _error_response(exc.status_code,str(detail) if detail else "Request failed")
@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request:Request,exc:RequestValidationError): return _error_response(422,"Request validation failed",{"errors":exc.errors()})
@app.exception_handler(Exception)
async def unhandled_exception_handler(request:Request,exc:Exception): return _error_response(500,"Internal server error")
class SalesOrderItemInput(BaseModel):
    soItemId:str|None=None
    productId:str
    quantity:Decimal=Field(gt=0)
    unitPrice:Decimal|None=Field(default=None,ge=0)
class SalesOrderCreateInput(BaseModel):
    orderType:str
    customerId:str
    items:list[SalesOrderItemInput]=Field(min_length=1)
    orderDate:date|None=None
    deadline:date|None=None
    priority:str|None=None
    marketplace:str|None=None
    marketplaceCustomer:str|None=None
    trackingNumber:str|None=None
def _external_customer_id(record): return record.customer_code or str(record.customer_id)
def _external_product_id(record): return record.product_code or str(record.product_id)
def _model_data(record):
    data=dict(record.data or {})
    if isinstance(record,Customer): data.setdefault("customerId",_external_customer_id(record)); data.setdefault("customerCode",record.customer_code); data.setdefault("displayName",record.name); data.setdefault("status",record.status)
    elif isinstance(record,Product): data.setdefault("productId",_external_product_id(record)); data.setdefault("productCode",record.product_code); data.setdefault("name",record.name); data.setdefault("status",record.status)
    elif isinstance(record,SalesOrder): data.setdefault("salesOrderId",record.sales_order_id); data.setdefault("soNumber",record.order_number); data.setdefault("orderType",record.order_type); data.setdefault("status",record.status)
    return data
def _sales_order_data(db,record):
    data=_model_data(record); customer=db.get(Customer,record.customer_id)
    data.setdefault("customerId",_external_customer_id(customer) if customer else str(record.customer_id)); data.setdefault("orderDate",record.order_date.isoformat() if record.order_date else None); data.setdefault("deadline",record.deadline.isoformat() if record.deadline else None); data.setdefault("priority",record.priority); data.setdefault("marketplace",record.marketplace); data.setdefault("marketplaceCustomer",record.marketplace_customer); data.setdefault("trackingNumber",record.tracking_number)
    items=db.scalars(select(SalesOrderItem).where(SalesOrderItem.sales_order_id==record.sales_order_id).order_by(SalesOrderItem.so_item_id)).all()
    data["items"]=[{**dict(item.data or {}),"soItemId":str(item.so_item_id),"productId":_external_product_id(db.get(Product,item.product_id)) if item.product_id else item.item_code,"quantity":float(item.quantity),"unitPrice":float(item.unit_price),"status":item.status} for item in items]
    return data
def _success(data,meta=None): return {"data":data,"meta":meta or {}}
def _request_hash(payload): return hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()
def resolve_customer_id(db,external_id):
    normalized=str(external_id).strip()
    if not normalized: raise HTTPException(status_code=422,detail="customerId is required")
    record=db.scalar(select(Customer).where(Customer.customer_code==normalized))
    if record:return record.customer_id
    if normalized.isdigit():
        record=db.get(Customer,int(normalized))
        if record:return record.customer_id
    raise HTTPException(status_code=404,detail=f"Customer not found: {normalized}")
def resolve_product_id(db,external_id):
    normalized=str(external_id).strip()
    if not normalized: raise HTTPException(status_code=422,detail="productId is required")
    record=db.scalar(select(Product).where(Product.product_code==normalized))
    if record:return record.product_id
    if normalized.isdigit():
        record=db.get(Product,int(normalized))
        if record:return record.product_id
    raise HTTPException(status_code=404,detail=f"Product not found: {normalized}")
def _next_order_number(db):
    maximum=max([int(v[2:]) for v in db.scalars(select(SalesOrder.order_number)).all() if v and v.startswith("SO") and v[2:].isdigit()] or [0]); return f"SO{maximum+1:06d}"
def _next_work_order_number(db):
    maximum=max([int(v[2:]) for v in db.scalars(select(WorkOrder.work_order_number)).all() if v and v.startswith("WO") and v[2:].isdigit()] or [0]); return f"WO{maximum+1:06d}"
@app.get("/api/health")
@app.get("/api/v1/health")
def health():
    with Session(engine) as db: db.execute(text("SELECT 1"))
    return {"status":"ok","database":"ok","service":"artkrilik-erp-v33"}
@app.get("/api/v1/customers")
def customers():
    with Session(engine) as db: rows=db.scalars(select(Customer).order_by(Customer.customer_id)).all()
    return _success([_model_data(r) for r in rows])
@app.get("/api/v1/products")
def products():
    with Session(engine) as db: rows=db.scalars(select(Product).order_by(Product.product_id)).all()
    return _success([_model_data(r) for r in rows])
@app.get("/api/v1/sales-orders")
def sales_orders():
    with Session(engine) as db: rows=db.scalars(select(SalesOrder).order_by(SalesOrder.sales_order_id)).all(); return _success([_sales_order_data(db,r) for r in rows])
@app.get("/api/v1/sales-orders/{so_number}")
def sales_order_detail(so_number):
    with Session(engine) as db:
        record=db.scalar(select(SalesOrder).where(SalesOrder.order_number==so_number))
        if not record: raise HTTPException(status_code=404,detail=f"Sales Order not found: {so_number}")
        return _success(_sales_order_data(db,record))
@app.post("/api/v1/sales-orders",status_code=201)
def create_sales_order(payload:SalesOrderCreateInput,idempotency_key:str|None=Header(default=None,alias="Idempotency-Key")):
    normalized_type=payload.orderType.strip().upper().replace(" ","_")
    if normalized_type not in {"DIRECT_ORDER","MARKETPLACE"}: raise HTTPException(status_code=422,detail={"code":"INVALID_ORDER_TYPE","message":"orderType must be Direct Order or Marketplace","details":{}})
    if not idempotency_key or not idempotency_key.strip(): raise HTTPException(status_code=422,detail="Idempotency-Key is required")
    endpoint="POST /api/v1/sales-orders"; request_data=payload.model_dump(mode="json",exclude_none=True); request_hash=_request_hash(request_data)
    with Session(engine) as db:
        existing=db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key==idempotency_key.strip()))
        if existing:
            stored=dict(existing.response_data or {}); stored_hash=stored.get("_requestHash")
            if existing.endpoint!=endpoint or (stored_hash and stored_hash!=request_hash): raise HTTPException(status_code=409,detail={"code":"IDEMPOTENCY_CONFLICT","message":"Idempotency-Key was already used for a different request","details":{}})
            stored.pop("_requestHash",None); return stored
        try:
            customer_id=resolve_customer_id(db,payload.customerId); product_rows=[(item,resolve_product_id(db,item.productId)) for item in payload.items]
            resolved_items=[]
            for item,product_id in product_rows:
                product=db.get(Product,product_id)
                product_data=dict(product.data or {})
                selling_price=product_data.get("sellingPrice",product_data.get("selling_price",0))
                unit_price=item.unitPrice if item.unitPrice is not None else Decimal(str(selling_price or 0))
                resolved_items.append((item,product_id,unit_price))
            total_amount=sum((item.quantity*unit_price for item,_,unit_price in resolved_items),Decimal("0"))
            if normalized_type=="MARKETPLACE" and total_amount<=0: raise HTTPException(status_code=422,detail="Marketplace order must have a positive total amount")
            order=SalesOrder(order_number=_next_order_number(db),customer_id=customer_id,order_type=normalized_type,status="READY_PRODUCTION" if normalized_type=="MARKETPLACE" else "NEW_ORDER",order_date=payload.orderDate,deadline=payload.deadline,priority=payload.priority,marketplace=payload.marketplace,marketplace_customer=payload.marketplaceCustomer,tracking_number=payload.trackingNumber); db.add(order); db.flush(); created_items=[]
            for item,product_id,unit_price in resolved_items:
                product=db.get(Product,product_id); so_item=SalesOrderItem(sales_order_id=order.sales_order_id,product_id=product_id,item_code=product.product_code,product_name=product.name,quantity=item.quantity,unit_price=unit_price,status="ACTIVE"); db.add(so_item); db.flush(); created_items.append(so_item)
            if normalized_type=="MARKETPLACE":
                db.add(Payment(sales_order_id=order.sales_order_id,amount=total_amount,payment_method="MARKETPLACE",payment_reference=idempotency_key,paid_at=datetime.utcnow(),data={"status":"PAID","source":"MARKETPLACE","idempotencyKey":idempotency_key}))
                for so_item in created_items: db.add(WorkOrder(sales_order_id=order.sales_order_id,so_item_id=so_item.so_item_id,work_order_number=_next_work_order_number(db),status="READY_PRODUCTION",data={"source":"MARKETPLACE","salesOrderNumber":order.order_number,"soItemId":str(so_item.so_item_id)}))
            response=_success(_sales_order_data(db,order)); stored=dict(response); stored["_requestHash"]=request_hash; db.add(IdempotencyRecord(idempotency_key=idempotency_key.strip(),endpoint=endpoint,response_data=stored)); db.commit(); return response
        except HTTPException: db.rollback(); raise
        except IntegrityError:
            db.rollback(); existing=db.scalar(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key==idempotency_key.strip()))
            if existing:
                stored=dict(existing.response_data or {}); stored.pop("_requestHash",None); return stored
            raise HTTPException(status_code=409,detail="Sales Order could not be created because a concurrent transaction conflicted")
        except Exception: db.rollback(); raise
if __name__=="__main__":
    import uvicorn
    uvicorn.run("server:app",host=os.getenv("HOST","0.0.0.0"),port=int(os.getenv("PORT","3000")),reload=True)