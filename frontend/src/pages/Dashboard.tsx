import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../api/dashboard";
import { Monitor, Users, ClipboardList, Wrench, Package } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error al cargar estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Activos"
          value={data.total_activos}
          icon={<Package size={22} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Operativos"
          value={data.activos_operativos}
          icon={<Monitor size={22} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Prestados"
          value={data.activos_prestados}
          icon={<ClipboardList size={22} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          label="En Mantenimiento"
          value={data.activos_mantenimiento}
          icon={<Wrench size={22} className="text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          label="Empleados Activos"
          value={data.total_empleados}
          icon={<Users size={22} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Asignaciones Activas"
          value={data.asignaciones_activas}
          icon={<ClipboardList size={22} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
      </div>

      {Object.keys(data.activos_por_tipo).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activos por tipo</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.activos_por_tipo).map(([tipo, count]) => (
              <span
                key={tipo}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 capitalize"
              >
                {tipo}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
