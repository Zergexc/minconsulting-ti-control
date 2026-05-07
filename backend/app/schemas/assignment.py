from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.schemas.activo import ActivoRead
from app.schemas.employee import EmployeeRead


class AsignacionCreate(BaseModel):
    activo_id: int
    employee_id: int
    fecha_asignacion: date
    notas: Optional[str] = None


class AsignacionDevolucion(BaseModel):
    fecha_devolucion: date
    notas: Optional[str] = None


class AsignacionRead(BaseModel):
    id: int
    activo_id: int
    employee_id: int
    fecha_asignacion: date
    fecha_devolucion: Optional[date]
    notas: Optional[str]
    is_active: bool
    activo: Optional[ActivoRead] = None
    employee: Optional[EmployeeRead] = None

    model_config = {"from_attributes": True}
