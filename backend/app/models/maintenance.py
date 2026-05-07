from sqlalchemy import Column, Integer, String, DateTime, Date, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Valores válidos para tipo_mantenimiento: preventivo, correctivo, limpieza, actualizacion, otro


class Mantenimiento(Base):
    __tablename__ = "mantenimientos"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo_mantenimiento = Column(String(20), nullable=False, default="preventivo")
    descripcion = Column(Text, nullable=True)
    tecnico = Column(String(200), nullable=True)
    costo = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    activo = relationship("Activo", back_populates="mantenimientos")
