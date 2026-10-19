from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, Date, DateTime, ForeignKey, JSON, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Session(Base):
    __tablename__ = "sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (
        CheckConstraint("lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180", name="valid_coordinates"),
        CheckConstraint("type IN ('daily', 'regular', 'festival')", name="valid_type"),
        CheckConstraint("seed_total >= 0 AND seed_today >= 0", name="positive_seed_counts"),
        CheckConstraint("(schedule_kind = 'recurring' AND starts_at IS NULL AND ends_at IS NULL) OR (schedule_kind = 'one_time' AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)", name="valid_event_schedule"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    identity_key: Mapped[str] = mapped_column(String(400), unique=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    address: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String(20), index=True)
    days: Mapped[list] = mapped_column(JSON)
    timings: Mapped[str] = mapped_column(String(200))
    schedule_kind: Mapped[str] = mapped_column(String(20), default="recurring", server_default="recurring")
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    today_open: Mapped[bool] = mapped_column(Boolean, default=True)
    seed_total: Mapped[int] = mapped_column(Integer, default=0)
    seed_today: Mapped[int] = mapped_column(Integer, default=0)
    seed_day: Mapped[Optional[date]] = mapped_column(Date)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 0 AND 5", name="valid_rating"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)
    author: Mapped[str] = mapped_column(String(100))
    rating: Mapped[float] = mapped_column(Float)
    comment: Mapped[str] = mapped_column(Text)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Checkin(Base):
    __tablename__ = "checkins"
    __table_args__ = (UniqueConstraint("user_id", "location_id", "day", name="one_daily_checkin"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    day: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Activity(Base):
    __tablename__ = "activity"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    location_id: Mapped[Optional[int]] = mapped_column(ForeignKey("locations.id"))
    type: Mapped[str] = mapped_column(String(20))
    actor: Mapped[str] = mapped_column(String(100))
    location_name: Mapped[str] = mapped_column(String(200))
    comment: Mapped[str] = mapped_column(Text, default="")
    display_time: Mapped[Optional[str]] = mapped_column(String(100))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)


class WriteRequest(Base):
    __tablename__ = "write_requests"
    __table_args__ = (UniqueConstraint("user_id", "key", name="unique_user_request"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    key: Mapped[str] = mapped_column(String(100))
    digest: Mapped[str] = mapped_column(String(64))
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
