import { api } from "../../lib/axiosInstance";

export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

export const login = async (name: string, email: string): Promise<User> => {
  const response = await api.post("/auth/login", { name, email });
  const data = response as unknown as Record<string, any>;
  
  if (!data) {
    throw new Error("Empty response from server");
  }
  if (typeof data === 'string') {
    throw new Error("Server returned HTML instead of JSON. Is the server running?");
  }
  if (!data.token) {
    throw new Error("Server response missing token field");
  }
  return data as User;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", user.token);
  // Also set cookie for middleware
  document.cookie = `token=${user.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
};

export const logout = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  // Clear cookie
  document.cookie = "token=; path=/; max-age=0";
};
