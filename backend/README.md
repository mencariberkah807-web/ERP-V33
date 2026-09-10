# ARTKRILIK ERP V3.3 Backend

Proven local/deployment stack aligned with the working Cakra Langit backend pattern:

- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- Alembic
- SQLite by default
- `DATABASE_URL` remains configurable for a future production database

## Local

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn server:app --reload --port 3000
```

Health check: `http://127.0.0.1:3000/api/health`

The database is created at `backend/data/artkrilik_erp.db` by default.

## Production/container

The included `Dockerfile` installs Python dependencies, applies Alembic migrations, and starts Uvicorn. Set `DATABASE_URL` at deployment time when using a managed database.

Business/domain contracts remain governed by the ERP Phase 04 Database & Backend Architecture Contract; this backend layer does not redefine those rules.
