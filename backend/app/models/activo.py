from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Tipos: laptop, pc, workstation, monitor, nas, celular, impresora, otro
# Estados: operativo, mantenimiento, reparar, dañado, descartado, prestado, retirado


class Activo(Base):
    __tablename__ = "activos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_patrimonial = Column(String(100), unique=True, index=True, nullable=True)
    tipo = Column(String(20), nullable=False, index=True)
    nombre = Column(String(200), nullable=True)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    serial = Column(String(100), unique=True, index=True, nullable=True)
    estado = Column(String(20), default="operativo", nullable=False, index=True)
    ubicacion = Column(String(200), nullable=True)
    fecha_compra = Column(Date, nullable=True)
    fecha_garantia = Column(Date, nullable=True)
    notas = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    equipo_detalle = relationship("EquipoDetalle", back_populates="activo", uselist=False)
    periferico_detalle = relationship("PerifericoDetalle", back_populates="activo", uselist=False)
    nas_detalle = relationship("NasDetalle", back_populates="activo", uselist=False)
    asignaciones = relationship("Asignacion", back_populates="activo")
    mantenimientos = relationship("Mantenimiento", back_populates="activo")


class EquipoDetalle(Base):
    """Detalle técnico para laptops, PCs y workstations."""

    __tablename__ = "equipos_detalle"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), unique=True, nullable=False)
    hostname = Column(String(100), nullable=True)
    procesador = Column(String(200), nullable=True)
    ram_gb = Column(Integer, nullable=True)
    almacenamiento = Column(String(200), nullable=True)
    sistema_operativo = Column(String(100), nullable=True)
    mac_address = Column(String(17), nullable=True)
    ip_address = Column(String(45), nullable=True)

    activo = relationship("Activo", back_populates="equipo_detalle")


class PerifericoDetalle(Base):
    """Detalle para periféricos."""

    __tablename__ = "perifericos_detalle"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), unique=True, nullable=False)
    tipo_periferico = Column(String(100), nullable=True)
    conexion = Column(String(50), nullable=True)

    activo = relationship("Activo", back_populates="periferico_detalle")


class NasDetalle(Base):
    """Detalle para dispositivos NAS."""

    __tablename__ = "nas_detalle"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), unique=True, nullable=False)
    ip_address = Column(String(45), nullable=True)
    mac_address = Column(String(17), nullable=True)
    capacidad_tb = Column(Float, nullable=True)
    modelo_nas = Column(String(100), nullable=True)

    activo = relationship("Activo", back_populates="nas_detalle")
