import { CrudPage } from "../../components/CrudPage";
import type { Clima } from "../../types";

export function Climas() {
  return (
    <CrudPage<Clima>
      title="Condições climáticas"
      description="Condições de clima disponíveis para seleção no app do operador."
      endpoint="/climas"
      searchPlaceholder="Buscar por condição..."
      matchesSearch={(item, term) => item.condicao.toLowerCase().includes(term)}
      emptyItem={{ condicao: "", icone: "", status: "ativo" }}
      columns={[
        { key: "icone", label: "Ícone", render: (item) => <span className="text-xl">{item.icone}</span> },
        { key: "condicao", label: "Condição" },
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
        { name: "condicao", label: "Condição (ex: Ensolarado)", type: "text", required: true },
        { name: "icone", label: "Ícone (emoji, ex: ☀️)", type: "text", required: true },
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
