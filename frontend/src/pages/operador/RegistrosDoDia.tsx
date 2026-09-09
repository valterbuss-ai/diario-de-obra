import { CheckCircle2, ClipboardList, Plus, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OperadorLayout } from "../../components/OperadorLayout";
import { useRegistroDraft } from "../../contexts/RegistroContext";
import { api } from "../../services/api";
import { useApiList } from "../../services/hooks";
import type { Registro } from "../../types";

function dataHoraPtBr(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function RegistrosDoDia() {
  const navigate = useNavigate();
  const { resetDraft } = useRegistroDraft();
  const { data: pendentes, loading, error, reload } = useApiList<Registro>("/registros?status=rascunho");
  const [enviando, setEnviando] = useState(false);
  const [enviarErro, setEnviarErro] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<number | null>(null);

  function novoRegistro() {
    resetDraft();
    navigate("/operador/equipe");
  }

  async function enviarTudo() {
    setEnviando(true);
    setEnviarErro(null);
    try {
      const { data } = await api.post<{ enviados: number }>("/registros/enviar-lote");
      setEnviados(data.enviados);
      reload();
    } catch (err: any) {
      setEnviarErro(err.response?.data?.message ?? "Não foi possível enviar os registros. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <OperadorLayout step={3} title="Registros do dia" subtitle="Registros salvos aguardando envio ao engenheiro.">
      <div className="flex flex-col gap-6">
        {enviados !== null && pendentes.length === 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{enviados} registro(s) enviado(s) com sucesso para o engenheiro.</p>
          </div>
        )}

        {loading && <p className="text-sm text-gray-500">Carregando registros pendentes...</p>}
        {!loading && error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && pendentes.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-alt py-10 text-center">
            <ClipboardList className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-400">Nenhum registro pendente no momento.</p>
          </div>
        )}

        {!loading && !error && pendentes.length > 0 && (
          <div className="flex flex-col gap-3">
            {pendentes.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{r.servico.nome}</p>
                  <span className="text-xs text-gray-500">{dataHoraPtBr(r.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {r.rodovia.rodovia} · km {r.km} · {r.cidade}
                </p>
                <p className="text-sm text-gray-500">
                  {r.motorista.nome} · {r.placa.placa}
                </p>
              </div>
            ))}
          </div>
        )}

        {enviarErro && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{enviarErro}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={novoRegistro}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-4 font-semibold text-gray-300 hover:border-primary hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            Novo registro
          </button>
          <button
            type="button"
            disabled={pendentes.length === 0 || enviando}
            onClick={enviarTudo}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success px-4 py-4 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
            {enviando ? "Enviando..." : `Enviar tudo (${pendentes.length})`}
          </button>
        </div>
      </div>
    </OperadorLayout>
  );
}
