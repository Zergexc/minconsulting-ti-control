from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.activo import Activo
from app.models.employee import Employee
from app.models.assignment import Asignacion

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_activos = db.query(Activo).filter(Activo.is_active == True).count()
    activos_disponibles = db.query(Activo).filter(Activo.is_active == True, Activo.estado == "disponible").count()
    activos_asignados = db.query(Activo).filter(Activo.is_active == True, Activo.estado == "asignado").count()
    activos_mantenimiento = db.query(Activo).filter(Activo.is_active == True, Activo.estado == "mantenimiento").count()
    total_empleados = db.query(Employee).filter(Employee.is_active == True).count()
    asignaciones_activas = db.query(Asignacion).filter(Asignacion.is_active == True).count()

    tipos: dict[str, int] = {}
    for activo in db.query(Activo).filter(Activo.is_active == True).all():
        tipos[activo.tipo] = tipos.get(activo.tipo, 0) + 1

    return {
        "total_activos": total_activos,
        "activos_disponibles": activos_disponibles,
        "activos_asignados": activos_asignados,
        "activos_mantenimiento": activos_mantenimiento,
        "total_empleados": total_empleados,
        "asignaciones_activas": asignaciones_activas,
        "activos_por_tipo": tipos,
    }
