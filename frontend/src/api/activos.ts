import api from "./client";

export interface EquipoDetalle {
  id: number;
  hostname: string | null;
  procesador: string | null;
  ram_gb: number | null;
  almacenamiento: string | null;
  sistema_operativo: string | null;
  mac_address: string | null;
  ip_address: string | null;
}

export interface Activo {
  id: number;
  codigo_patrimonial: string | null;
  tipo: string;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  estado: string;
  ubicacion: string | null;
  fecha_compra: string | null;
  fecha_garantia: string | null;
  notas: string | null;
  is_active: boolean;
  equipo_detalle: EquipoDetalle | null;
}

export interface EquipoDetalleInput {
  hostname?: string;
  procesador?: string;
  ram_gb?: number | null;
  almacenamiento?: string;
  sistema_operativo?: string;
  mac_address?: string;
  ip_address?: string;
}

export interface ActivoCreate {
  tipo: string;
  codigo_patrimonial?: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  estado?: string;
  ubicacion?: string;
  fecha_compra?: string;
  fecha_garantia?: string;
  notas?: string;
  equipo_detalle?: EquipoDetalleInput;
}

export interface ActivoUpdate extends Partial<ActivoCreate> {
  is_active?: boolean;
}

export const TIPOS_ACTIVO = [
  { value: "laptop", label: "Laptop" },
  { value: "pc", label: "PC" },
  { value: "workstation", label: "Workstation" },
  { value: "monitor", label: "Monitor" },
  { value: "nas", label: "NAS" },
  { value: "celular", label: "Celular" },
  { value: "impresora", label: "Impresora" },
  { value: "otro", label: "Otro" },
] as const;

export const ESTADOS_ACTIVO = [
  { value: "operativo", label: "Operativo", color: "bg-green-100 text-green-700" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-yellow-100 text-yellow-700" },
  { value: "reparar", label: "Por reparar", color: "bg-orange-100 text-orange-700" },
  { value: "dañado", label: "Dañado", color: "bg-red-100 text-red-700" },
  { value: "descartado", label: "Descartado", color: "bg-gray-100 text-gray-500" },
  { value: "prestado", label: "Prestado", color: "bg-blue-100 text-blue-700" },
  { value: "retirado", label: "Retirado", color: "bg-purple-100 text-purple-700" },
] as const;

export const TIPOS_CON_DETALLE = ["laptop", "pc", "workstation"];

export async function fetchActivos(params?: Record<string, string>) {
  const { data } = await api.get<Activo[]>("/activos/", { params });
  return data;
}

export async function createActivo(payload: ActivoCreate) {
  const { data } = await api.post<Activo>("/activos/", payload);
  return data;
}

export async function updateActivo(id: number, payload: ActivoUpdate) {
  const { data } = await api.patch<Activo>(`/activos/${id}`, payload);
  return data;
}

export async function deactivateActivo(id: number) {
  await api.delete(`/activos/${id}`);
}
