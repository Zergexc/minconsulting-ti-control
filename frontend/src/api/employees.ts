import api from "./client";

export interface Employee {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  hire_date: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface EmployeeCreate {
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
  position?: string;
  phone?: string;
  hire_date?: string;
  notes?: string;
}

export interface EmployeeUpdate extends Partial<EmployeeCreate> {
  is_active?: boolean;
}

export async function fetchEmployees(params?: Record<string, string>) {
  const { data } = await api.get<Employee[]>("/employees/", { params });
  return data;
}

export async function createEmployee(payload: EmployeeCreate) {
  const { data } = await api.post<Employee>("/employees/", payload);
  return data;
}

export async function updateEmployee(id: number, payload: EmployeeUpdate) {
  const { data } = await api.patch<Employee>(`/employees/${id}`, payload);
  return data;
}

export async function deactivateEmployee(id: number) {
  await api.delete(`/employees/${id}`);
}
