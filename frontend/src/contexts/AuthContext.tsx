import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUsuario(): Usuario | null {
  const raw = localStorage.getItem("diario:usuario");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(readStoredUsuario);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, senha: string) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, senha });
      localStorage.setItem("diario:token", data.token);
      localStorage.setItem("diario:usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return data.usuario as Usuario;
    } catch (err: any) {
      const message = err.response?.data?.message ?? "Não foi possível entrar. Tente novamente.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("diario:token");
    localStorage.removeItem("diario:usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, error, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return ctx;
}
