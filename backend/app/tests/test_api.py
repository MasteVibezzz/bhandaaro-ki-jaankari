from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta, datetime
from zoneinfo import ZoneInfo
from sqlalchemy import select, func
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import User, Session, Review, Checkin, Activity, Location, now
from backend.app.seed import seed

LOCATION = {"name": "Test kitchen", "address": "Test address", "description": "A community kitchen",
            "lat": 18.52, "lng": 73.85, "type": "daily", "days": ["Monday"], "timings": "12–2"}


def test_one_time_schedule_lifecycle_and_archive(client, account, monkeypatch):
    from backend.app.services import locations as service
    start = (now() + timedelta(days=2)).astimezone(ZoneInfo("Asia/Kolkata")).replace(hour=22, minute=0, second=0, microsecond=0)
    end = start + timedelta(hours=3)
    payload = {**LOCATION, "schedule_kind": "one_time", "days": [], "timings": "",
               "starts_at": start.isoformat(), "ends_at": end.isoformat()}
    response = client.post('/api/locations', json=payload, headers={"Idempotency-Key": "event"})
    assert response.status_code == 201, response.text
    event = response.json()
    assert event['eventStatus'] == 'upcoming' and not event['todayOpen']
    event_id = event['id']
    assert client.post(f'/api/locations/{event_id}/checkins', json={"rating": 5}, headers={"Idempotency-Key": "early"}).status_code == 409
    with SessionLocal() as db:
        location = db.get(Location, event_id)
        assert service.event_status(location, start - timedelta(microseconds=1)) == 'upcoming'
        assert service.event_status(location, start) == 'serving'
        assert service.event_status(location, end - timedelta(microseconds=1)) == 'serving'
        assert service.event_status(location, end) == 'ended'
    real_datetime = datetime
    class FrozenDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return end.astimezone(tz) if tz else end.replace(tzinfo=None)
    monkeypatch.setattr(service, 'datetime', FrozenDatetime)
    assert event_id not in [item['id'] for item in client.get('/api/locations').json()]
    archive = client.get('/api/locations?include_ended=true').json()
    assert next(item for item in archive if item['id'] == event_id)['eventStatus'] == 'ended'
    assert client.get(f'/api/locations/{event_id}').json()['eventStatus'] == 'ended'
    assert client.get('/api/stats').json()['activeToday'] == 6
    assert client.post(f'/api/locations/{event_id}/checkins', json={"rating": 5}, headers={"Idempotency-Key": "late"}).status_code == 409
    monkeypatch.setattr(service, 'datetime', real_datetime)
    # A later event at the same venue remains a separate contribution.
    later = {**payload, "starts_at": (start + timedelta(days=1)).isoformat(), "ends_at": (end + timedelta(days=1)).isoformat()}
    assert client.post('/api/locations', json=later, headers={"Idempotency-Key": "later"}).status_code == 201
    for invalid in [
        {**payload, "ends_at": start.isoformat()},
        {**payload, "ends_at": (start - timedelta(hours=1)).isoformat()},
        {**payload, "starts_at": start.replace(tzinfo=None).isoformat()},
        {**payload, "ends_at": None},
        {**payload, "starts_at": (now() - timedelta(hours=2)).isoformat(), "ends_at": (now() - timedelta(hours=1)).isoformat()},
        {**LOCATION, "days": []},
    ]:
        assert client.post('/api/locations', json=invalid, headers={"Idempotency-Key": "invalid"}).status_code == 422


def test_health_readiness_seed_repeat_filters(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/health/ready").status_code == 200
    with SessionLocal() as db:
        seed(db)
        assert db.scalar(select(func.count()).select_from(Review)) == 40
        assert db.scalar(select(func.count()).select_from(Activity)) == 5
    locations = client.get("/api/locations").json()
    assert len(locations) == 10
    assert locations[0]["rating"] == 4.7
    assert locations[0]["isDemo"]
    assert locations[0]["reviews"][0]["comment"] == "Delicious modak prasadam"
    assert len(client.get("/api/locations?search=KOREGAON").json()) == 1
    assert len(client.get("/api/locations?type=daily&status=open").json()) == 3
    assert client.get("/api/locations?search=%25").json() == []
    assert client.get("/api/locations/99999").status_code == 404
    assert client.get("/api/locations?type=bad").status_code == 422
    stats = client.get("/api/stats").json()
    assert stats["totalCheckins"] == 20006
    assert stats["checkinsToday"] == 447


def test_map_referrer_policy_does_not_disable_cross_origin_identification(client):
    response = client.get("/")
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert '<meta name="referrer" content="strict-origin-when-cross-origin">' in response.text
    # Revalidate app assets, while external tiles keep their own browser cache.
    assert response.headers["cache-control"] == "no-cache"
    assert "no-cache" not in response.headers.get("pragma", "")
    assert client.get("/map.js").headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert client.get("/map.js").headers["cache-control"] == "no-cache"
    # Sensitive API responses remain uncached independently of public map tiles.
    assert client.get("/api/locations").headers["cache-control"] == "no-store"


def test_real_auth_cookie_hashing_logout_expiration(client, account):
    cookie = client.cookies.get("bhandaaro_session")
    assert cookie
    assert client.get("/api/auth/me").json()["id"] == account["id"]
    with SessionLocal() as db:
        user = db.get(User, account["id"])
        assert user.password_hash.startswith("$argon2id$")
        assert db.scalar(select(Session)).token_hash != cookie
    assert client.post("/api/auth/register", json={"name": "Duplicate", "email": "TESTER@example.com", "password": "test-password-123"}).status_code == 409
    assert client.post("/api/auth/logout", json={}).status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.set("bhandaaro_session", cookie)
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.clear()
    bad = client.post("/api/auth/login", json={"email": "tester@example.com", "password": "incorrect"})
    assert bad.status_code == 401
    login = client.post("/api/auth/login", json={"email": "tester@example.com", "password": "test-password-123", "remember": True})
    assert login.status_code == 200
    header = login.headers["set-cookie"].lower()
    assert "httponly" in header and "samesite=strict" in header and "max-age=2592000" in header
    with SessionLocal() as db:
        for session in db.scalars(select(Session)):
            session.expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_csrf_validation_and_unauthorized_writes(client):
    assert client.post("/api/locations", json=LOCATION, headers={"Idempotency-Key": "x"}).status_code == 401
    assert client.post("/api/auth/register", json={}, headers={"Origin": "https://evil.example"}).status_code == 403
    client.headers.pop("Origin")
    assert client.post("/api/auth/login", json={}).status_code == 403
    assert client.get("/.env").status_code == 404
    assert client.get("/backend/demo-data.json").status_code == 404


def test_location_idempotency_and_validation(client, account):
    invalid = client.post("/api/locations", json={**LOCATION, "lat": 91}, headers={"Idempotency-Key": "invalid"})
    assert invalid.status_code == 422
    assert invalid.json()["error"]["fields"]
    assert client.post("/api/locations", json=LOCATION).status_code == 422
    assert client.post("/api/locations", json={**LOCATION, "owner_id": 123},
                       headers={"Idempotency-Key": "forged"}).status_code == 422
    headers = {"Idempotency-Key": "location-1"}
    first = client.post("/api/locations", json=LOCATION, headers=headers)
    repeat = client.post("/api/locations", json=LOCATION, headers=headers)
    assert first.status_code == repeat.status_code == 201
    assert first.json() == repeat.json()
    assert first.json()["id"] > 10
    assert len(client.get("/api/locations").json()) == 11
    assert client.post("/api/locations", json={**LOCATION, "name": "Changed"}, headers=headers).status_code == 409
    assert client.post("/api/locations", json=LOCATION, headers={"Idempotency-Key": "different"}).status_code == 409
    assert client.get("/api/activity").json()[0]["type"] == "addition"


def test_today_counts_rollover_preserves_historical_totals(client, monkeypatch):
    from backend.app.services import locations as service
    current = service.today()
    monkeypatch.setattr(service, "today", lambda: current + timedelta(days=1))
    stats = client.get("/api/stats").json()
    assert stats["totalCheckins"] == 20006
    assert stats["checkinsToday"] == 0


def test_rate_limit_and_database_readiness_failure(client):
    import time
    from sqlalchemy.exc import OperationalError
    from backend.app.main import rate_buckets
    from backend.app.database import get_db
    rate_buckets[("testclient", "auth")] = (int(time.monotonic() // 60), 30)
    assert client.post("/api/auth/login", json={}).status_code == 429
    def unavailable():
        raise OperationalError("database unavailable", {}, Exception())
        yield
    app.dependency_overrides[get_db] = unavailable
    try:
        assert client.get("/health").status_code == 200
        response = client.get("/health/ready")
        assert response.status_code == 503
        assert "Database is temporarily unavailable" in response.text
    finally:
        app.dependency_overrides.clear()
def test_checkin_review_atomicity_and_stats(client, account):
    before = client.get("/api/stats").json()
    headers = {"Idempotency-Key": "checkin-1"}
    body = {"rating": 5, "comment": "Wonderful"}
    first = client.post("/api/locations/1/checkins", json=body, headers=headers)
    assert first.status_code == 201, first.text
    assert client.post("/api/locations/1/checkins", json=body, headers=headers).json() == first.json()
    assert first.json()["rating"] == 4.8
    assert client.get("/api/stats").json()["totalCheckins"] == before["totalCheckins"] + 1
    duplicate = client.post("/api/locations/1/checkins", json=body, headers={"Idempotency-Key": "checkin-2"})
    assert duplicate.status_code == 409
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Checkin)) == 1
        assert db.scalar(select(func.count()).select_from(Review)) == 41
        assert db.scalar(select(func.count()).select_from(Activity)) == 6
    assert client.post("/api/locations/2/reviews", json={"rating": 0}, headers={"Idempotency-Key": "invalid"}).status_code == 422
    assert client.post("/api/locations/2/reviews", json=body, headers={"Idempotency-Key": "review-1"}).status_code == 201
    assert client.get("/api/stats").json()["totalCheckins"] == before["totalCheckins"] + 1
    assert client.post("/api/locations/99999/checkins", json=body, headers={"Idempotency-Key": "missing"}).status_code == 404


def test_concurrent_retries_write_once(client, account):
    cookie = client.cookies.get("bhandaaro_session")
    def write(_):
        with TestClient(app) as other:
            other.cookies.set("bhandaaro_session", cookie)
            return other.post("/api/locations", json=LOCATION,
                              headers={"Origin": "http://localhost:8000", "Idempotency-Key": "race"})
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(write, range(2)))
    assert [response.status_code for response in results] == [201, 201]
    assert results[0].json() == results[1].json()
    assert len(client.get("/api/locations").json()) == 11
