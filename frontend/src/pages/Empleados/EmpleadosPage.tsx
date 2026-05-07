import { useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, UserX, X } from "lucide-react";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  type Employee,
  type EmployeeCreate,
} from "../../api/employees";

// ─── tipos locales ───────────────────────────────────────────────────────────

interface EmpForm {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  phone: string;
  hire_date: string;
  notes: string;
}

const EMPTY: EmpForm = {
  first_name: "",
  last_name: "",
  email: "",
  department: "",
  position: "",
  phone: "",
  hire_date: "",
  notes: "",
};

function empToForm(e: Employee): EmpForm {
  return {
    first_name: e.first_name ?? "",
    last_name: e.last_name ?? "",
    email: e.email ?? "",
    department: e.department ?? "",
    position: e.position ?? "",
    phone: e.phone ?? "",
    hire_date: e.hire_date ?? "",
    notes: e.notes ?? "",
  };
}

// ─── componentes menores ─────────────────────────────────────────────────────

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

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

// ─── página ──────────────────────────────────────────────────────────────────

export default function EmpleadosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmpForm>(EMPTY);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [apiError, setApiError] = useState("");

  // ── queries ────────────────────────────────────────────────────────────────

  const { data = [], isLoading } = useQuery({
    queryKey: ["employees", searchApplied],
    queryFn: () =>
      fetchEmployees(searchApplied ? { search: searchApplied } : undefined),
  });

  // ── mutations ──────────────────────────────────────────────────────────────

  const invalidate = () => qc.invalidateQueries({ queryKey: ["employees"] });

  const createMutation = useMutation({
    mutationFn: (payload: EmployeeCreate) => createEmployee(payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmployeeCreate }) =>
      updateEmployee(id, payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => { invalidate(); setConfirmId(null); },
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  function extractError(e: unknown): string {
    if (e && typeof e === "object" && "response" in e) {
      const res = (e as { response?: { data?: { detail?: string } } }).response;
      return res?.data?.detail ?? "Error al guardar";
    }
    return "Error al guardar";
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setApiError("");
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm(empToForm(emp));
    setApiError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setApiError("");
  }

  function set(field: keyof EmpForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setApiError("Nombres y apellidos son obligatorios");
      return;
    }
    setApiError("");
    const payload: EmployeeCreate = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || undefined,
      department: form.department.trim() || undefined,
      position: form.position.trim() || undefined,
      phone: form.phone.trim() || undefined,
      hire_date: form.hire_date || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo empleado
        </button>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchApplied(search)}
            placeholder="Buscar por nombre, área, email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={() => setSearchApplied(search)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Buscar
        </button>
        {searchApplied && (
          <button
            onClick={() => { setSearch(""); setSearchApplied(""); }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-gray-400 py-8 text-center">Cargando empleados...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Área / Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{emp.full_name}</p>
                    {emp.hire_date && (
                      <p className="text-xs text-gray-400">Ingreso: {emp.hire_date}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{emp.department ?? "—"}</p>
                    <p className="text-xs text-gray-400">{emp.position ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge active={emp.is_active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {emp.is_active && (
                        <button
                          onClick={() => setConfirmId(emp.id)}
                          title="Desactivar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <UserX size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {searchApplied
                      ? `No se encontraron resultados para "${searchApplied}"`
                      : "No hay empleados registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              {data.length} empleado{data.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">
                {editing ? "Editar empleado" : "Nuevo empleado"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            {/* body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombres" required>
                  <input className={INPUT} value={form.first_name} onChange={set("first_name")} placeholder="Ej: Juan Carlos" />
                </Field>
                <Field label="Apellidos" required>
                  <input className={INPUT} value={form.last_name} onChange={set("last_name")} placeholder="Ej: Pérez López" />
                </Field>
              </div>

              <Field label="Correo corporativo">
                <input className={INPUT} type="email" value={form.email} onChange={set("email")} placeholder="nombre@empresa.com" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Área">
                  <input className={INPUT} value={form.department} onChange={set("department")} placeholder="Ej: Operaciones" />
                </Field>
                <Field label="Cargo">
                  <input className={INPUT} value={form.position} onChange={set("position")} placeholder="Ej: Analista TI" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <input className={INPUT} value={form.phone} onChange={set("phone")} placeholder="+51 999 999 999" />
                </Field>
                <Field label="Fecha de ingreso">
                  <input className={INPUT} type="date" value={form.hire_date} onChange={set("hire_date")} />
                </Field>
              </div>

              <Field label="Observaciones">
                <textarea
                  className={INPUT + " resize-none"}
                  rows={3}
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="Notas adicionales..."
                />
              </Field>

              {apiError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
              )}
            </div>

            {/* footer */}
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
                {isSaving ? "Guardando..." : editing ? "Guardar cambios" : "Crear empleado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación desactivar */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">¿Desactivar empleado?</h3>
            <p className="text-sm text-gray-500 mb-5">
              El empleado quedará inactivo. Su historial se conserva y puede reactivarse editando el registro.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => deactivateMutation.mutate(confirmId)}
                disabled={deactivateMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
