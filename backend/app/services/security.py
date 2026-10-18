import hashlib
import secrets
from datetime import timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHashError
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession
from ..config import settings
from ..database import get_db
from ..models import User, Session, now

hasher = PasswordHasher()
DUMMY_HASH = hasher.hash("not-a-real-user-password")


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def verify_password(stored, password):
    try:
        return hasher.verify(stored, password)
    except (VerificationError, InvalidHashError):
        return False


def session_user(request: Request, db: DBSession = Depends(get_db)):
    token = request.cookies.get(settings.cookie_name, "")
    session = db.get(Session, digest(token))
    if not session or session.expires_at <= now():
        raise HTTPException(401, "Please sign in")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Please sign in")
    return user


def public_user(user):
    return {"id": user.id, "name": user.name, "email": user.email}


def create_session(db, user, response: Response, remember=False):
    token = secrets.token_urlsafe(32)
    duration = 30 * 86400 if remember else 86400
    db.add(Session(token_hash=digest(token), user_id=user.id, expires_at=now() + timedelta(seconds=duration)))
    response.set_cookie(settings.cookie_name, token, max_age=duration if remember else None,
                        httponly=True, secure=settings.cookie_secure, samesite="strict", path="/")
