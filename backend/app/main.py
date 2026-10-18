import time
from pathlib import Path
from fastapi import FastAPI, Depends, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .routers import auth, locations

app = FastAPI(title="Bhandaaro Ki Jaankari API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_credentials=True,
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Idempotency-Key"])
app.include_router(auth.router)
app.include_router(locations.router)
ROOT = Path(__file__).resolve().parents[2]
# One-process local development limit. A shared limiter is required before scaling.
rate_buckets = {}


def error(status, message, fields=None):
    body = {"code": status, "message": message}
    if fields:
        body["fields"] = fields
    return JSONResponse(status_code=status, content={"error": body})


@app.middleware("http")
async def protect_writes(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.headers.get("origin") not in settings.allowed_origins:
            return error(403, "Request origin is not allowed")
        if request.headers.get("content-type", "").split(";")[0] != "application/json":
            return error(415, "Use application/json")
        try:
            length = int(request.headers.get("content-length", "0"))
        except ValueError:
            return error(400, "Invalid Content-Length")
        if length > 65536:
            return error(413, "Request too large")
        window = int(time.monotonic() // 60)
        key = (request.client.host, "auth" if request.url.path.startswith("/api/auth/") else "write")
        old_window, count = rate_buckets.get(key, (window, 0))
        count = count + 1 if old_window == window else 1
        rate_buckets[key] = (window, count)
        if len(rate_buckets) > 10000:
            for expired in [k for k, (w, _) in rate_buckets.items() if w < window]:
                rate_buckets.pop(expired, None)
        if count > (30 if key[1] == "auth" else 60):
            return error(429, "Too many requests. Try again in a minute.")
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    # OSM tiles are cross-origin and require the real website Referer.
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return error(exc.status_code, str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    fields = [{"field": ".".join(str(part) for part in item["loc"]), "message": item["msg"]} for item in exc.errors()]
    return error(422, "Please check the submitted fields", fields)


@app.exception_handler(SQLAlchemyError)
async def database_error(request, exc):
    return error(503, "Database is temporarily unavailable")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ready"}


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse(ROOT / "index.html", headers={"Cache-Control": "no-cache"})


# Serve only application assets; never mount the repository (contains .env/.venv).
ASSETS = {"app.js", "api.js", "auth.js", "locations.js", "map.js", "ui.js", "storage.js",
          "translations.js", "style.css"}


@app.get("/{asset}", include_in_schema=False)
def asset_file(asset: str):
    if asset not in ASSETS:
        raise HTTPException(404, "Not found")
    # Revalidate our unbundled app code after updates. This does not affect OSM's
    # image requests, which go directly from the browser to the tile server.
    return FileResponse(ROOT / asset, headers={"Cache-Control": "no-cache"})
