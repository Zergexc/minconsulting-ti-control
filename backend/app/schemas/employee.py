from pydantic import BaseModel
from typing import Optional
from datetime import date


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeRead(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    full_name: str
    department: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    position: Optional[str]
    hire_date: Optional[date]
    notes: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}
