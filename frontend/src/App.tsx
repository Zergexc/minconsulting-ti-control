import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ActivosPage from "./pages/Activos/ActivosPage";
import EmpleadosPage from "./pages/Empleados/EmpleadosPage";
import AsignacionesPage from "./pages/Asignaciones/AsignacionesPage";
import MantenimientosPage from "./pages/Mantenimientos/MantenimientosPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="activos" element={<ActivosPage />} />
          <Route path="empleados" element={<EmpleadosPage />} />
          <Route path="asignaciones" element={<AsignacionesPage />} />
          <Route path="mantenimientos" element={<MantenimientosPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
