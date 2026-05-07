from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_tecnico_o_admin
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeRead

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/", response_model=list[EmployeeRead])
def list_employees(
    search: str | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Employee).filter(Employee.is_active == True)
    if search:
        q = q.filter(Employee.full_name.ilike(f"%{search}%"))
    if department:
        q = q.filter(Employee.department == department)
    return q.order_by(Employee.full_name).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return emp


@router.post("/", response_model=EmployeeRead, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db), _=Depends(require_tecnico_o_admin)):
    if data.email and db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    emp = Employee(**data.model_dump())
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
    for field, value in data.model_dump(exclude_none=True).items():
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
