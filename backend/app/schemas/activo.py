from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

TIPOS_ACTIVO = Literal["laptop", "pc", "workstation", "monitor", "nas", "celular", "impresora", "otro"]
ESTADOS_ACTIVO = Literal["operativo", "mantenimiento", "reparar", "dañado", "descartado", "prestado", "retirado"]


class EquipoDetalleCreate(BaseModel):
    hostname: Optional[str] = None
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
    codigo_patrimonial: Optional[str] = None
    tipo: TIPOS_ACTIVO
    nombre: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    estado: ESTADOS_ACTIVO = "operativo"
    ubicacion: Optional[str] = None
    fecha_compra: Optional[date] = None
    fecha_garantia: Optional[date] = None
    notas: Optional[str] = None
    equipo_detalle: Optional[EquipoDetalleCreate] = None
    periferico_detalle: Optional[PerifericoDetalleCreate] = None
    nas_detalle: Optional[NasDetalleCreate] = None


class ActivoUpdate(BaseModel):
    codigo_patrimonial: Optional[str] = None
    tipo: Optional[TIPOS_ACTIVO] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    estado: Optional[ESTADOS_ACTIVO] = None
    ubicacion: Optional[str] = None
    fecha_compra: Optional[date] = None
    fecha_garantia: Optional[date] = None
    notas: Optional[str] = None
    is_active: Optional[bool] = None
    equipo_detalle: Optional[EquipoDetalleCreate] = None


class ActivoRead(BaseModel):
    id: int
    codigo_patrimonial: Optional[str]
    tipo: str
    nombre: Optional[str]
    marca: Optional[str]
    modelo: Optional[str]
    serial: Optional[str]
    estado: str
    ubicacion: Optional[str]
    fecha_compra: Optional[date]
    fecha_garantia: Optional[date]
    notas: Optional[str]
    is_active: bool
    equipo_detalle: Optional[EquipoDetalleRead] = None
    periferico_detalle: Optional[PerifericoDetalleRead] = None
    nas_detalle: Optional[NasDetalleRead] = None

    model_config = {"from_attributes": True}
