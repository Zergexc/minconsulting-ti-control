# Sistema Central de Gestión TI — Minconsulting

Sistema web interno para gestión de activos TI, empleados, asignaciones y mantenimientos.

---

## Requisitos

- Python 3.11+
- Node.js 20+

---

## Ejecución local (sin Docker)

### 1. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
copy .env.example .env          # Windows
# cp .env.example .env          # Linux/macOS

# Crear usuario admin inicial (solo la primera vez)
python seed.py

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

API disponible en: http://localhost:8000  
Documentación interactiva: http://localhost:8000/docs

---

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Frontend disponible en: http://localhost:5173

---

## Credenciales iniciales

| Campo     | Valor      |
|-----------|------------|
| Usuario   | `admin`    |
| Contraseña| `admin123` |

> Cambia la contraseña después del primer login desde la gestión de usuarios.

---

## Estructura de roles

| Rol           | Permisos                              |
|---------------|---------------------------------------|
| `admin`       | CRUD completo + gestión de usuarios   |
| `tecnico`     | CRUD activos, empleados, asignaciones |
| `solo_lectura`| Solo consulta (GET)                   |

---

## Estructura del proyecto

```
Sistema-Mincon/
├── backend/
│   ├── app/
│   │   ├── auth/           — autenticación JWT
│   │   ├── models/         — modelos SQLAlchemy
│   │   ├── schemas/        — esquemas Pydantic
│   │   ├── routers/        — endpoints por módulo
│   │   ├── importers/      — (reservado para importación Excel)
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── seed.py             — crea usuario admin inicial
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/            — clientes HTTP
│       ├── store/          — estado global (Zustand)
│       ├── pages/          — páginas por módulo
│       └── components/     — layout y componentes compartidos
│
├── docker-compose.yml      — opcional, para LAN/VPN
└── README.md
```

---

## Migración de base de datos

Cambiar `DATABASE_URL` en `backend/.env`:

```env
# SQLite (desarrollo)
DATABASE_URL=sqlite:///./mincon_ti.db

# MariaDB
DATABASE_URL=mysql+pymysql://user:password@localhost/mincon_ti

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/mincon_ti
```

Instalar el driver correspondiente:
```bash
pip install pymysql       # MariaDB/MySQL
pip install psycopg2-binary  # PostgreSQL
```

---

## Módulos — Estado Fase 1

| Módulo          | Backend | Frontend |
|-----------------|---------|----------|
| Auth / JWT      | ✅      | ✅       |
| Dashboard       | ✅      | ✅       |
| Activos (CRUD)  | ✅      | ✅ lista |
| Empleados (CRUD)| ✅      | ✅ lista |
| Asignaciones    | ✅      | 🔧 stub  |
| Mantenimientos  | ✅      | 🔧 stub  |
| Usuarios        | ✅      | pendiente|
