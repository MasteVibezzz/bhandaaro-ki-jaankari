import hashlib
import json
from typing import Optional, Literal
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Location, Review, Checkin, Activity, WriteRequest
from ..schemas import LocationCreate, ReviewCreate
from ..services.security import session_user
from ..services.locations import identity, serialize_location, serialize_activity, record_activity, today

router = APIRouter(prefix="/api", tags=["community"])


def get_location(db, location_id):
    location = db.get(Location, location_id)
    if not location:
        raise HTTPException(404, "Location not found")
    return location


def idempotent_write(db, user, key, operation, payload, action):
    if not key or len(key) > 100:
        raise HTTPException(422, "Provide an Idempotency-Key of 1–100 characters")
    body_digest = hashlib.sha256(json.dumps([operation, payload], sort_keys=True).encode()).hexdigest()
    # Serializes concurrent retries without relying on a process-local lock.
    lock = int.from_bytes(hashlib.sha256(f"{user.id}:{key}".encode()).digest()[:8], "big", signed=True)
    db.execute(text("SELECT pg_advisory_xact_lock(:lock)"), {"lock": lock})
    previous = db.scalar(select(WriteRequest).where(WriteRequest.user_id == user.id, WriteRequest.key == key))
    if previous:
        if previous.digest != body_digest:
            raise HTTPException(409, "This request key was already used for different content")
        return previous.result
    try:
        result = action()
        db.add(WriteRequest(user_id=user.id, key=key, digest=body_digest, result=result))
        db.commit()
        return result
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This location or today's check-in already exists")


@router.get("/locations")
def list_locations(search: str = "", type: Optional[Literal["daily", "regular", "festival"]] = None,
                   status: Optional[Literal["open", "closed"]] = None, db: Session = Depends(get_db)):
    query = select(Location).order_by(Location.id)
    if search:
        # Escape SQL wildcard characters so this behaves like frontend substring search.
        term = "%" + search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        query = query.where(Location.name.ilike(term, escape="\\") | Location.address.ilike(term, escape="\\"))
    if type:
        query = query.where(Location.type == type)
    if status:
        query = query.where(Location.today_open == (status == "open"))
    return [serialize_location(db, location) for location in db.scalars(query)]


@router.get("/locations/{location_id}")
def location_details(location_id: int, db: Session = Depends(get_db)):
    return serialize_location(db, get_location(db, location_id))


@router.post("/locations", status_code=201)
def add_location(body: LocationCreate, db: Session = Depends(get_db),
                 user: User = Depends(session_user), idempotency_key: Optional[str] = Header(None)):
    def action():
        location = Location(**body.model_dump(), owner_id=user.id,
                            identity_key=identity(body.name, body.lat, body.lng))
        db.add(location)
        db.flush()
        record_activity(db, user, location, "addition")
        return serialize_location(db, location)
    return idempotent_write(db, user, idempotency_key, "location", body.model_dump(), action)


def submit_review(db, user, location, body):
    db.add(Review(location_id=location.id, user_id=user.id, author=user.name,
                  rating=body.rating, comment=body.comment))


@router.post("/locations/{location_id}/checkins", status_code=201)
def checkin(location_id: int, body: ReviewCreate, db: Session = Depends(get_db),
            user: User = Depends(session_user), idempotency_key: Optional[str] = Header(None)):
    def action():
        location = get_location(db, location_id)
        db.add(Checkin(user_id=user.id, location_id=location.id, day=today()))
        submit_review(db, user, location, body)
        record_activity(db, user, location, "checkin", body.comment)
        db.flush()
        return serialize_location(db, location)
    return idempotent_write(db, user, idempotency_key, f"checkin:{location_id}", body.model_dump(), action)


@router.post("/locations/{location_id}/reviews", status_code=201)
def review(location_id: int, body: ReviewCreate, db: Session = Depends(get_db),
           user: User = Depends(session_user), idempotency_key: Optional[str] = Header(None)):
    def action():
        location = get_location(db, location_id)
        submit_review(db, user, location, body)
        record_activity(db, user, location, "review", body.comment)
        db.flush()
        return serialize_location(db, location)
    return idempotent_write(db, user, idempotency_key, f"review:{location_id}", body.model_dump(), action)


@router.get("/activity")
def activity(db: Session = Depends(get_db)):
    return [serialize_activity(item) for item in db.scalars(select(Activity).order_by(Activity.id.desc()).limit(20))]


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    locations = [serialize_location(db, location) for location in db.scalars(select(Location))]
    return {"totalLocations": len(locations), "activeToday": sum(item["todayOpen"] for item in locations),
            "totalCheckins": sum(item["totalCheckins"] for item in locations),
            "checkinsToday": sum(item["checkinsToday"] for item in locations)}
