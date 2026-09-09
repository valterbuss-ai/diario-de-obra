import { HardHat, LogIn } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { usuario, login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const logged = await login(email, senha);
      if (logged.perfil === "operador") navigate("/operador/equipe");
      else if (logged.perfil === "gestor") navigate("/admin");
      else navigate("/engenheiro");
    } catch {
      // erro já exposto via contexto
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <HardHat className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white">Diário de Obra</h1>
          <p className="text-sm text-gray-400">Entre com seu email e senha para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@obra.com"
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-300">Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface-alt px-4 py-3 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-black transition hover:bg-primary-dark disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 space-y-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-xs text-gray-500">
          <p>admin@obra.com · admin123 (gestor)</p>
          <p>operador@obra.com · op123 (operador)</p>
          <p>engenheiro@obra.com · eng123 (engenheiro)</p>
        </div>
      </div>
    </div>
  );
}
