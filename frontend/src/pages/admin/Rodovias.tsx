import { CrudPage } from "../../components/CrudPage";
import type { Rodovia } from "../../types";

export function Rodovias() {
  return (
    <CrudPage<Rodovia>
      title="Rodovias"
      description="Trechos de rodovias e faixas de km usados para preencher a cidade automaticamente no app do operador."
      endpoint="/rodovias"
      searchPlaceholder="Buscar por rodovia ou cidade..."
      matchesSearch={(item, term) => item.rodovia.toLowerCase().includes(term) || item.cidade.toLowerCase().includes(term)}
      emptyItem={{ rodovia: "", trecho: "", kmInicio: "", kmFim: "", cidade: "" }}
      columns={[
        { key: "rodovia", label: "Rodovia" },
        { key: "trecho", label: "Trecho" },
        { key: "kmInicio", label: "Km início" },
        { key: "kmFim", label: "Km fim" },
        { key: "cidade", label: "Cidade" },
      ]}
      fields={[
        { name: "rodovia", label: "Rodovia (ex: BR-280)", type: "text", required: true },
        { name: "trecho", label: "Trecho (ex: Jaraguá — Guaramirim)", type: "text", required: true },
        { name: "kmInicio", label: "Km início", type: "number", step: "0.1", required: true },
        { name: "kmFim", label: "Km fim", type: "number", step: "0.1", required: true },
        { name: "cidade", label: "Cidade", type: "text", required: true },
      ]}
    />
  );
}
