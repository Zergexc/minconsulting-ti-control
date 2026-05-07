from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.auth.router import router as auth_router
from app.routers import users, employees, activos, assignments, maintenance, dashboard

# Importar todos los modelos para que Base los registre antes de create_all
import app.models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Gestión TI - Minconsulting",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api/v1"
app.include_router(auth_router, prefix=API)
app.include_router(users.router, prefix=API)
app.include_router(employees.router, prefix=API)
app.include_router(activos.router, prefix=API)
app.include_router(assignments.router, prefix=API)
app.include_router(maintenance.router, prefix=API)
app.include_router(dashboard.router, prefix=API)


@app.get("/")
def root():
    return {"message": "Sistema Gestión TI - Minconsulting API v1.0"}
