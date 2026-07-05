import { apiClient } from "@/app/lib/api";
import { AuthResponse } from "@/app/types";
import { setCookie, deleteCookie } from "cookies-next";

export const AuthService = {
  async login(credentials: Record<string, string>): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setCookie("token", data.accessToken, { maxAge: 86400, path: "/" });
    return data;
  },

  async register(data: Record<string, string>): Promise<AuthResponse> {
    const res = await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setCookie("token", res.accessToken, { maxAge: 86400, path: "/" });
    return res;
  },

  logout() {
    deleteCookie("token", { path: "/" });
  },
};
