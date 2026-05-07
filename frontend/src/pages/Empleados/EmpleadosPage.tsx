import { useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "../../api/employees";

export default function EmpleadosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmployees(),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 transition-colors">
          + Nuevo empleado
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.position ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.email ?? "—"}</td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay empleados registrados
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
