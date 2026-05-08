import api from "./client";

export const TIPOS_MANTENIMIENTO = [
  { value: "preventivo",   label: "Preventivo",   color: "bg-blue-100 text-blue-700"   },
  { value: "correctivo",   label: "Correctivo",   color: "bg-red-100 text-red-700"     },
  { value: "limpieza",     label: "Limpieza",     color: "bg-teal-100 text-teal-700"   },
  { value: "actualizacion",label: "Actualización",color: "bg-purple-100 text-purple-700"},
  { value: "otro",         label: "Otro",         color: "bg-gray-100 text-gray-500"   },
] as const;

export interface Mantenimiento {
  id: number;
  activo_id: number;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string | null;
  tecnico: string | null;
  costo: number | null;
}

export interface MantenimientoCreate {
  activo_id: number;
  fecha: string;
  tipo_mantenimiento?: string;
  descripcion?: string;
}

export interface MantenimientoUpdate {
  fecha?: string;
  tipo_mantenimiento?: string;
  descripcion?: string;
}

export async function fetchMantenimientos(params?: {
  activo_id?: number;
}): Promise<Mantenimiento[]> {
  const { data } = await api.get<Mantenimiento[]>("/maintenance/", { params });
  return data;
}

export async function createMantenimiento(
  payload: MantenimientoCreate
): Promise<Mantenimiento> {
  const { data } = await api.post<Mantenimiento>("/maintenance/", payload);
  return data;
}

export async function updateMantenimiento(
  id: number,
  payload: MantenimientoUpdate
): Promise<Mantenimiento> {
  const { data } = await api.patch<Mantenimiento>(`/maintenance/${id}`, payload);
  return data;
}

export async function deleteMantenimiento(id: number): Promise<void> {
  await api.delete(`/maintenance/${id}`);
}
