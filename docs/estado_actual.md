# Estado Actual — Sistema Gestión TI Minconsulting

> Última actualización: 2026-05-07 (sesión 2)

---

## Módulos implementados

| Módulo         | Backend | Frontend         | Estado general |
|----------------|---------|------------------|----------------|
| Autenticación  | ✅ completo | ✅ completo  | Estable        |
| Dashboard      | ✅ completo | ✅ completo  | Estable        |
| Empleados      | ✅ completo | ✅ CRUD completo | Estable      |
| Activos        | ✅ completo | ✅ CRUD completo | Estable      |
| Asignaciones   | ✅ completo | ✅ CRUD completo | Estable        |
| Mantenimientos | ✅ backend  | 🔧 stub          | Backend listo  |
| Usuarios       | ✅ backend  | ❌ pendiente     | Sin UI         |

---

## Endpoints disponibles

### Auth
```
POST   /api/v1/auth/login          Login (JSON: {username, password}) → JWT
GET    /api/v1/auth/me             Usuario actual autenticado
```

### Usuarios
```
GET    /api/v1/users/              Lista usuarios activos          [admin]
POST   /api/v1/users/              Crear usuario                   [admin]
PATCH  /api/v1/users/{id}          Editar usuario                  [admin]
DELETE /api/v1/users/{id}          Desactivar usuario              [admin]
```

### Empleados
```
GET    /api/v1/employees/          Lista empleados activos         [todos]
                                   Soporta: ?search=texto
GET    /api/v1/employees/all       Lista incluyendo inactivos      [todos]
GET    /api/v1/employees/{id}      Detalle de empleado             [todos]
POST   /api/v1/employees/          Crear empleado                  [tecnico, admin]
PATCH  /api/v1/employees/{id}      Editar empleado                 [tecnico, admin]
DELETE /api/v1/employees/{id}      Desactivar empleado (soft)      [tecnico, admin]
```

### Activos
```
GET    /api/v1/activos/            Lista activos activos           [todos]
                                   Soporta: ?search= ?tipo= ?estado=
GET    /api/v1/activos/{id}        Detalle con equipo_detalle      [todos]
POST   /api/v1/activos/            Crear activo                    [tecnico, admin]
PATCH  /api/v1/activos/{id}        Editar activo + equipo_detalle  [tecnico, admin]
DELETE /api/v1/activos/{id}        Dar de baja (soft delete)       [tecnico, admin]
```

### Asignaciones
```
GET    /api/v1/assignments/                    Lista asignaciones  [todos]
                                               Soporta: ?activo_id= ?employee_id= ?activas=
POST   /api/v1/assignments/                    Crear asignación    [tecnico, admin]
POST   /api/v1/assignments/{id}/devolucion     Registrar devolución [tecnico, admin]
```

**Flujo de asignación:**
1. El frontend solicita `GET /activos/?estado=operativo` para poblar el dropdown (solo al abrir el modal).
2. El usuario selecciona activo + empleado + fecha de asignación + notas opcionales.
3. `POST /assignments/` valida que el activo no esté en estado `prestado` y lo cambia a ese estado.
4. La tabla de asignaciones activas (`activas=true`) se refresca automáticamente.
5. El activo desaparece del dropdown de activos disponibles.

**Flujo de devolución:**
1. El usuario hace clic en "Devolver" en la fila de la asignación activa.
2. El modal muestra el activo, el empleado asignado y la fecha de asignación como contexto.
3. El usuario confirma o ajusta la fecha de devolución.
4. `POST /assignments/{id}/devolucion` marca `is_active = false` y cambia el estado del activo a `operativo`.
5. La fila desaparece de la tabla de activas y aparece en el historial (`activas=false`).

**Criterios de prueba verificados (2026-05-07):**
- Asignación crea correctamente la fila y cambia el estado del activo a `prestado`.
- El activo asignado no aparece en el dropdown de nueva asignación.
- La devolución cambia el estado del activo a `operativo` y mueve la fila al historial.
- El toggle "Ver historial" muestra asignaciones devueltas con su fecha de devolución.
- El filtro de texto funciona sobre nombre de activo y nombre de empleado.
- Los errores del backend (`400 — ya prestado`, `404 — ya devuelta`) se muestran en el modal.

### Mantenimientos
```
GET    /api/v1/maintenance/        Lista mantenimientos            [todos]
                                   Soporta: ?activo_id=
POST   /api/v1/maintenance/        Registrar mantenimiento         [tecnico, admin]
PATCH  /api/v1/maintenance/{id}    Editar mantenimiento            [tecnico, admin]
DELETE /api/v1/maintenance/{id}    Eliminar mantenimiento          [tecnico, admin]
```

### Dashboard
```
GET    /api/v1/dashboard/stats     Estadísticas generales          [todos]
```

---

## Modelos de base de datos

### Tablas activas
| Tabla              | Descripción |
|--------------------|-------------|
| `users`            | Usuarios del sistema con roles |
| `employees`        | Empleados de la empresa |
| `activos`          | Inventario central de activos TI |
| `equipos_detalle`  | Detalle técnico de laptops, PCs, workstations |
| `perifericos_detalle` | Detalle de periféricos (reservado) |
| `nas_detalle`      | Detalle de dispositivos NAS (reservado) |
| `asignaciones`     | Historial de asignaciones activo↔empleado |
| `mantenimientos`   | Registro de mantenimientos por activo |

### Campos clave — Employee
`first_name`, `last_name`, `full_name` (auto-computado), `email`, `department`, `position`, `phone`, `hire_date`, `notes`, `is_active`

### Campos clave — Activo
`codigo_patrimonial`, `tipo`, `marca`, `modelo`, `serial`, `estado`, `ubicacion`, `fecha_compra`, `fecha_garantia`, `notas`, `is_active`

### Tipos de activo válidos
`laptop` | `pc` | `workstation` | `monitor` | `nas` | `celular` | `impresora` | `otro`

### Estados de activo válidos
`operativo` | `mantenimiento` | `reparar` | `dañado` | `descartado` | `prestado` | `retirado`

### Roles de usuario
| Rol           | Permisos |
|---------------|----------|
| `admin`       | CRUD completo + gestión de usuarios |
| `tecnico`     | CRUD activos, empleados, asignaciones, mantenimientos |
| `solo_lectura`| Solo GET en todos los endpoints |

---

## Archivos frontend — Asignaciones

| Archivo | Descripción |
|---------|-------------|
| `frontend/src/api/assignments.ts` | Tipos (`Asignacion`, `AsignacionCreate`, `AsignacionDevolucion`) y funciones HTTP (`fetchAsignaciones`, `createAsignacion`, `registrarDevolucion`) |
| `frontend/src/pages/Asignaciones/AsignacionesPage.tsx` | Página completa: tabla con toggle historial, filtro de texto, modal nueva asignación, modal devolución con fecha editable |

---

## Bugs corregidos relevantes

| Bug | Síntoma | Solución aplicada |
|-----|---------|-------------------|
| 307 redirect en activos/employees | FastAPI redirige `/activos` → `/activos/`, el header Authorization se pierde, fuerza logout | Añadir trailing slash en URLs del frontend |
| `passlib` + `bcrypt>=4.0` | `AttributeError: module 'bcrypt' has no attribute '__about__'` en Windows | Pinado `bcrypt>=3.2.0,<4.0.0` en requirements.txt |
| Dead code en dashboard | Variable `by_tipo` ejecutaba query malformada al inicio | Eliminada, reemplazada por loop simple |
| `React.ReactNode` sin import | Error TypeScript en modo strict | Uso de `import type { ReactNode }` en cada archivo |
| `EmailStr` sin `email-validator` | Import de Pydantic podría fallar | Eliminado import no utilizado |

---

## Cómo ejecutar localmente

### Prerequisitos
- Python 3.11+
- Node.js 20+

### Backend

```powershell
cd backend

# Primera vez
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

# Crear BD y usuario admin (solo primera vez o tras borrar la BD)
python seed.py

# Iniciar
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Docs Swagger: http://localhost:8000/docs

### Frontend

```powershell
cd frontend

# Primera vez
npm install

# Iniciar
npm run dev
```

- App: http://localhost:5173

### Recrear la base de datos (cuando se cambian modelos)

```powershell
# Desde backend/, con venv activo
Remove-Item mincon_ti.db -ErrorAction SilentlyContinue
python seed.py
```

---

## Usuario demo

| Campo      | Valor      |
|------------|------------|
| Usuario    | `admin`    |
| Contraseña | `admin123` |
| Rol        | `admin`    |

---

## Notas de configuración

- La BD SQLite se crea automáticamente en `backend/mincon_ti.db` al iniciar
- Para cambiar a MariaDB o PostgreSQL: editar `DATABASE_URL` en `backend/.env` e instalar el driver correspondiente (`pymysql` o `psycopg2-binary`)
- El frontend hace proxy de `/api/*` hacia `localhost:8000` vía Vite (solo en desarrollo)
- JWT expira en 8 horas. No hay refresh token en Fase 1
