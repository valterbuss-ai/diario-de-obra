import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { cargaPreenchida, equipePreenchida, useRegistroDraft } from "../contexts/RegistroContext";

/** De quanto em quanto tempo perguntar ao servidor se saiu versão nova. */
const INTERVALO_VERIFICACAO_MS = 15 * 60_000;

/**
 * Cuida da atualização do aplicativo.
 *
 * Antes, o service worker era registrado por um script que só chamava register():
 * a versão nova era baixada, mas a página seguia rodando o código antigo que já
 * estava na memória, e o app instalado, quando voltava do segundo plano, nem
 * chegava a verificar. Era por isso que a atualização "não aparecia".
 *
 * Agora o app verifica enquanto está aberto e aplica sozinho — exceto se o
 * operador estiver no meio de um registro, porque o rascunho vive na memória e
 * recarregar apagaria o que ele digitou em campo. Nesse caso ele decide a hora.
 */
export function AtualizacaoDoApp() {
  const { draft } = useRegistroDraft();
  const [dispensado, setDispensado] = useState(false);
  const jaAplicou = useRef(false);

  const {
    needRefresh: [temVersaoNova],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;

      const verificar = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      // O visibilitychange é o que resolve o app instalado: ao voltar do segundo
      // plano não há carregamento de página, e sem isto nada seria verificado.
      const aoVoltarParaTela = () => {
        if (document.visibilityState === "visible") verificar();
      };
      window.addEventListener("online", verificar);
      document.addEventListener("visibilitychange", aoVoltarParaTela);
      window.setInterval(verificar, INTERVALO_VERIFICACAO_MS);
    },
  });

  // Registro em andamento: qualquer coisa já preenchida nas três etapas.
  const registroEmAndamento =
    equipePreenchida(draft) ||
    cargaPreenchida(draft) ||
    draft.motoristaNome.trim() !== "" ||
    draft.numeroTicket.trim() !== "" ||
    draft.rodoviaNome !== "" ||
    draft.logradouro.trim() !== "" ||
    draft.km !== "" ||
    draft.comprimento !== "" ||
    draft.largura !== "" ||
    draft.espessura !== "" ||
    draft.observacoes.trim() !== "" ||
    draft.fotoTicket !== null ||
    Object.values(draft.fotos).some(Boolean);

  // Recarregar é o que de fato coloca a versão nova no ar: sem isto o service
  // worker novo assume, mas a página segue rodando o código antigo que já está na
  // memória — era esse o defeito. A trava garante que só recarrega quando fomos
  // nós que pedimos a troca (com clientsClaim, o evento também ocorre na primeira
  // visita, e aí recarregar seria gratuito).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const aoTrocarDeWorker = () => {
      if (jaAplicou.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", aoTrocarDeWorker);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", aoTrocarDeWorker);
  }, []);

  function aplicarAgora() {
    if (jaAplicou.current) return;
    jaAplicou.current = true;
    // false: o recarregamento é feito acima, quando o worker novo assumir de fato.
    updateServiceWorker(false);
  }

  useEffect(() => {
    if (!temVersaoNova || registroEmAndamento) return;
    aplicarAgora();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temVersaoNova, registroEmAndamento]);

  if (!temVersaoNova || !registroEmAndamento || dispensado) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-primary/40 bg-surface px-4 py-3 shadow-lg">
      <p className="text-sm text-gray-300">
        Nova versão disponível.
        <span className="block text-xs text-gray-500">Salve o registro em andamento antes de atualizar.</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setDispensado(true)}
          className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
        >
          Agora não
        </button>
        <button
          type="button"
          onClick={aplicarAgora}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-dark"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>
    </div>
  );
}
