from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_tecnico_o_admin
from app.models.maintenance import Mantenimiento
from app.models.activo import Activo
from app.schemas.maintenance import MantenimientoCreate, MantenimientoUpdate, MantenimientoRead

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=list[MantenimientoRead])
def list_maintenance(
    activo_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Mantenimiento)
    if activo_id:
        q = q.filter(Mantenimiento.activo_id == activo_id)
    return q.order_by(Mantenimiento.fecha.desc()).all()


@router.post("/", response_model=MantenimientoRead, status_code=201)
def create_maintenance(
    data: MantenimientoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    if not db.query(Activo).filter(Activo.id == data.activo_id, Activo.is_active == True).first():
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    mant = Mantenimiento(**data.model_dump())
    db.add(mant)
    db.commit()
    db.refresh(mant)
    return mant


@router.patch("/{mant_id}", response_model=MantenimientoRead)
def update_maintenance(
    mant_id: int,
    data: MantenimientoUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    mant = db.query(Mantenimiento).filter(Mantenimiento.id == mant_id).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(mant, field, value)
    db.commit()
    db.refresh(mant)
    return mant


@router.delete("/{mant_id}", status_code=204)
def delete_maintenance(
    mant_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    mant = db.query(Mantenimiento).filter(Mantenimiento.id == mant_id).first()
    if not mant:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    db.delete(mant)
    db.commit()
