import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("diario:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("diario:token");
      localStorage.removeItem("diario:usuario");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Link da foto guardada no SharePoint. A imagem é aberta por link direto, que não
 * manda cabeçalho de autenticação, então o token vai na própria URL.
 */
export function fotoUrl(fotoId: number): string | undefined {
  const token = localStorage.getItem("diario:token");
  if (!token) return undefined;
  return `${API_URL}/api/fotos/${fotoId}?token=${encodeURIComponent(token)}`;
}
