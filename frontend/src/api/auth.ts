import api from "./client";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  full_name: string | null;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
  return data;
}
