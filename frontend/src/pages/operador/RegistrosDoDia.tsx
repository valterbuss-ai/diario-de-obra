import { AlertTriangle, CheckCircle2, ClipboardList, CloudOff, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OperadorLayout } from "../../components/OperadorLayout";
import { useAuth } from "../../contexts/AuthContext";
import { cargaPreenchida, equipePreenchida, useRegistroDraft } from "../../contexts/RegistroContext";
import { useSincronizacao } from "../../contexts/SincronizacaoContext";
import { useApiList } from "../../services/hooks";
import { localDoRegistro } from "../../types";
import type { Placa, Registro, Servico } from "../../types";

function dataHoraPtBr(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function RegistrosDoDia() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const { draft, resetDraft, resetLocal } = useRegistroDraft();
  const { fila, online, sincronizando, envioAgendado, versao, enviarTudo, sincronizar, descartarDaFila } = useSincronizacao();
  const { data: pendentes, loading, error } = useApiList<Registro>("/registros?status=rascunho", [versao]);
  const { data: placas } = useApiList<Placa>("/placas");
  const { data: servicos } = useApiList<Servico>(usuario?.perfil === "terceirizado" ? "/servicos-terceiros" : "/servicos");
  const [enviando, setEnviando] = useState(false);
  const [enviarErro, setEnviarErro] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<number | null>(null);

  const salvoNoCelular = (location.state as { salvoNoCelular?: boolean } | null)?.salvoNoCelular === true;
  const total = pendentes.length + fila.length;

  function novoRegistro() {
    // Mesma equipe e carga do registro anterior: vai direto pra etapa 3.
    resetLocal();
    navigate(equipePreenchida(draft) && cargaPreenchida(draft) ? "/operador/local" : "/operador/equipe");
  }

  function comecarDoZero() {
    resetDraft();
    navigate("/operador/equipe");
  }

  async function handleEnviarTudo() {
    setEnviando(true);
    setEnviarErro(null);
    setEnviados(null);
    try {
      const resultado = await enviarTudo();
      if ("enviados" in resultado) setEnviados(resultado.enviados);
      else if ("erro" in resultado) setEnviarErro(resultado.erro);
    } finally {
      setEnviando(false);
    }
  }

  async function descartar(clienteId: string) {
    if (!window.confirm("Descartar este registro? Ele ainda não foi enviado e será apagado do celular.")) return;
    await descartarDaFila(clienteId);
  }

  return (
    <OperadorLayout step={3} title="Registros do dia" subtitle="Registros salvos aguardando envio ao engenheiro.">
      <div className="flex flex-col gap-6">
        {salvoNoCelular && fila.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-primary">
            <CloudOff className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Sem internet: o registro foi guardado no celular e será enviado sozinho quando o sinal voltar.</p>
          </div>
        )}

        {envioAgendado && total > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-primary">
            <Send className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Envio agendado: assim que houver internet, os registros vão para o engenheiro automaticamente.</p>
          </div>
        )}

        {enviados !== null && total === 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{enviados} registro(s) enviado(s) com sucesso para o engenheiro.</p>
          </div>
        )}

        {loading && total === 0 && <p className="text-sm text-gray-500">Carregando registros pendentes...</p>}
        {!loading && error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && total === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-alt py-10 text-center">
            <ClipboardList className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-400">Nenhum registro pendente no momento.</p>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-col gap-3">
            {fila.map((item) => {
              const servico = servicos.find((s) => String(s.id) === item.campos.servicoId)?.nome ?? "Serviço";
              const placa = placas.find((p) => String(p.id) === item.campos.placaId)?.placa;
              return (
                <div key={item.clienteId} className="rounded-xl border border-primary/40 bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white">{servico}</p>
                    <span className="text-xs text-gray-500">{dataHoraPtBr(item.criadoEm)}</span>
                  </div>
                  {/* O km some nos contratos de logradouro, onde não existe. */}
                  <p className="mt-1 text-sm text-gray-400">
                    {[item.rodoviaNome, item.campos.km && `km ${item.campos.km}`, item.campos.cidade]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-sm text-gray-500">{[item.campos.motoristaNome, placa].filter(Boolean).join(" · ")}</p>
                  {item.erro ? (
                    <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-red-500/10 px-3 py-2">
                      <p className="flex items-start gap-2 text-sm text-red-400">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Não enviado: {item.erro}
                      </p>
                      <button
                        type="button"
                        onClick={() => descartar(item.clienteId)}
                        className="shrink-0 text-red-400 hover:text-red-300"
                        aria-label="Descartar registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary">
                      <CloudOff className="h-4 w-4" />
                      Guardado no celular · aguardando internet
                    </p>
                  )}
                </div>
              );
            })}

            {pendentes.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{r.servico.nome}</p>
                  <span className="text-xs text-gray-500">{dataHoraPtBr(r.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {[localDoRegistro(r), r.km && `km ${r.km}`, r.cidade].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm text-gray-500">
                  {r.motorista.nome} · {r.placa.placa}
                </p>
              </div>
            ))}
          </div>
        )}

        {fila.length > 0 && online && (
          <button
            type="button"
            disabled={sincronizando}
            onClick={sincronizar}
            className="flex items-center justify-center gap-2 self-center text-sm font-semibold text-primary hover:underline disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizando ? "animate-spin" : ""}`} />
            {sincronizando ? "Enviando os guardados no celular..." : "Enviar agora os guardados no celular"}
          </button>
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
            disabled={total === 0 || enviando}
            onClick={handleEnviarTudo}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success px-4 py-4 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
            {enviando ? "Enviando..." : online ? `Enviar tudo (${total})` : `Enviar quando houver internet (${total})`}
          </button>
        </div>

        {equipePreenchida(draft) && (
          <button
            type="button"
            onClick={comecarDoZero}
            className="self-center text-sm text-gray-500 underline-offset-4 hover:text-primary hover:underline"
          >
            Começar do zero (trocar equipe ou carga)
          </button>
        )}
      </div>
    </OperadorLayout>
  );
}
