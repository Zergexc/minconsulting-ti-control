from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

TIPOS_MANTENIMIENTO = Literal["preventivo", "correctivo", "limpieza", "actualizacion", "otro"]


class MantenimientoCreate(BaseModel):
    activo_id: int
    fecha: date
    tipo_mantenimiento: TIPOS_MANTENIMIENTO = "preventivo"
    descripcion: Optional[str] = None
    tecnico: Optional[str] = None
    costo: Optional[float] = None


class MantenimientoUpdate(BaseModel):
    fecha: Optional[date] = None
    tipo_mantenimiento: Optional[TIPOS_MANTENIMIENTO] = None
    descripcion: Optional[str] = None
    tecnico: Optional[str] = None
    costo: Optional[float] = None


class MantenimientoRead(BaseModel):
    id: int
    activo_id: int
    fecha: date
    tipo_mantenimiento: str
    descripcion: Optional[str]
    tecnico: Optional[str]
    costo: Optional[float]

    model_config = {"from_attributes": True}
