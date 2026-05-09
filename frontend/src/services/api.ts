import axios from "axios";

export const ACCESS_TOKEN_KEY = "hsdash_access_token";

export function setAccessToken(token: string | null | undefined) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

