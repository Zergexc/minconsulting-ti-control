from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

TIPOS_ACTIVO = Literal["laptop", "pc", "workstation", "monitor", "celular", "nas", "periferico", "otro"]
ESTADOS_ACTIVO = Literal["disponible", "asignado", "mantenimiento", "baja", "almacen"]


class EquipoDetalleCreate(BaseModel):
    procesador: Optional[str] = None
    ram_gb: Optional[int] = None
    almacenamiento: Optional[str] = None
    sistema_operativo: Optional[str] = None
    mac_address: Optional[str] = None
    ip_address: Optional[str] = None


class EquipoDetalleRead(EquipoDetalleCreate):
    id: int
    model_config = {"from_attributes": True}


class PerifericoDetalleCreate(BaseModel):
    tipo_periferico: Optional[str] = None
    conexion: Optional[str] = None


class PerifericoDetalleRead(PerifericoDetalleCreate):
    id: int
    model_config = {"from_attributes": True}


class NasDetalleCreate(BaseModel):
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    capacidad_tb: Optional[float] = None
    modelo_nas: Optional[str] = None


class NasDetalleRead(NasDetalleCreate):
    id: int
    model_config = {"from_attributes": True}


class ActivoCreate(BaseModel):
    tipo: TIPOS_ACTIVO
    nombre: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    estado: ESTADOS_ACTIVO = "disponible"
    fecha_compra: Optional[date] = None
    notas: Optional[str] = None
    equipo_detalle: Optional[EquipoDetalleCreate] = None
    periferico_detalle: Optional[PerifericoDetalleCreate] = None
    nas_detalle: Optional[NasDetalleCreate] = None


class ActivoUpdate(BaseModel):
    tipo: Optional[TIPOS_ACTIVO] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    estado: Optional[ESTADOS_ACTIVO] = None
    fecha_compra: Optional[date] = None
    notas: Optional[str] = None
    is_active: Optional[bool] = None


class ActivoRead(BaseModel):
    id: int
    tipo: str
    nombre: Optional[str]
    marca: Optional[str]
    modelo: Optional[str]
    serial: Optional[str]
    estado: str
    fecha_compra: Optional[date]
    notas: Optional[str]
    is_active: bool
    equipo_detalle: Optional[EquipoDetalleRead] = None
    periferico_detalle: Optional[PerifericoDetalleRead] = None
    nas_detalle: Optional[NasDetalleRead] = None

    model_config = {"from_attributes": True}
