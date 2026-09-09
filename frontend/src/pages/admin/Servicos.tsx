import { CrudPage } from "../../components/CrudPage";
import type { Servico } from "../../types";

export function Servicos() {
  return (
    <CrudPage<Servico>
      title="Serviços"
      description="Tipos de serviço executados pelas equipes de campo."
      endpoint="/servicos"
      searchPlaceholder="Buscar por nome ou código..."
      matchesSearch={(item, term) => item.nome.toLowerCase().includes(term) || item.codigo.toLowerCase().includes(term)}
      emptyItem={{ nome: "", codigo: "", status: "ativo" }}
      columns={[
        { key: "nome", label: "Serviço" },
        { key: "codigo", label: "Código" },
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
        { name: "nome", label: "Nome (ex: Tapa-buraco)", type: "text", required: true },
        { name: "codigo", label: "Código (ex: SRV-01)", type: "text", required: true },
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
