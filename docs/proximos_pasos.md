# Próximos Pasos — Sistema Gestión TI Minconsulting

> Referencia para retomar el desarrollo en la siguiente sesión.

---

## ✅ Asignaciones — completado (2026-05-07)

Módulo totalmente funcional. Backend y frontend implementados y verificados.

**Lo que se implementó:**
- `frontend/src/api/assignments.ts` — cliente HTTP con tipos TypeScript
- `frontend/src/pages/Asignaciones/AsignacionesPage.tsx` — página completa

**Funcionalidades verificadas:**
- Tabla de asignaciones activas con activo, empleado, fechas y notas
- Modal para crear asignación con dropdown de activos operativos y dropdown de empleados
- Fecha de asignación con valor por defecto editable (hoy)
- Botón "Devolver" por fila con modal de confirmación y campo de fecha de devolución
- Toggle para ver historial de asignaciones devueltas
- Filtro de texto sobre activo y empleado (client-side)
- Refresco automático de tabla, dropdown de activos y dashboard tras crear o devolver
- Mensajes de error del backend mostrados en el modal

---

## Próximo módulo recomendado: Mantenimientos

El backend ya está completo. Solo falta la UI.

**Por qué mantenimientos ahora:**
- Completa el ciclo operativo de un activo (asignación → mantenimiento → devolución)
- El flujo de registro de mantenimiento es el más frecuente después de asignaciones
- El backend ya responde todo en `GET /api/v1/maintenance/` y soporta PATCH y DELETE

**Qué necesita la pantalla de Mantenimientos:**
- Tabla de mantenimientos con: activo, fecha, tipo, descripción, técnico, costo
- Modal para registrar mantenimiento: dropdown de activos + campos de detalle
- Botón editar por fila (PATCH)
- Botón eliminar por fila con confirmación
- Filtro por activo (`?activo_id=`)
- El estado del activo puede pasar a `mantenimiento` al registrar (decisión de UX a tomar)

---

## Orden sugerido de desarrollo

### Fase 1 — Completar módulos base

1. ~~**Asignaciones UI**~~ ✅ Completado
2. **Mantenimientos UI** — tabla + modal con: activo, fecha, tipo, descripción, técnico, costo
3. **Gestión de usuarios UI** — solo visible para admin, tabla + modal para crear/editar usuarios del sistema

### Fase 2 — Extensión de datos

4. **Reactivar registros** — botón para reactivar empleados o activos dados de baja (ya soportado en backend vía PATCH con `is_active: true`)
5. **Licencias de software** — nuevo modelo + CRUD (modelo: software, versión, tipo licencia, fecha vencimiento, activo asignado)
6. **Correos Microsoft 365** — registro simple (sin integración API): email, usuario, licencia asignada, fecha creación

### Fase 3 — Utilidad operativa

7. **Importación desde Excel** — la carpeta `backend/app/importers/` ya está reservada; usar `openpyxl` para empleados y activos
8. **Reportes básicos** — PDF o Excel: inventario de activos, asignaciones por empleado, historial de mantenimientos
9. **Historial de activo** — vista detalle por activo que muestre asignaciones + mantenimientos pasados

### Fase 4 — Infraestructura y automatización

10. **Migración a MariaDB/PostgreSQL** — solo cambiar `DATABASE_URL` y ejecutar con Alembic; el código no cambia
11. **Alembic migrations** — reemplazar `create_all()` en `main.py` por migraciones controladas
12. **Agente Python para Windows** — inventario automático de hostname, RAM, IP desde los equipos de la red
13. **Wake-on-LAN** — endpoint en backend + botón en UI de activos
14. **Integración GLPI** — consulta/sincronización de tickets con la API REST de GLPI

---

## Qué NO tocar todavía

| Área | Razón |
|------|-------|
| Auth y JWT | Funciona. Cualquier cambio puede romper todas las sesiones |
| Estructura de modelos SQLAlchemy | Cambios requieren recrear la BD o usar Alembic; esperar a que haya datos reales |
| `perifericos_detalle` y `nas_detalle` | Tablas creadas pero sin UI ni datos; no activar hasta Fase 2 |
| Docker | No es necesario hasta desplegar en LAN |
| GLPI, WOL, agente Windows | Fuera de alcance hasta Fase 4 |

---

## Pendientes técnicos / riesgos

### Críticos antes de producción
- **Alembic**: actualmente la BD se crea con `Base.metadata.create_all()`. Esto no aplica migraciones cuando se agregan columnas. En producción con datos reales, hay que migrar a Alembic o se perderán datos al cambiar modelos.
- **Secreto JWT**: el `SECRET_KEY` en `.env` de desarrollo es débil. Cambiar antes de exponer en red.
- **HTTPS**: el sistema corre en HTTP. Para despliegue en LAN real, configurar reverse proxy (nginx) con SSL.

### Medios
- **Paginación**: las listas no tienen límite de resultados. Con cientos de activos puede volverse lento. Añadir `?skip=0&limit=100` antes de tener datos reales.
- **Refresh token**: el JWT expira en 8h. Si el usuario trabaja más tiempo, pierde la sesión. Añadir refresh token en Fase 2.
- **Validación de email**: no se valida formato de email en backend (se acepta cualquier string). Añadir validación básica si se vuelve problema.

### Menores
- Empleados y activos dados de baja no tienen UI para reactivarlos (el backend lo soporta vía PATCH `is_active: true`)
- El formulario de activos no edita `perifericos_detalle` ni `nas_detalle` desde la UI
- La búsqueda en activos no cubre el campo `hostname` de `equipos_detalle`

---

## Decisiones de arquitectura ya tomadas (no revertir)

| Decisión | Razón |
|----------|-------|
| Entidad central `Activo` (no `Equipment`) | Nomenclatura correcta para el contexto |
| Estados: `operativo`, `prestado`, `mantenimiento`, etc. | Reemplaza el esquema anterior (`disponible`, `asignado`) |
| `full_name` computado de `first_name` + `last_name` | El router lo calcula automáticamente al crear/editar |
| Soft delete con `is_active` | Nunca se borra historial de empleados ni activos |
| Trailing slash en URLs del frontend | Evita 307 redirect que pierde el header Authorization |
| `bcrypt<4.0.0` pinado | Compatibilidad con `passlib 1.7.4` en Windows |
