from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.dependencies import get_db, get_current_user, require_tecnico_o_admin
from app.models.activo import Activo, EquipoDetalle, PerifericoDetalle, NasDetalle
from app.schemas.activo import ActivoCreate, ActivoUpdate, ActivoRead

router = APIRouter(prefix="/activos", tags=["activos"])


@router.get("/", response_model=list[ActivoRead])
def list_activos(
    tipo: str | None = Query(None),
    estado: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = (
        db.query(Activo)
        .options(
            joinedload(Activo.equipo_detalle),
            joinedload(Activo.periferico_detalle),
            joinedload(Activo.nas_detalle),
        )
        .filter(Activo.is_active == True)
    )
    if tipo:
        q = q.filter(Activo.tipo == tipo)
    if estado:
        q = q.filter(Activo.estado == estado)
    if search:
        q = q.filter(
            Activo.nombre.ilike(f"%{search}%")
            | Activo.marca.ilike(f"%{search}%")
            | Activo.modelo.ilike(f"%{search}%")
            | Activo.serial.ilike(f"%{search}%")
        )
    return q.order_by(Activo.nombre).all()


@router.get("/{activo_id}", response_model=ActivoRead)
def get_activo(activo_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    activo = (
        db.query(Activo)
        .options(
            joinedload(Activo.equipo_detalle),
            joinedload(Activo.periferico_detalle),
            joinedload(Activo.nas_detalle),
        )
        .filter(Activo.id == activo_id, Activo.is_active == True)
        .first()
    )
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return activo


@router.post("/", response_model=ActivoRead, status_code=201)
def create_activo(data: ActivoCreate, db: Session = Depends(get_db), _=Depends(require_tecnico_o_admin)):
    if data.serial and db.query(Activo).filter(Activo.serial == data.serial).first():
        raise HTTPException(status_code=400, detail="El serial ya está registrado")

    activo_data = data.model_dump(exclude={"equipo_detalle", "periferico_detalle", "nas_detalle"})
    activo = Activo(**activo_data)
    db.add(activo)
    db.flush()

    if data.equipo_detalle:
        db.add(EquipoDetalle(activo_id=activo.id, **data.equipo_detalle.model_dump()))
    if data.periferico_detalle:
        db.add(PerifericoDetalle(activo_id=activo.id, **data.periferico_detalle.model_dump()))
    if data.nas_detalle:
        db.add(NasDetalle(activo_id=activo.id, **data.nas_detalle.model_dump()))

    db.commit()
    db.refresh(activo)
    return activo


@router.patch("/{activo_id}", response_model=ActivoRead)
def update_activo(
    activo_id: int,
    data: ActivoUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(activo, field, value)
    db.commit()
    db.refresh(activo)
    return activo


@router.delete("/{activo_id}", status_code=204)
def deactivate_activo(
    activo_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    activo.is_active = False
    db.commit()
