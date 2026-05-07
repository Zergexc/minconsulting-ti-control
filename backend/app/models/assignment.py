from sqlalchemy import Column, Integer, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Asignacion(Base):
    __tablename__ = "asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    fecha_asignacion = Column(Date, nullable=False)
    fecha_devolucion = Column(Date, nullable=True)
    notas = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    activo = relationship("Activo", back_populates="asignaciones")
    employee = relationship("Employee", back_populates="asignaciones")
