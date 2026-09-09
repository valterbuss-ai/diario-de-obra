import { CrudPage } from "../../components/CrudPage";
import type { Usina } from "../../types";

export function Usinas() {
  return (
    <CrudPage<Usina>
      title="Usinas"
      description="Usinas de asfalto que fornecem material para os serviços."
      endpoint="/usinas"
      searchPlaceholder="Buscar por número ou nome..."
      matchesSearch={(item, term) => item.numero.toLowerCase().includes(term) || item.nome.toLowerCase().includes(term)}
      emptyItem={{ numero: "", nome: "", capacidade: "", status: "ativa" }}
      columns={[
        { key: "numero", label: "Número" },
        { key: "nome", label: "Nome / Local" },
        { key: "capacidade", label: "Capacidade" },
        {
          key: "status",
          label: "Status",
          render: (item) => (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "ativa" ? "bg-success/15 text-success" : "bg-gray-500/15 text-gray-400"}`}>
              {item.status === "ativa" ? "Ativa" : "Inativa"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "numero", label: "Número (ex: 04)", type: "text", required: true },
        { name: "nome", label: "Nome (ex: Usina Joinville)", type: "text", required: true },
        { name: "capacidade", label: "Capacidade (ex: 120 t/h)", type: "text", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "ativa", label: "Ativa" },
            { value: "inativa", label: "Inativa" },
          ],
        },
      ]}
    />
  );
}
