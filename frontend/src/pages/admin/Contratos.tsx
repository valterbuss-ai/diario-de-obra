import { CrudPage } from "../../components/CrudPage";
import type { Contrato } from "../../types";

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function Contratos() {
  return (
    <CrudPage<Contrato>
      title="Contratos"
      description="Contratos vigentes com órgãos públicos (DER, DNIT, prefeituras)."
      endpoint="/contratos"
      searchPlaceholder="Buscar por código ou órgão..."
      matchesSearch={(item, term) => item.codigo.toLowerCase().includes(term) || item.orgao.toLowerCase().includes(term)}
      emptyItem={{ codigo: "", orgao: "", descricao: "", vigenciaInicio: "", vigenciaFim: "", status: "ativo" }}
      columns={[
        { key: "codigo", label: "Código" },
        { key: "orgao", label: "Órgão" },
        { key: "descricao", label: "Descrição" },
        {
          key: "vigencia",
          label: "Vigência",
          render: (item) => `${formatDate(item.vigenciaInicio)} — ${formatDate(item.vigenciaFim)}`,
        },
        {
          key: "status",
          label: "Status",
          render: (item) => (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "ativo" ? "bg-success/15 text-success" : "bg-gray-500/15 text-gray-400"}`}>
              {item.status === "ativo" ? "Ativo" : "Encerrado"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "codigo", label: "Código (ex: CT-2024-137)", type: "text", required: true },
        { name: "orgao", label: "Órgão (ex: DER/SC, DNIT)", type: "text", required: true },
        { name: "descricao", label: "Descrição", type: "text", required: true },
        { name: "vigenciaInicio", label: "Vigência — início", type: "date", required: true },
        { name: "vigenciaFim", label: "Vigência — fim", type: "date", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "ativo", label: "Ativo" },
            { value: "encerrado", label: "Encerrado" },
          ],
        },
      ]}
    />
  );
}
