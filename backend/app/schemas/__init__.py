from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Register(Input):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    # Passwords are opaque: override Input's whitespace stripping.
    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def valid_name(cls, value):
        if not value.strip():
            raise ValueError("Name is required")
        return value.strip()


class Login(Input):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False
    model_config = ConfigDict(extra="forbid")


class LocationCreate(Input):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=5000)
    lat: float = Field(ge=-90, le=90, allow_inf_nan=False)
    lng: float = Field(ge=-180, le=180, allow_inf_nan=False)
    type: Literal["daily", "regular", "festival"]
    days: list[str] = Field(min_length=1, max_length=7)
    timings: str = Field(min_length=1, max_length=200)

    @field_validator("days")
    @classmethod
    def valid_days(cls, value):
        allowed = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
        if any(day not in allowed for day in value) or len(set(value)) != len(value):
            raise ValueError("Choose unique valid weekdays")
        return value


class ReviewCreate(Input):
    rating: int = Field(ge=1, le=5, strict=True)
    comment: str = Field(default="Great experience!", max_length=3000)
