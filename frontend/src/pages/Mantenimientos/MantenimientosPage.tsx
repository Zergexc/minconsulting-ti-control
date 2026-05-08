import { useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, Trash2, X, ChevronDown } from "lucide-react";
import {
  fetchMantenimientos,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
  TIPOS_MANTENIMIENTO,
  type Mantenimiento,
  type MantenimientoCreate,
  type MantenimientoUpdate,
} from "../../api/maintenance";
import { fetchActivos, TIPOS_ACTIVO, updateActivo } from "../../api/activos";

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function tipoColor(tipo: string): string {
  return (
    TIPOS_MANTENIMIENTO.find((t) => t.value === tipo)?.color ??
    "bg-gray-100 text-gray-500"
  );
}

function tipoLabel(tipo: string): string {
  return TIPOS_MANTENIMIENTO.find((t) => t.value === tipo)?.label ?? tipo;
}

function extractError(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const res = (e as { response?: { data?: { detail?: string } } }).response;
    return res?.data?.detail ?? "Error al procesar";
  }
  return "Error al procesar";
}

// ─── form type ────────────────────────────────────────────────────────────────

interface MantenimientoForm {
  activo_id: string;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string;
}

const EMPTY_FORM: MantenimientoForm = {
  activo_id: "",
  fecha: today(),
  tipo_mantenimiento: "preventivo",
  descripcion: "",
};

function mantenimientoToForm(m: Mantenimiento): MantenimientoForm {
  return {
    activo_id: String(m.activo_id),
    fecha: m.fecha,
    tipo_mantenimiento: m.tipo_mantenimiento,
    descripcion: m.descripcion ?? "",
  };
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

export default function MantenimientosPage() {
  const qc = useQueryClient();
  const [filterActivoId, setFilterActivoId] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mantenimiento | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<MantenimientoForm>(EMPTY_FORM);
  const [cambiarEstado, setCambiarEstado] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── queries ────────────────────────────────────────────────────────────────

  const { data: mantenimientos = [], isLoading } = useQuery({
    queryKey: ["mantenimientos", filterActivoId],
    queryFn: () =>
      fetchMantenimientos(
        filterActivoId ? { activo_id: parseInt(filterActivoId) } : undefined
      ),
  });

  const { data: activos = [] } = useQuery({
    queryKey: ["activos"],
    queryFn: () => fetchActivos(),
  });

  // ── filtered data ──────────────────────────────────────────────────────────

  const filtered = mantenimientos.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.descripcion ?? "").toLowerCase().includes(q) ||
      (m.tecnico ?? "").toLowerCase().includes(q) ||
      tipoLabel(m.tipo_mantenimiento).toLowerCase().includes(q)
    );
  });

  // ── mutations ──────────────────────────────────────────────────────────────

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["mantenimientos"] });
    qc.invalidateQueries({ queryKey: ["activos"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: MantenimientoCreate) => createMantenimiento(payload),
    onSuccess: async (created) => {
      if (cambiarEstado) {
        try {
          await updateActivo(created.activo_id, { estado: "mantenimiento" });
        } catch {
          // El mantenimiento fue creado; el cambio de estado falló silenciosamente.
          // El usuario puede actualizar el estado del activo manualmente.
        }
      }
      invalidate();
      closeModal();
    },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MantenimientoUpdate }) =>
      updateMantenimiento(id, payload),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMantenimiento,
    onSuccess: () => {
      invalidate();
      setConfirmDeleteId(null);
    },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  // ── handlers ──────────────────────────────────────────────────────────────

  function set(field: keyof MantenimientoForm) {
    return (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, fecha: today() });
    setCambiarEstado(false);
    setApiError("");
    setModalOpen(true);
  }

  function openEdit(m: Mantenimiento) {
    setEditing(m);
    setForm(mantenimientoToForm(m));
    setCambiarEstado(false);
    setApiError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setApiError("");
  }

  function buildCreatePayload(): MantenimientoCreate {
    return {
      activo_id: parseInt(form.activo_id),
      fecha: form.fecha,
      tipo_mantenimiento: form.tipo_mantenimiento || "preventivo",
      descripcion: form.descripcion.trim() || undefined,
    };
  }

  function buildUpdatePayload(): MantenimientoUpdate {
    return {
      fecha: form.fecha,
      tipo_mantenimiento: form.tipo_mantenimiento || "preventivo",
      descripcion: form.descripcion.trim(),
    };
  }

  function handleSubmit() {
    if (!editing && !form.activo_id) {
      setApiError("El activo es obligatorio");
      return;
    }
    if (!form.fecha) {
      setApiError("La fecha es obligatoria");
      return;
    }
    setApiError("");
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: buildUpdatePayload() });
    } else {
      createMutation.mutate(buildCreatePayload());
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // activo del mantenimiento que se está editando (para mostrarlo en modo lectura)
  const editingActivo = editing
    ? activos.find((a) => a.id === editing.activo_id)
    : null;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mantenimientos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Registrar mantenimiento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <select
            value={filterActivoId}
            onChange={(e) => setFilterActivoId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Todos los activos</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {[a.marca, a.modelo].filter(Boolean).join(" ") || `Activo #${a.id}`}
                {a.codigo_patrimonial ? ` · ${a.codigo_patrimonial}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descripción o técnico..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {(filterActivoId || search) && (
          <button
            onClick={() => {
              setFilterActivoId("");
              setSearch("");
            }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-gray-400 py-8 text-center">Cargando mantenimientos...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => {
                const activo = activos.find((a) => a.id === m.activo_id);
                return (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {activo ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {[activo.marca, activo.modelo].filter(Boolean).join(" ") ||
                              "Sin nombre"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {TIPOS_ACTIVO.find((t) => t.value === activo.tipo)?.label ??
                              activo.tipo}
                            {activo.codigo_patrimonial
                              ? ` · ${activo.codigo_patrimonial}`
                              : ""}
                          </p>
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          Activo #{m.activo_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(m.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tipoColor(m.tipo_mantenimiento)}`}
                      >
                        {tipoLabel(m.tipo_mantenimiento)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[220px] truncate">
                      {m.descripcion ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(m.id);
                            setApiError("");
                          }}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {search || filterActivoId
                      ? "No se encontraron mantenimientos con los filtros aplicados"
                      : "No hay mantenimientos registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              {filtered.length} mantenimiento{filtered.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Modal — registrar / editar */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">
                {editing ? "Editar mantenimiento" : "Registrar mantenimiento"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Activo — dropdown en creación, lectura en edición */}
              {!editing ? (
                <Field label="Activo" required>
                  <select
                    className={SELECT}
                    value={form.activo_id}
                    onChange={set("activo_id")}
                  >
                    <option value="">Seleccionar activo...</option>
                    {activos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {[a.marca, a.modelo].filter(Boolean).join(" ") ||
                          "Sin nombre"}
                        {a.codigo_patrimonial ? ` · ${a.codigo_patrimonial}` : ""}
                        {` (${TIPOS_ACTIVO.find((t) => t.value === a.tipo)?.label ?? a.tipo})`}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                  <p className="text-xs text-gray-400 mb-0.5">Activo</p>
                  <p className="font-medium text-gray-800">
                    {editingActivo
                      ? [editingActivo.marca, editingActivo.modelo]
                          .filter(Boolean)
                          .join(" ") || "Sin nombre"
                      : `Activo #${editing.activo_id}`}
                  </p>
                  {editingActivo?.codigo_patrimonial && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {editingActivo.codigo_patrimonial}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" required>
                  <input
                    className={INPUT}
                    type="date"
                    value={form.fecha}
                    onChange={set("fecha")}
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    className={SELECT}
                    value={form.tipo_mantenimiento}
                    onChange={set("tipo_mantenimiento")}
                  >
                    {TIPOS_MANTENIMIENTO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Descripción">
                <textarea
                  className={INPUT + " resize-none"}
                  rows={3}
                  value={form.descripcion}
                  onChange={set("descripcion")}
                  placeholder="Detalle del trabajo realizado..."
                />
              </Field>

              {/* Checkbox — solo en creación */}
              {!editing && (
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={cambiarEstado}
                    onChange={(e) => setCambiarEstado(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Cambiar estado del activo a "En mantenimiento"
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Deberás actualizar el estado manualmente cuando el mantenimiento finalice.
                    </p>
                  </div>
                </label>
              )}

              {apiError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {apiError}
                </p>
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
                {isSaving
                  ? editing
                    ? "Guardando..."
                    : "Registrando..."
                  : editing
                  ? "Guardar cambios"
                  : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — confirmar eliminar */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              ¿Eliminar este mantenimiento?
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Este registro será eliminado de forma permanente.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-5">
              A diferencia de activos y empleados, los mantenimientos no tienen
              papelera. Esta acción no se puede deshacer.
            </p>
            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
                {apiError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmDeleteId(null);
                  setApiError("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
