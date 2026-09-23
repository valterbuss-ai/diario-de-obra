import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  /** Detalhe técnico da última falha de login (status HTTP), para diagnosticar. */
  diagnostico: string | null;
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
  const [diagnostico, setDiagnostico] = useState<string | null>(null);

  async function login(email: string, senha: string) {
    setLoading(true);
    setError(null);
    setDiagnostico(null);
    try {
      const { data } = await api.post("/auth/login", { email, senha });
      localStorage.setItem("diario:token", data.token);
      localStorage.setItem("diario:usuario", JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return data.usuario as Usuario;
    } catch (err: any) {
      // Sem resposta = o servidor não foi alcançado (sem internet, ou o servidor gratuito
      // ainda acordando, o que leva até 1 minuto). É diferente de senha errada.
      const semResposta = !err.response;
      const message = semResposta
        ? "Não consegui falar com o servidor. Ele pode estar iniciando: aguarde 1 minuto e tente de novo."
        : (err.response.data?.message ?? "Não foi possível entrar. Tente novamente.");
      setDiagnostico(semResposta ? `sem resposta do servidor (${err.code ?? err.message})` : `servidor respondeu ${err.response.status}`);
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
    <AuthContext.Provider value={{ usuario, loading, error, diagnostico, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return ctx;
}
