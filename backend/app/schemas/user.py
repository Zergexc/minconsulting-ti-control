from pydantic import BaseModel
from typing import Literal

VALID_ROLES = Literal["admin", "tecnico", "solo_lectura"]


class UserCreate(BaseModel):
    username: str
    full_name: str | None = None
    password: str
    role: VALID_ROLES = "solo_lectura"


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: VALID_ROLES | None = None
    is_active: bool | None = None


class UserRead(BaseModel):
    id: int
    username: str
    full_name: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
