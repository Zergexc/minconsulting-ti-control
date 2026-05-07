from pydantic import BaseModel
from typing import Optional


class EmployeeCreate(BaseModel):
    full_name: str
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeRead(BaseModel):
    id: int
    full_name: str
    department: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    position: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}
