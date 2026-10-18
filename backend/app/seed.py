"""Explicit development-only seeding: python -m backend.app.seed."""
import json
from pathlib import Path
from sqlalchemy import select, text
from .database import SessionLocal
from .models import Location, Review, Activity
from .services.locations import identity, today


def seed(db):
    data = json.loads((Path(__file__).resolve().parents[1] / "demo-data.json").read_text())
    # The fixed IDs belong only to the initial demo dataset. Never overwrite user data.
    for item in data["bhandaaras"]:
        if db.get(Location, item["id"]):
            continue
        db.add(Location(id=item["id"], name=item["name"], address=item["address"],
                        lat=item["lat"], lng=item["lng"], type=item["type"], days=item["days"],
                        timings=item["timings"], description=item["description"], active=item["active"],
                        today_open=item["todayOpen"], seed_total=item["totalCheckins"],
                        seed_today=item["checkinsToday"], seed_day=today(), is_demo=True,
                        identity_key=identity(item["name"], item["lat"], item["lng"])))
        db.flush()
        for comment in item["reviews"]:
            db.add(Review(location_id=item["id"], author="Demonstration review",
                          rating=item["rating"], comment=comment, is_demo=True))
    if not db.scalar(select(Activity.id).where(Activity.is_demo.is_(True)).limit(1)):
        for item in reversed(data["recentActivity"]):
            db.add(Activity(type=item["type"], actor=item["user"], location_name=item["location"],
                            display_time=item["time"], comment=item.get("feedback", item.get("comment", "")), is_demo=True))
    db.flush()
    # Explicit seed IDs must not collide with PostgreSQL's next generated location ID.
    db.execute(text("SELECT setval(pg_get_serial_sequence('locations', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM locations), 0), 10))"))
    db.commit()


if __name__ == "__main__":
    with SessionLocal() as db:
        seed(db)
    print("Demo seed complete (repeatable).")
