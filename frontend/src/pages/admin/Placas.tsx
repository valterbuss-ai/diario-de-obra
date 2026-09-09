import { CrudPage } from "../../components/CrudPage";
import type { Placa } from "../../types";

export function Placas() {
  return (
    <CrudPage<Placa>
      title="Placas"
      description="Cadastro de veículos da frota utilizados no transporte de asfalto."
      endpoint="/placas"
      searchPlaceholder="Buscar por placa ou veículo..."
      matchesSearch={(item, term) => item.placa.toLowerCase().includes(term) || item.veiculo.toLowerCase().includes(term)}
      emptyItem={{ placa: "", veiculo: "", capacidade: "", tipo: "propria", status: "ativo" }}
      columns={[
        { key: "placa", label: "Placa" },
        { key: "veiculo", label: "Veículo" },
        { key: "capacidade", label: "Capacidade" },
        {
          key: "tipo",
          label: "Tipo",
          render: (item) => (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tipo === "terceirizada" ? "bg-admin/15 text-admin" : "bg-primary/15 text-primary"}`}>
              {item.tipo === "terceirizada" ? "Prestador terceirizado" : "Frota própria"}
            </span>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (item) => (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "ativo" ? "bg-success/15 text-success" : "bg-gray-500/15 text-gray-400"}`}>
              {item.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "placa", label: "Placa", type: "text", required: true },
        { name: "veiculo", label: "Veículo (marca/modelo)", type: "text", required: true },
        { name: "capacidade", label: "Capacidade (ex: 32 t)", type: "text", required: true },
        {
          name: "tipo",
          label: "Tipo",
          type: "select",
          options: [
            { value: "propria", label: "Frota própria" },
            { value: "terceirizada", label: "Prestador terceirizado" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "ativo", label: "Ativo" },
            { value: "inativo", label: "Inativo" },
          ],
        },
      ]}
    />
  );
}
