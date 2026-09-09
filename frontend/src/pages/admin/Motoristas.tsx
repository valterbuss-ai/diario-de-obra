import { CrudPage } from "../../components/CrudPage";
import type { Motorista } from "../../types";

export function Motoristas() {
  return (
    <CrudPage<Motorista>
      title="Motoristas"
      description="Cadastro de motoristas habilitados a operar os veículos da frota."
      endpoint="/motoristas"
      searchPlaceholder="Buscar por nome ou CPF..."
      matchesSearch={(item, term) => item.nome.toLowerCase().includes(term) || item.cpf.toLowerCase().includes(term)}
      emptyItem={{ nome: "", cpf: "", cnh: "", status: "ativo" }}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "cpf", label: "CPF" },
        { key: "cnh", label: "CNH" },
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
        { name: "nome", label: "Nome completo", type: "text", required: true },
        { name: "cpf", label: "CPF", type: "text", required: true },
        { name: "cnh", label: "CNH", type: "text", required: true },
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
