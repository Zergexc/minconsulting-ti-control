from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_tecnico_o_admin
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeRead

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/", response_model=list[EmployeeRead])
def list_employees(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Employee).filter(Employee.is_active == True)
    if search:
        term = f"%{search}%"
        q = q.filter(
            Employee.full_name.ilike(term)
            | Employee.first_name.ilike(term)
            | Employee.last_name.ilike(term)
            | Employee.email.ilike(term)
            | Employee.department.ilike(term)
            | Employee.position.ilike(term)
        )
    return q.order_by(Employee.full_name).all()


@router.get("/all", response_model=list[EmployeeRead])
def list_all_employees(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Lista todos los empleados incluyendo inactivos (para admin)."""
    return db.query(Employee).order_by(Employee.full_name).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp


@router.post("/", response_model=EmployeeRead, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db), _=Depends(require_tecnico_o_admin)):
    if data.email and db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    full_name = f"{data.first_name} {data.last_name}".strip()
    emp = Employee(
        first_name=data.first_name,
        last_name=data.last_name,
        full_name=full_name,
        email=data.email,
        department=data.department,
        position=data.position,
        phone=data.phone,
        hire_date=data.hire_date,
        notes=data.notes,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    updates = data.model_dump(exclude_none=True)

    # Recalcular full_name si cambia nombre o apellido
    new_first = updates.get("first_name", emp.first_name)
    new_last = updates.get("last_name", emp.last_name)
    if "first_name" in updates or "last_name" in updates:
        updates["full_name"] = f"{new_first or ''} {new_last or ''}".strip()

    for field, value in updates.items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=204)
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_tecnico_o_admin),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    emp.is_active = False
    db.commit()
