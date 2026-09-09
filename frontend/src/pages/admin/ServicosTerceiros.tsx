import { CrudPage } from "../../components/CrudPage";
import type { Servico } from "../../types";

// Usa o mesmo cadastro de Serviços (tabela "servico" no backend), só que
// filtrado/criado com tipo: "terceirizado" — é a lista que aparece na Tela 1
// do app quando quem está logado é um prestador terceirizado.
export function ServicosTerceiros() {
  return (
    <CrudPage<Servico>
      title="Serviços de Terceiros"
      description="Tipos de serviço disponíveis para prestadores de serviço terceirizados no app de campo."
      endpoint="/servicos-terceiros"
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
        { name: "nome", label: "Nome (ex: Instalação elétrica)", type: "text", required: true },
        { name: "codigo", label: "Código (ex: TER-01)", type: "text", required: true },
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
