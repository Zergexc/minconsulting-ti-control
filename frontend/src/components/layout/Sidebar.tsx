import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  Users,
  ClipboardList,
  Wrench,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/activos", label: "Activos", icon: Monitor },
  { to: "/empleados", label: "Empleados", icon: Users },
  { to: "/asignaciones", label: "Asignaciones", icon: ClipboardList },
  { to: "/mantenimientos", label: "Mantenimientos", icon: Wrench },
];

export default function Sidebar() {
  const { logout, fullName, role } = useAuthStore();

  return (
    <aside className="w-60 min-h-screen bg-brand-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-blue-800">
        <p className="text-xs text-blue-300 uppercase tracking-wider">Gestión TI</p>
        <p className="font-bold text-lg leading-tight">Minconsulting</p>
      </div>

      <nav className="flex-1 py-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-brand-600 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-blue-800">
        <p className="text-sm font-medium truncate">{fullName ?? "Usuario"}</p>
        <p className="text-xs text-blue-300 mb-3">{role}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-blue-300 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
