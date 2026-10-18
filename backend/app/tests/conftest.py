import os
import subprocess
import sys
from pathlib import Path
import pytest

os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "postgresql+psycopg://bhandaaro:local-development-only@127.0.0.1:5433/bhandaaro_test")
from sqlalchemy import text
from sqlalchemy.engine import make_url
from fastapi.testclient import TestClient
from backend.app.database import engine, SessionLocal, Base
from backend.app.main import app, rate_buckets
from backend.app.seed import seed

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    # Refuse to reset any database that is not explicitly a dedicated test database.
    database = make_url(os.environ["DATABASE_URL"]).database
    if not database or not database.endswith("_test"):
        raise RuntimeError("TEST_DATABASE_URL must name a database ending in _test")
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT current_database()")) == database
    command = [sys.executable, "-m", "alembic", "-c", "backend/alembic.ini"]
    for operation in [["upgrade", "head"], ["downgrade", "base"], ["upgrade", "head"], ["check"]]:
        subprocess.run(command + operation, cwd=ROOT, check=True)
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(migrated_database):
    with engine.begin() as connection:
        connection.execute(text('TRUNCATE ' + ', '.join('"' + table.name + '"' for table in Base.metadata.sorted_tables) + ' RESTART IDENTITY CASCADE'))
    rate_buckets.clear()
    with SessionLocal() as db:
        seed(db)


@pytest.fixture
def client():
    with TestClient(app) as client:
        client.headers["Origin"] = "http://localhost:8000"
        yield client


@pytest.fixture
def account(client):
    response = client.post("/api/auth/register", json={"name": "Tester", "email": "tester@example.com", "password": "test-password-123"})
    assert response.status_code == 201, response.text
    return response.json()
