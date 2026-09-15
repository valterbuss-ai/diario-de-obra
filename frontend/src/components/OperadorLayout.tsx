import { ClipboardList, Download, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSincronizacao } from "../contexts/SincronizacaoContext";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { ThemeToggle } from "./ThemeToggle";
import { useApiList } from "../services/hooks";
import type { Registro } from "../types";

interface OperadorLayoutProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const steps = [
  { n: 1, label: "Equipe" },
  { n: 2, label: "Carga" },
  { n: 3, label: "Local e fotos" },
];

export function OperadorLayout({ step, title, subtitle, children }: OperadorLayoutProps) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { fila, online, versao } = useSincronizacao();
  const { data: pendentes } = useApiList<Registro>("/registros?status=rascunho", [versao]);
  const totalPendentes = pendentes.length + fila.length;
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <div className="min-h-screen bg-bg pb-10">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Diário de Obra · {usuario?.nome}</p>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 rounded-lg border border-primary px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-black"
                aria-label="Instalar app"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Instalar app</span>
              </button>
            )}
            <ThemeToggle className="rounded-lg border border-border p-2 text-gray-400 hover:text-primary hover:border-primary" />
            <button
              onClick={() => navigate("/operador/dia")}
              className="relative rounded-lg border border-border p-2 text-gray-400 hover:text-primary hover:border-primary"
              aria-label="Registros do dia"
            >
              <ClipboardList className="h-5 w-5" />
              {totalPendentes > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-black">
                  {totalPendentes}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-border p-2 text-gray-400 hover:text-primary hover:border-primary"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-xl items-center gap-2">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  s.n < step
                    ? "bg-success text-black"
                    : s.n === step
                    ? "bg-primary text-black"
                    : "bg-surface-alt text-gray-500 border border-border"
                }`}
              >
                {s.n}
              </div>
              <span className={`hidden text-xs sm:inline ${s.n === step ? "text-primary font-semibold" : "text-gray-500"}`}>
                {s.label}
              </span>
              {s.n < 3 && <div className={`h-0.5 flex-1 ${s.n < step ? "bg-success" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </header>

      {!online && (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-2 text-center text-xs font-semibold text-primary">
          Sem internet · os registros ficam guardados no celular e são enviados quando o sinal voltar
        </div>
      )}

      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-sm text-gray-400">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
