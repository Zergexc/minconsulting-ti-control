import api from "./client";

export interface Employee {
  id: number;
  full_name: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  is_active: boolean;
}

export async function fetchEmployees(params?: Record<string, string>) {
  const { data } = await api.get<Employee[]>("/employees/", { params });
  return data;
}

export async function createEmployee(payload: Partial<Employee>) {
  const { data } = await api.post<Employee>("/employees", payload);
  return data;
}

export async function updateEmployee(id: number, payload: Partial<Employee>) {
  const { data } = await api.patch<Employee>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: number) {
  await api.delete(`/employees/${id}`);
}
