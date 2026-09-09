import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ReactNode } from "react";
import type { PerfilUsuario } from "../types";

export function ProtectedRoute({ perfis, children }: { perfis: PerfilUsuario[]; children: ReactNode }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!perfis.includes(usuario.perfil)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
