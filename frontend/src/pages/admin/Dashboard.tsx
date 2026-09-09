import { Cloud, FileSignature, FileStack, Fuel, Route, Truck, Users, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { DashboardResumo } from "../../types";

const cards = [
  { key: "motoristas", label: "Motoristas", to: "/admin/motoristas", icon: Users },
  { key: "placas", label: "Placas", to: "/admin/placas", icon: Truck },
  { key: "contratos", label: "Contratos", to: "/admin/contratos", icon: FileSignature },
  { key: "servicos", label: "Serviços", to: "/admin/servicos", icon: Wrench },
  { key: "usinas", label: "Usinas", to: "/admin/usinas", icon: Fuel },
  { key: "rodovias", label: "Rodovias", to: "/admin/rodovias", icon: Route },
  { key: "climas", label: "Condições climáticas", to: "/admin/climas", icon: Cloud },
  { key: "registros", label: "Registros de campo", to: "/engenheiro", icon: FileStack },
] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);

  useEffect(() => {
    api.get<DashboardResumo>("/dashboard/resumo").then((res) => setResumo(res.data));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Visão geral</h1>
        <p className="text-sm text-gray-400">Resumo dos cadastros mestres e dos registros de campo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, label, to, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigate(to)}
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 text-left transition hover:border-admin"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-admin/15">
              <Icon className="h-5 w-5 text-admin" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resumo ? (resumo as any)[key] ?? 0 : "–"}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
