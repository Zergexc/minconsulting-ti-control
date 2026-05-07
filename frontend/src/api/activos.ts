import api from "./client";

export interface Activo {
  id: number;
  tipo: string;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  estado: string;
  fecha_compra: string | null;
  notas: string | null;
  is_active: boolean;
}

export async function fetchActivos(params?: Record<string, string>) {
  const { data } = await api.get<Activo[]>("/activos/", { params });
  return data;
}

export async function createActivo(payload: Partial<Activo>) {
  const { data } = await api.post<Activo>("/activos", payload);
  return data;
}

export async function updateActivo(id: number, payload: Partial<Activo>) {
  const { data } = await api.patch<Activo>(`/activos/${id}`, payload);
  return data;
}

export async function deleteActivo(id: number) {
  await api.delete(`/activos/${id}`);
}
