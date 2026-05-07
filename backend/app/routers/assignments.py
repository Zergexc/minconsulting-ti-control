from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.dependencies import get_db, get_current_user, require_tecnico_o_admin
from app.models.assignment import Asignacion
from app.models.activo import Activo
from app.schemas.assignment import AsignacionCreate, AsignacionDevolucion, AsignacionRead

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("/", response_model=list[AsignacionRead])
def list_assignments(
    activo_id: int | None = Query(None),
    employee_id: int | None = Query(None),
    activas: bool = Query(True),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = (
        db.query(Asignacion)
        .options(joinedload(Asignacion.activo), joinedload(Asignacion.employee))
        .filter(Asignacion.is_active == activas)
    )
    if activo_id:
        q = q.filter(Asignacion.activo_id == activo_id)
    if employee_id:
        q = q.filter(Asignacion.employee_id == employee_id)
    return q.order_by(Asignacion.fecha_asignacion.desc()).all()


@router.post("/", response_model=AsignacionRead, status_code=201)
def create_assignment(data: AsignacionCreate, db: Session = Depends(get_db), _=Depends(require_tecnico_o_admin)):
    activo = db.query(Activo).filter(Activo.id == data.activo_id, Activo.is_active == True).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    if activo.estado == "prestado":
        raise HTTPException(status_code=400, detail="El activo ya está prestado/asignado")

    asignacion = Asignacion(**data.model_dump())
    activo.estado = "prestado"
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return asignacion


@router.post("/{assignment_id}/devolucion", response_model=AsignacionRead)
def return_assignment(
    assignment_id: int,
    data: AsignacionDevolucion,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    asignacion = db.query(Asignacion).filter(Asignacion.id == assignment_id, Asignacion.is_active == True).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada o ya devuelta")
    asignacion.fecha_devolucion = data.fecha_devolucion
    asignacion.notas = data.notas or asignacion.notas
    asignacion.is_active = False
    asignacion.activo.estado = "operativo"
    db.commit()
    db.refresh(asignacion)
    return asignacion
