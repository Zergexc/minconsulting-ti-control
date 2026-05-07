import { useQuery } from "@tanstack/react-query";
import { fetchActivos } from "../../api/activos";

const ESTADO_COLORS: Record<string, string> = {
  disponible: "bg-green-100 text-green-700",
  asignado: "bg-blue-100 text-blue-700",
  mantenimiento: "bg-yellow-100 text-yellow-700",
  baja: "bg-red-100 text-red-700",
  almacen: "bg-gray-100 text-gray-600",
};

export default function ActivosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["activos"],
    queryFn: () => fetchActivos(),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activos</h1>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
          + Nuevo activo
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre / Marca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.map((activo) => (
                <tr key={activo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{activo.nombre ?? activo.marca ?? "—"}</p>
                    <p className="text-xs text-gray-400">{activo.modelo}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{activo.tipo}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{activo.serial ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[activo.estado] ?? "bg-gray-100 text-gray-600"}`}>
                      {activo.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay activos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
