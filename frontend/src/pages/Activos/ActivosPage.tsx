import { useState, type ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, Trash2, X, ChevronDown } from "lucide-react";
import {
  fetchActivos,
  createActivo,
  updateActivo,
  deactivateActivo,
  TIPOS_ACTIVO,
  ESTADOS_ACTIVO,
  TIPOS_CON_DETALLE,
  type Activo,
  type ActivoCreate,
} from "../../api/activos";

// ─── form state ───────────────────────────────────────────────────────────────

interface ActivoForm {
  codigo_patrimonial: string;
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: string;
  ubicacion: string;
  fecha_compra: string;
  fecha_garantia: string;
  notas: string;
  // equipo detalle
  hostname: string;
  procesador: string;
  ram_gb: string;
  almacenamiento: string;
  sistema_operativo: string;
  ip_address: string;
  mac_address: string;
}

const EMPTY: ActivoForm = {
  codigo_patrimonial: "",
  tipo: "",
  marca: "",
  modelo: "",
  serial: "",
  estado: "operativo",
  ubicacion: "",
  fecha_compra: "",
  fecha_garantia: "",
  notas: "",
  hostname: "",
  procesador: "",
  ram_gb: "",
  almacenamiento: "",
  sistema_operativo: "",
  ip_address: "",
  mac_address: "",
};

function activoToForm(a: Activo): ActivoForm {
  const d = a.equipo_detalle;
  return {
    codigo_patrimonial: a.codigo_patrimonial ?? "",
    tipo: a.tipo,
    marca: a.marca ?? "",
    modelo: a.modelo ?? "",
    serial: a.serial ?? "",
    estado: a.estado,
    ubicacion: a.ubicacion ?? "",
    fecha_compra: a.fecha_compra ?? "",
    fecha_garantia: a.fecha_garantia ?? "",
    notas: a.notas ?? "",
    hostname: d?.hostname ?? "",
    procesador: d?.procesador ?? "",
    ram_gb: d?.ram_gb != null ? String(d.ram_gb) : "",
    almacenamiento: d?.almacenamiento ?? "",
    sistema_operativo: d?.sistema_operativo ?? "",
    ip_address: d?.ip_address ?? "",
    mac_address: d?.mac_address ?? "",
  };
}

function estadoColor(estado: string): string {
  return (
    ESTADOS_ACTIVO.find((e) => e.value === estado)?.color ??
    "bg-gray-100 text-gray-500"
  );
}

function tipoLabel(tipo: string): string {
  return TIPOS_ACTIVO.find((t) => t.value === tipo)?.label ?? tipo;
}

// ─── helper components ───────────────────────────────────────────────────────

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

// ─── página ──────────────────────────────────────────────────────────────────

export default function ActivosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activo | null>(null);
  const [form, setForm] = useState<ActivoForm>(EMPTY);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [apiError, setApiError] = useState("");

  // ── queries ────────────────────────────────────────────────────────────────

  const queryParams: Record<string, string> = {};
  if (searchApplied) queryParams.search = searchApplied;
  if (filterTipo) queryParams.tipo = filterTipo;
  if (filterEstado) queryParams.estado = filterEstado;

  const { data = [], isLoading } = useQuery({
    queryKey: ["activos", searchApplied, filterTipo, filterEstado],
    queryFn: () => fetchActivos(Object.keys(queryParams).length ? queryParams : undefined),
  });

  // ── mutations ──────────────────────────────────────────────────────────────

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["activos"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: ActivoCreate) => createActivo(payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActivoCreate }) =>
      updateActivo(id, payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e: unknown) => setApiError(extractError(e)),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateActivo,
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

  function openEdit(a: Activo) {
    setEditing(a);
    setForm(activoToForm(a));
    setApiError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setApiError("");
  }

  function set(field: keyof ActivoForm) {
    return (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function buildPayload(): ActivoCreate {
    const hasDetail =
      TIPOS_CON_DETALLE.includes(form.tipo) &&
      (form.hostname || form.procesador || form.ram_gb || form.almacenamiento ||
        form.sistema_operativo || form.ip_address || form.mac_address);

    return {
      codigo_patrimonial: form.codigo_patrimonial.trim() || undefined,
      tipo: form.tipo,
      marca: form.marca.trim() || undefined,
      modelo: form.modelo.trim() || undefined,
      serial: form.serial.trim() || undefined,
      estado: form.estado || "operativo",
      ubicacion: form.ubicacion.trim() || undefined,
      fecha_compra: form.fecha_compra || undefined,
      fecha_garantia: form.fecha_garantia || undefined,
      notas: form.notas.trim() || undefined,
      equipo_detalle: hasDetail
        ? {
            hostname: form.hostname.trim() || undefined,
            procesador: form.procesador.trim() || undefined,
            ram_gb: form.ram_gb ? parseInt(form.ram_gb) : undefined,
            almacenamiento: form.almacenamiento.trim() || undefined,
            sistema_operativo: form.sistema_operativo.trim() || undefined,
            ip_address: form.ip_address.trim() || undefined,
            mac_address: form.mac_address.trim() || undefined,
          }
        : undefined,
    };
  }

  function handleSubmit() {
    if (!form.tipo) {
      setApiError("El tipo de activo es obligatorio");
      return;
    }
    setApiError("");
    const payload = buildPayload();
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const showDetalle = TIPOS_CON_DETALLE.includes(form.tipo);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo activo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchApplied(search)}
            placeholder="Buscar por código, marca, serial..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="relative">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_ACTIVO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_ACTIVO.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={() => setSearchApplied(search)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Buscar
        </button>

        {(searchApplied || filterTipo || filterEstado) && (
          <button
            onClick={() => { setSearch(""); setSearchApplied(""); setFilterTipo(""); setFilterEstado(""); }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-gray-400 py-8 text-center">Cargando activos...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código / Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca / Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Serie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((activo) => (
                <tr key={activo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-500">
                      {activo.codigo_patrimonial ?? <span className="italic text-gray-300">sin código</span>}
                    </p>
                    <p className="font-medium text-gray-900 capitalize">{tipoLabel(activo.tipo)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{activo.marca ?? "—"}</p>
                    <p className="text-xs text-gray-400">{activo.modelo ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {activo.serial ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(activo.estado)}`}>
                      {ESTADOS_ACTIVO.find((e) => e.value === activo.estado)?.label ?? activo.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{activo.ubicacion ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(activo)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmId(activo.id)}
                        title="Dar de baja"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {searchApplied || filterTipo || filterEstado
                      ? "No se encontraron activos con los filtros aplicados"
                      : "No hay activos registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              {data.length} activo{data.length !== 1 ? "s" : ""}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 text-lg">
                {editing ? "Editar activo" : "Nuevo activo"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X size={18} />
              </button>
            </div>

            {/* body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* datos generales */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos generales</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tipo de activo" required>
                      <select className={SELECT} value={form.tipo} onChange={set("tipo")}>
                        <option value="">Seleccionar...</option>
                        {TIPOS_ACTIVO.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Estado">
                      <select className={SELECT} value={form.estado} onChange={set("estado")}>
                        {ESTADOS_ACTIVO.map((e) => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marca">
                      <input className={INPUT} value={form.marca} onChange={set("marca")} placeholder="Ej: Dell, HP, Lenovo" />
                    </Field>
                    <Field label="Modelo">
                      <input className={INPUT} value={form.modelo} onChange={set("modelo")} placeholder="Ej: Latitude 5520" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="N° de serie">
                      <input className={INPUT} value={form.serial} onChange={set("serial")} placeholder="SN-XXXX" />
                    </Field>
                    <Field label="Código patrimonial">
                      <input className={INPUT} value={form.codigo_patrimonial} onChange={set("codigo_patrimonial")} placeholder="PAT-001" />
                    </Field>
                  </div>

                  <Field label="Ubicación">
                    <input className={INPUT} value={form.ubicacion} onChange={set("ubicacion")} placeholder="Ej: Oficina 3, Piso 2" />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Fecha de compra">
                      <input className={INPUT} type="date" value={form.fecha_compra} onChange={set("fecha_compra")} />
                    </Field>
                    <Field label="Fin de garantía">
                      <input className={INPUT} type="date" value={form.fecha_garantia} onChange={set("fecha_garantia")} />
                    </Field>
                  </div>

                  <Field label="Observaciones">
                    <textarea
                      className={INPUT + " resize-none"}
                      rows={2}
                      value={form.notas}
                      onChange={set("notas")}
                      placeholder="Notas adicionales..."
                    />
                  </Field>
                </div>
              </div>

              {/* detalle técnico — solo laptops, PCs y workstations */}
              {showDetalle && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Detalle técnico
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Hostname">
                        <input className={INPUT} value={form.hostname} onChange={set("hostname")} placeholder="PC-USUARIO01" />
                      </Field>
                      <Field label="Sistema operativo">
                        <input className={INPUT} value={form.sistema_operativo} onChange={set("sistema_operativo")} placeholder="Windows 11 Pro" />
                      </Field>
                    </div>
                    <Field label="Procesador">
                      <input className={INPUT} value={form.procesador} onChange={set("procesador")} placeholder="Intel Core i7-1165G7" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="RAM (GB)">
                        <input className={INPUT} type="number" min={0} value={form.ram_gb} onChange={set("ram_gb")} placeholder="16" />
                      </Field>
                      <Field label="Almacenamiento">
                        <input className={INPUT} value={form.almacenamiento} onChange={set("almacenamiento")} placeholder="512 GB SSD" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Dirección IP">
                        <input className={INPUT} value={form.ip_address} onChange={set("ip_address")} placeholder="192.168.1.100" />
                      </Field>
                      <Field label="Dirección MAC">
                        <input className={INPUT} value={form.mac_address} onChange={set("mac_address")} placeholder="AA:BB:CC:DD:EE:FF" />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

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
                {isSaving ? "Guardando..." : editing ? "Guardar cambios" : "Crear activo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación baja */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">¿Dar de baja este activo?</h3>
            <p className="text-sm text-gray-500 mb-5">
              El activo quedará inactivo y no aparecerá en los listados. Su historial se conserva.
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
                {deactivateMutation.isPending ? "Procesando..." : "Dar de baja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
