import { useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, RotateCcw, X, History, ClipboardList } from "lucide-react";
import {
  fetchAsignaciones,
  createAsignacion,
  registrarDevolucion,
  type Asignacion,
  type AsignacionCreate,
  type AsignacionDevolucion,
} from "../../api/assignments";
import { fetchActivos, TIPOS_ACTIVO } from "../../api/activos";
import { fetchEmployees } from "../../api/employees";

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function tipoLabel(tipo: string): string {
  return TIPOS_ACTIVO.find((t) => t.value === tipo)?.label ?? tipo;
}

function activoOptionLabel(a: {
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  codigo_patrimonial?: string | null;
}): string {
  const tipo = tipoLabel(a.tipo);
  const desc = [a.marca, a.modelo].filter(Boolean).join(" ") || "Sin nombre";
  const codigo = a.codigo_patrimonial ? ` · ${a.codigo_patrimonial}` : "";
  return `${tipo} — ${desc}${codigo}`;
}

function extractError(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const res = (e as { response?: { data?: { detail?: string } } }).response;
    return res?.data?.detail ?? "Error al procesar";
  }
  return "Error al procesar";
}

// ─── form types ───────────────────────────────────────────────────────────────

interface AsignacionForm {
  activo_id: string;
  employee_id: string;
  fecha_asignacion: string;
  notas: string;
}

interface DevolucionForm {
  fecha_devolucion: string;
  notas: string;
}

// ─── helper component ─────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";
const SELECT = INPUT;

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AsignacionesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showHistorial, setShowHistorial] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [devolucionTarget, setDevolucionTarget] = useState<Asignacion | null>(null);
  const [form, setForm] = useState<AsignacionForm>({
    activo_id: "",
    employee_id: "",
    fecha_asignacion: today(),
    notas: "",
  });
  const [devForm, setDevForm] = useState<DevolucionForm>({
    fecha_devolucion: today(),
    notas: "",
  });
  const [apiError, setApiError] = useState("");

  // ── queries ────────────────────────────────────────────────────────────────

  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ["asignaciones", showHistorial],
    queryFn: () => fetchAsignaciones({ activas: !showHistorial }),
  });

  const { data: activosDisponibles = [], isLoading: loadingActivos } = useQuery({
    queryKey: ["activos-operativos"],
    queryFn: () => fetchActivos({ estado: "operativo" }),
    enabled: modalOpen,
  });

  const { data: empleados = [], isLoading: loadingEmpleados } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmployees(),
    enabled: modalOpen,
  });

  // ── filtered data ──────────────────────────────────────────────────────────

  const filtered = asignaciones.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const activoStr = [a.activo?.marca, a.activo?.modelo, a.activo?.codigo_patrimonial]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const empStr = (a.employee?.full_name ?? "").toLowerCase();
    return activoStr.includes(q) || empStr.includes(q);
  });

  // ── mutations ──────────────────────────────────────────────────────────────

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["asignaciones"] });
    qc.invalidateQueries({ queryKey: ["activos"] });
    qc.invalidateQueries({ queryKey: ["activos-operativos"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: AsignacionCreate) => createAsignacion(payload),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const devolucionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AsignacionDevolucion }) =>
      registrarDevolucion(id, payload),
    onSuccess: () => {
      invalidate();
      setDevolucionTarget(null);
      setApiError("");
    },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  // ── handlers ──────────────────────────────────────────────────────────────

  function set(field: keyof AsignacionForm) {
    return (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function setDev(field: keyof DevolucionForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDevForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openModal() {
    setForm({ activo_id: "", employee_id: "", fecha_asignacion: today(), notas: "" });
    setApiError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setApiError("");
  }

  function openDevolucion(a: Asignacion) {
    setDevolucionTarget(a);
    setDevForm({ fecha_devolucion: today(), notas: "" });
    setApiError("");
  }

  function handleSubmit() {
    if (!form.activo_id || !form.employee_id) {
      setApiError("El activo y el empleado son obligatorios");
      return;
    }
    if (!form.fecha_asignacion) {
      setApiError("La fecha de asignación es obligatoria");
      return;
    }
    setApiError("");
    createMutation.mutate({
      activo_id: parseInt(form.activo_id),
      employee_id: parseInt(form.employee_id),
      fecha_asignacion: form.fecha_asignacion,
      notas: form.notas.trim() || undefined,
    });
  }

  function handleDevolucion() {
    if (!devolucionTarget) return;
    if (!devForm.fecha_devolucion) {
      setApiError("La fecha de devolución es obligatoria");
      return;
    }
    setApiError("");
    devolucionMutation.mutate({
      id: devolucionTarget.id,
      payload: {
        fecha_devolucion: devForm.fecha_devolucion,
        notas: devForm.notas.trim() || undefined,
      },
    });
  }

  const isSaving = createMutation.isPending;
  const isDevolviendo = devolucionMutation.isPending;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {showHistorial ? "Historial de asignaciones devueltas" : "Asignaciones activas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowHistorial(!showHistorial);
              setSearch("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showHistorial
                ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {showHistorial ? <ClipboardList size={16} /> : <History size={16} />}
            {showHistorial ? "Ver activas" : "Ver historial"}
          </button>
          {!showHistorial && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus size={16} />
              Nueva asignación
            </button>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por activo o empleado..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-gray-400 py-8 text-center">Cargando asignaciones...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha asignación
                </th>
                {showHistorial && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha devolución
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Notas
                </th>
                {!showHistorial && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {a.activo ? (
                      <>
                        <p className="font-medium text-gray-900">
                          {[a.activo.marca, a.activo.modelo].filter(Boolean).join(" ") || "Sin nombre"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tipoLabel(a.activo.tipo)}
                          {a.activo.codigo_patrimonial ? ` · ${a.activo.codigo_patrimonial}` : ""}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Activo eliminado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.employee ? (
                      <>
                        <p className="font-medium text-gray-900">{a.employee.full_name}</p>
                        <p className="text-xs text-gray-400">
                          {[a.employee.position, a.employee.department]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Empleado eliminado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDate(a.fecha_asignacion)}
                  </td>
                  {showHistorial && (
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(a.fecha_devolucion)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                    {a.notas ?? "—"}
                  </td>
                  {!showHistorial && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDevolucion(a)}
                        title="Registrar devolución"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 border border-brand-200 hover:bg-brand-50 transition-colors"
                      >
                        <RotateCcw size={13} />
                        Devolver
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {search
                      ? "No se encontraron asignaciones con ese criterio"
                      : showHistorial
                      ? "No hay asignaciones en el historial"
                      : "No hay asignaciones activas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              {filtered.length} asignación{filtered.length !== 1 ? "es" : ""}
            </div>
          )}
        </div>
      )}

      {/* Modal — nueva asignación */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">Nueva asignación</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <Field label="Activo" required>
                <select
                  className={SELECT}
                  value={form.activo_id}
                  onChange={set("activo_id")}
                  disabled={loadingActivos}
                >
                  <option value="">
                    {loadingActivos ? "Cargando activos..." : "Seleccionar activo operativo..."}
                  </option>
                  {!loadingActivos && activosDisponibles.length === 0 && (
                    <option disabled>No hay activos operativos disponibles</option>
                  )}
                  {activosDisponibles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {activoOptionLabel(a)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Empleado" required>
                <select
                  className={SELECT}
                  value={form.employee_id}
                  onChange={set("employee_id")}
                  disabled={loadingEmpleados}
                >
                  <option value="">
                    {loadingEmpleados ? "Cargando empleados..." : "Seleccionar empleado..."}
                  </option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                      {e.department ? ` — ${e.department}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha de asignación" required>
                <input
                  className={INPUT}
                  type="date"
                  value={form.fecha_asignacion}
                  onChange={set("fecha_asignacion")}
                />
              </Field>

              <Field label="Notas">
                <textarea
                  className={INPUT + " resize-none"}
                  rows={3}
                  value={form.notas}
                  onChange={set("notas")}
                  placeholder="Observaciones opcionales..."
                />
              </Field>

              {apiError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-5 py-2 text-sm bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {isSaving ? "Asignando..." : "Crear asignación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — registrar devolución */}
      {devolucionTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDevolucionTarget(null);
              setApiError("");
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">Registrar devolución</h2>
              <button
                onClick={() => {
                  setDevolucionTarget(null);
                  setApiError("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-gray-900">
                  {devolucionTarget.activo
                    ? [devolucionTarget.activo.marca, devolucionTarget.activo.modelo]
                        .filter(Boolean)
                        .join(" ") || "Sin nombre"
                    : "Activo"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Asignado a{" "}
                  <span className="font-medium">
                    {devolucionTarget.employee?.full_name ?? "—"}
                  </span>{" "}
                  · desde {formatDate(devolucionTarget.fecha_asignacion)}
                </p>
              </div>

              <Field label="Fecha de devolución" required>
                <input
                  className={INPUT}
                  type="date"
                  value={devForm.fecha_devolucion}
                  onChange={setDev("fecha_devolucion")}
                />
              </Field>

              <Field label="Notas">
                <textarea
                  className={INPUT + " resize-none"}
                  rows={2}
                  value={devForm.notas}
                  onChange={setDev("notas")}
                  placeholder="Observaciones opcionales..."
                />
              </Field>

              {apiError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setDevolucionTarget(null);
                  setApiError("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolucion}
                disabled={isDevolviendo}
                className="px-5 py-2 text-sm bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {isDevolviendo ? "Procesando..." : "Confirmar devolución"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
