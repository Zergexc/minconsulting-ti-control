# Próximos Pasos — Sistema Gestión TI Minconsulting

> Referencia para retomar el desarrollo en la siguiente sesión.

---

## Próximo módulo recomendado: Asignaciones

El backend ya está completo. Solo falta la UI.

**Por qué primero asignaciones:**
- Conecta los dos módulos ya funcionales (Activos y Empleados)
- Es el flujo más consultado en el día a día de TI
- Permite validar el estado `prestado` del activo al asignarlo

**Qué necesita la pantalla de Asignaciones:**
- Tabla de asignaciones activas con: activo, empleado, fecha, estado
- Modal para crear asignación: seleccionar activo (dropdown filtrado por estado=operativo) + seleccionar empleado + fecha
- Botón "Registrar devolución" por fila
- Filtro por empleado o por activo
- El backend ya responde todo en `GET /api/v1/assignments/`

---

## Orden sugerido de desarrollo

### Fase 1 — Completar módulos base (próximas sesiones)

1. **Asignaciones UI** — pantalla funcional con crear y devolver
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
