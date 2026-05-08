import api from "./client";
import type { Activo } from "./activos";
import type { Employee } from "./employees";

export interface Asignacion {
  id: number;
  activo_id: number;
  employee_id: number;
  fecha_asignacion: string;
  fecha_devolucion: string | null;
  notas: string | null;
  is_active: boolean;
  activo: Activo | null;
  employee: Employee | null;
}

export interface AsignacionCreate {
  activo_id: number;
  employee_id: number;
  fecha_asignacion: string;
  notas?: string;
}

export interface AsignacionDevolucion {
  fecha_devolucion: string;
  notas?: string;
}

export async function fetchAsignaciones(params?: {
  activo_id?: number;
  employee_id?: number;
  activas?: boolean;
}): Promise<Asignacion[]> {
  const { data } = await api.get<Asignacion[]>("/assignments/", { params });
  return data;
}

export async function createAsignacion(payload: AsignacionCreate): Promise<Asignacion> {
  const { data } = await api.post<Asignacion>("/assignments/", payload);
  return data;
}

export async function registrarDevolucion(
  id: number,
  payload: AsignacionDevolucion
): Promise<Asignacion> {
  const { data } = await api.post<Asignacion>(`/assignments/${id}/devolucion`, payload);
  return data;
}
