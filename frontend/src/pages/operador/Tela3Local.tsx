import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OperadorLayout } from "../../components/OperadorLayout";
import { PhotoSlot } from "../../components/PhotoSlot";
import { SelectField, TextAreaField, TextField } from "../../components/FormField";
import { useAuth } from "../../contexts/AuthContext";
import { useRegistroDraft } from "../../contexts/RegistroContext";
import { api } from "../../services/api";
import { useApiList } from "../../services/hooks";
import type { Placa, Servico, Usina } from "../../types";

const FOTOS: { tipo: "antes" | "durante" | "depois" | "trena"; label: string }[] = [
  { tipo: "antes", label: "Antes" },
  { tipo: "durante", label: "Durante" },
  { tipo: "depois", label: "Depois" },
  { tipo: "trena", label: "Trena" },
];

export function Tela3Local() {
  const { draft, updateDraft, updateFoto, submitDraft, resetLocal, submitting, submitError } = useRegistroDraft();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { data: rodoviasOpcoes } = useApiList<string>("/rodovias/opcoes");
  const { data: placas } = useApiList<Placa>("/placas");
  const { data: servicos } = useApiList<Servico>(usuario?.perfil === "terceirizado" ? "/servicos-terceiros" : "/servicos");
  const { data: usinas } = useApiList<Usina>("/usinas");

  const placa = placas.find((p) => p.id === draft.placaId)?.placa;
  const servico = servicos.find((s) => s.id === draft.servicoId)?.nome;
  const usina = usinas.find((u) => u.id === draft.usinaId)?.nome;
  const resumoEquipeCarga = [draft.motoristaNome, placa, servico, usina, draft.numeroTicket && `Ticket ${draft.numeroTicket}`]
    .filter(Boolean)
    .join(" · ");

  const [cidadeStatus, setCidadeStatus] = useState<"idle" | "buscando" | "encontrada" | "nao-encontrada">("idle");

  useEffect(() => {
    const km = Number(draft.km);
    if (!draft.rodoviaNome || !draft.km || Number.isNaN(km)) {
      setCidadeStatus("idle");
      updateDraft({ cidade: "", rodoviaId: "" });
      return;
    }

    let active = true;
    setCidadeStatus("buscando");
    const timer = setTimeout(() => {
      api
        .get("/rodovias/lookup", { params: { rodovia: draft.rodoviaNome, km } })
        .then((res) => {
          if (!active) return;
          updateDraft({ cidade: res.data.cidade, rodoviaId: res.data.rodoviaId });
          setCidadeStatus("encontrada");
        })
        .catch(() => {
          if (!active) return;
          updateDraft({ cidade: "", rodoviaId: "" });
          setCidadeStatus("nao-encontrada");
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.rodoviaNome, draft.km]);

  const fotosCount = FOTOS.filter((f) => draft.fotos[f.tipo]).length;

  const podeFinalizar =
    draft.rodoviaId !== "" &&
    draft.cidade !== "" &&
    Number(draft.comprimento) > 0 &&
    Number(draft.largura) > 0 &&
    Number(draft.espessura) > 0 &&
    draft.lado !== "" &&
    fotosCount === 4 &&
    !submitting;

  async function handleSalvar() {
    try {
      await submitDraft("rascunho");
      // Equipe e carga ficam para o próximo registro; só a etapa 3 é limpa.
      resetLocal();
      navigate("/operador/dia");
    } catch {
      // erro exposto via contexto (submitError)
    }
  }

  return (
    <OperadorLayout step={3} title="Localização e fotos" subtitle="Registre onde o serviço foi realizado e documente com fotos.">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-alt px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500">Equipe e carga</p>
            <p className="truncate text-sm text-gray-300">{resumoEquipeCarga}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/operador/equipe")}
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Alterar
          </button>
        </div>

        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Localização</h2>

          <SelectField label="Rodovia" required value={draft.rodoviaNome} onChange={(e) => updateDraft({ rodoviaNome: e.target.value })}>
            <option value="">Selecione a rodovia</option>
            {rodoviasOpcoes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Km"
            required
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Ex: 62,5"
            value={draft.km}
            onChange={(e) => updateDraft({ km: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-300">Cidade</span>
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-base ${
                cidadeStatus === "nao-encontrada" ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-border bg-surface-alt text-gray-300"
              }`}
            >
              {cidadeStatus === "buscando" && <span className="text-gray-500">Buscando...</span>}
              {cidadeStatus === "encontrada" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {draft.cidade}
                </>
              )}
              {cidadeStatus === "nao-encontrada" && (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Trecho não localizado
                </>
              )}
              {cidadeStatus === "idle" && <span className="text-gray-500">Selecione a rodovia e informe o km</span>}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Dimensões do trecho</h2>

          <div className="grid grid-cols-3 gap-3">
            <TextField
              label="Compr. (m)"
              required
              type="number"
              step="0.1"
              value={draft.comprimento}
              onChange={(e) => updateDraft({ comprimento: e.target.value })}
            />
            <TextField
              label="Larg. (m)"
              required
              type="number"
              step="0.1"
              value={draft.largura}
              onChange={(e) => updateDraft({ largura: e.target.value })}
            />
            <TextField
              label="Esp. (m)"
              required
              type="number"
              step="0.01"
              value={draft.espessura}
              onChange={(e) => updateDraft({ espessura: e.target.value })}
            />
          </div>

          <SelectField label="Lado da pista" required value={draft.lado} onChange={(e) => updateDraft({ lado: e.target.value as any })}>
            <option value="">Selecione o lado</option>
            <option value="direito">Lado Direito</option>
            <option value="esquerdo">Lado Esquerdo</option>
          </SelectField>

          <TextAreaField
            label="Observações"
            placeholder="Opcional"
            value={draft.observacoes}
            onChange={(e) => updateDraft({ observacoes: e.target.value })}
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Registro fotográfico</h2>
            <span className={`text-sm font-semibold ${fotosCount === 4 ? "text-success" : "text-gray-400"}`}>{fotosCount} de 4 fotos registradas</span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {FOTOS.map((f) => (
              <PhotoSlot key={f.tipo} label={f.label} file={draft.fotos[f.tipo]} onChange={(file) => updateFoto(f.tipo, file)} />
            ))}
          </div>
        </section>

        {submitError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{submitError}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/operador/carga")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-4 font-semibold text-gray-300 hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <button
            type="button"
            disabled={!podeFinalizar}
            onClick={handleSalvar}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success px-4 py-4 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Salvando..." : "Salvar registro"}
          </button>
        </div>
      </div>
    </OperadorLayout>
  );
}
