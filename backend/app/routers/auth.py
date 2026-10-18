from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DBSession
from ..database import get_db
from ..models import User, Session
from ..schemas import Register, Login
from ..config import settings
from ..services.security import hasher, DUMMY_HASH, verify_password, session_user, public_user, create_session, digest

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", status_code=201)
def register(body: Register, response: Response, db: DBSession = Depends(get_db)):
    user = User(email=str(body.email).lower().strip(), name=body.name, password_hash=hasher.hash(body.password))
    db.add(user)
    try:
        db.flush()
        create_session(db, user, response)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with this email already exists")
    return public_user(user)


@router.post("/login")
def login(body: Login, response: Response, db: DBSession = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(body.email).lower().strip()))
    valid = verify_password(user.password_hash if user else DUMMY_HASH, body.password)
    if not user or not valid:
        raise HTTPException(401, "Invalid email or password")
    create_session(db, user, response, body.remember)
    db.commit()
    return public_user(user)


@router.get("/me")
def me(user: User = Depends(session_user)):
    return public_user(user)


@router.post("/logout")
def logout(request: Request, response: Response, db: DBSession = Depends(get_db)):
    record = db.get(Session, digest(request.cookies.get(settings.cookie_name, "")))
    if record:
        db.delete(record)
    db.commit()
    response.delete_cookie(settings.cookie_name, path="/", secure=settings.cookie_secure, httponly=True, samesite="strict")
    return {"ok": True}
