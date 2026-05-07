# Sistema Central de Gestión TI — Minconsulting

Sistema web interno para gestión de activos TI, empleados, asignaciones y mantenimientos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + SQLAlchemy + SQLite (dev) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Estado frontend | Zustand + TanStack Query |

---

## Requisitos previos

- **Python** 3.11 o superior
- **Node.js** 20 o superior

---

## Instalación y ejecución local

### 1 — Backend

```powershell
cd backend

# Crear entorno virtual (solo la primera vez)
python -m venv .venv

# Activar entorno
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
copy .env.example .env

# Crear base de datos y usuario admin inicial
python seed.py

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

**URLs del backend:**
- API base: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### 2 — Frontend

```powershell
cd frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**URL de la aplicación:** http://localhost:5173

El frontend hace proxy automático de `/api/*` hacia `localhost:8000` (configurado en `vite.config.ts`).

---

## Credenciales iniciales

| Campo      | Valor      |
|------------|------------|
| Usuario    | `admin`    |
| Contraseña | `admin123` |
| Rol        | `admin`    |

> Cambiar la contraseña después del primer acceso desde la gestión de usuarios.

---

## Roles del sistema

| Rol            | Acceso |
|----------------|--------|
| `admin`        | CRUD completo + gestión de usuarios del sistema |
| `tecnico`      | CRUD activos, empleados, asignaciones, mantenimientos |
| `solo_lectura` | Solo consulta (GET) en todos los módulos |

---

## Módulos disponibles

| Módulo         | Estado |
|----------------|--------|
| Login / Auth   | ✅ Funcional |
| Dashboard      | ✅ Funcional |
| Empleados      | ✅ CRUD completo |
| Activos        | ✅ CRUD completo |
| Asignaciones   | ✅ Backend / 🔧 UI pendiente |
| Mantenimientos | ✅ Backend / 🔧 UI pendiente |

---

## Base de datos

La BD SQLite se crea automáticamente en `backend/mincon_ti.db` al levantar el servidor.

### Recrear la BD (necesario al cambiar modelos)

```powershell
# Desde backend/, con el venv activo
Remove-Item mincon_ti.db -ErrorAction SilentlyContinue
python seed.py
```

### Migrar a MariaDB o PostgreSQL

Editar `backend/.env`:

```env
# MariaDB
DATABASE_URL=mysql+pymysql://usuario:password@localhost/mincon_ti

# PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost/mincon_ti
```

Instalar el driver correspondiente:

```powershell
pip install pymysql          # para MariaDB/MySQL
pip install psycopg2-binary  # para PostgreSQL
```

El resto del código no requiere cambios.

---

## Estructura del proyecto

```
Sistema-Mincon/
├── backend/
│   ├── app/
│   │   ├── auth/           JWT, login, schemas de auth
│   │   ├── models/         Modelos SQLAlchemy (ORM)
│   │   ├── schemas/        Schemas Pydantic (request/response)
│   │   ├── routers/        Endpoints por módulo
│   │   ├── importers/      Reservado para importación Excel (Fase 2)
│   │   ├── config.py       Variables de entorno
│   │   ├── database.py     Engine y sesión SQLAlchemy
│   │   ├── dependencies.py get_db, get_current_user, require_*
│   │   └── main.py         FastAPI app, CORS, registro de routers
│   ├── seed.py             Crea usuario admin inicial
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── api/            Clientes HTTP por módulo (axios)
│       ├── store/          Estado global con Zustand (auth)
│       ├── pages/          Páginas por módulo
│       └── components/     Layout (Sidebar, Layout wrapper)
│
├── docs/
│   ├── estado_actual.md    Qué está implementado y cómo ejecutarlo
│   └── proximos_pasos.md   Roadmap y pendientes técnicos
│
├── docker-compose.yml      Opcional — para despliegue en LAN
└── README.md
```

---

## Documentación interna

- **[docs/estado_actual.md](docs/estado_actual.md)** — Módulos implementados, endpoints, bugs corregidos, estado de BD
- **[docs/proximos_pasos.md](docs/proximos_pasos.md)** — Roadmap de desarrollo, riesgos técnicos, decisiones de arquitectura
