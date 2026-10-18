import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://bhandaaro:local-development-only@127.0.0.1:5433/bhandaaro")
    allowed_origins: tuple = tuple(os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(","))
    cookie_secure: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    cookie_name: str = "bhandaaro_session"


settings = Settings()
