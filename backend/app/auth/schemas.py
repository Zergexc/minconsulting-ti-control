from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: Optional[str] = None


class UserMe(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str

    model_config = {"from_attributes": True}
