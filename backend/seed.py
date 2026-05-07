"""
Crea el usuario admin inicial.
Ejecutar una sola vez: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
import app.models  # noqa: registra todos los modelos
from app.models.user import User
from app.auth.service import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(User).filter(User.username == "admin").first():
    print("El usuario admin ya existe.")
    db.close()
    sys.exit(0)

admin = User(
    username="admin",
    full_name="Administrador TI",
    hashed_password=hash_password("admin123"),
    role="admin",
)
db.add(admin)
db.commit()
print("Usuario admin creado. Username: admin / Password: admin123")
print("IMPORTANTE: Cambia la contraseña después del primer login.")
db.close()
