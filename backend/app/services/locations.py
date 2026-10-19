from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy import select, func
from ..models import Location, Review, Checkin, Activity


def today():
    return datetime.now(ZoneInfo("Asia/Kolkata")).date()


def identity(name, lat, lng):
    return f"{' '.join(name.lower().split())}|{lat:.6f}|{lng:.6f}"


def event_status(location, at=None):
    if location.schedule_kind != "one_time":
        return None
    at = at or datetime.now(timezone.utc)
    return "upcoming" if at < location.starts_at else "serving" if at < location.ends_at else "ended"


def serialize_location(db, location):
    status = event_status(location)
    reviews = db.scalars(select(Review).where(Review.location_id == location.id).order_by(Review.id)).all()
    total = db.scalar(select(func.count()).select_from(Checkin).where(Checkin.location_id == location.id))
    daily = db.scalar(select(func.count()).select_from(Checkin).where(Checkin.location_id == location.id, Checkin.day == today()))
    rating = round(sum(review.rating for review in reviews) / len(reviews), 1) if reviews else 0
    return {
        "id": location.id, "name": location.name, "address": location.address,
        "description": location.description, "lat": location.lat, "lng": location.lng,
        "type": location.type, "days": location.days, "timings": location.timings,
        "scheduleKind": location.schedule_kind,
        "startsAt": location.starts_at.isoformat() if location.starts_at else None,
        "endsAt": location.ends_at.isoformat() if location.ends_at else None,
        "eventStatus": status,
        "active": location.active, "todayOpen": status == "serving" if status else location.today_open, "isDemo": location.is_demo,
        "rating": rating, "totalCheckins": location.seed_total + total,
        "checkinsToday": daily + (location.seed_today if location.seed_day == today() else 0),
        "reviews": [{"id": r.id, "user": r.author, "rating": r.rating, "comment": r.comment,
                     "time": r.created_at.isoformat(), "isDemo": r.is_demo} for r in reviews],
    }


def serialize_activity(activity):
    return {"id": activity.id, "type": activity.type, "user": activity.actor,
            "location": activity.location_name, "time": activity.display_time or activity.created_at.isoformat(),
            "feedback": activity.comment, "isDemo": activity.is_demo}


def record_activity(db, user, location, kind, comment=""):
    db.add(Activity(user_id=user.id, location_id=location.id, type=kind,
                    actor=user.name, location_name=location.name, comment=comment))
