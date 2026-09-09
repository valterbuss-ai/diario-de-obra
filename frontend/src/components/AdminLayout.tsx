import {
  Cloud,
  FileSignature,
  Fuel,
  Gauge,
  HardHat,
  LayoutDashboard,
  LogOut,
  Route,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/motoristas", label: "Motoristas", icon: Users },
  { to: "/admin/placas", label: "Placas", icon: Truck },
  { to: "/admin/contratos", label: "Contratos", icon: FileSignature },
  { to: "/admin/servicos", label: "Serviços", icon: Wrench },
  { to: "/admin/servicos-terceiros", label: "Serviços de Terceiros", icon: HardHat },
  { to: "/admin/usinas", label: "Usinas", icon: Fuel },
  { to: "/admin/rodovias", label: "Rodovias", icon: Route },
  { to: "/admin/climas", label: "Condições climáticas", icon: Cloud },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin/15">
            <Gauge className="h-5 w-5 text-admin" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Diário de Obra</p>
            <p className="text-xs text-gray-500">Painel administrativo</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-admin/15 text-admin" : "text-gray-400 hover:bg-surface-alt hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-sm font-medium text-white">{usuario?.nome}</p>
          <p className="truncate text-xs text-gray-500">{usuario?.email}</p>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-gray-400 hover:border-admin hover:text-admin"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
