import os

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.connection import engine

app = FastAPI(title="ARTKRILIK ERP V3.3 API", version="0.1.0")


@app.get("/api/health")
def health():
    with Session(engine) as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok", "service": "artkrilik-erp-v33"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "3000")),
        reload=True,
    )
