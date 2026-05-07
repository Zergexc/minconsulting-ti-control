import api from "./client";

export interface DashboardStats {
  total_activos: number;
  activos_disponibles: number;
  activos_asignados: number;
  activos_mantenimiento: number;
  total_empleados: number;
  asignaciones_activas: number;
  activos_por_tipo: Record<string, number>;
}

export async function fetchStats() {
  const { data } = await api.get<DashboardStats>("/dashboard/stats");
  return data;
}
