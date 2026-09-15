import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { listarFila, removerDaFila, salvarNaFila } from "../offline/filaDb";
import type { RegistroNaFila } from "../offline/filaDb";
import { enviarRegistro } from "../offline/registroOffline";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export type ResultadoEnvio = { enviados: number } | { agendado: true } | { erro: string };

interface SincronizacaoContextValue {
  /** Registros guardados no celular que ainda não chegaram ao servidor. */
  fila: RegistroNaFila[];
  online: boolean;
  sincronizando: boolean;
  /** "Enviar tudo" foi pedido sem internet e será feito quando o sinal voltar. */
  envioAgendado: boolean;
  /** Muda quando algo chega ao servidor, para as telas recarregarem as listas. */
  versao: number;
  adicionarNaFila: (item: RegistroNaFila) => Promise<void>;
  descartarDaFila: (clienteId: string) => Promise<void>;
  sincronizar: () => Promise<void>;
  enviarTudo: () => Promise<ResultadoEnvio>;
}

const SincronizacaoContext = createContext<SincronizacaoContextValue | undefined>(undefined);

const TIMEOUT_ENVIO_FILA_MS = 120_000;

const chaveEnvioAgendado = (usuarioId: number) => `diario:enviar-apos-sincronizar:${usuarioId}`;

function lerEnvioAgendado(usuarioId: number) {
  try {
    return localStorage.getItem(chaveEnvioAgendado(usuarioId)) === "1";
  } catch {
    return false;
  }
}

function gravarEnvioAgendado(usuarioId: number, agendado: boolean) {
  try {
    if (agendado) localStorage.setItem(chaveEnvioAgendado(usuarioId), "1");
    else localStorage.removeItem(chaveEnvioAgendado(usuarioId));
  } catch {
    // sem armazenamento: o agendamento vale só enquanto o app estiver aberto
  }
}

export function SincronizacaoProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id ?? null;
  const [fila, setFila] = useState<RegistroNaFila[]>([]);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [sincronizando, setSincronizando] = useState(false);
  const [envioAgendado, setEnvioAgendado] = useState(false);
  const [versao, setVersao] = useState(0);
  const rodando = useRef(false);

  const recarregarFila = useCallback(async () => {
    if (usuarioId === null) {
      setFila([]);
      return [];
    }
    try {
      const itens = await listarFila(usuarioId);
      setFila(itens);
      return itens;
    } catch {
      return [];
    }
  }, [usuarioId]);

  const sincronizarInterno = useCallback(async (): Promise<ResultadoEnvio | null> => {
    if (usuarioId === null || rodando.current) return null;

    let itens: RegistroNaFila[];
    try {
      itens = await listarFila(usuarioId);
    } catch {
      itens = [];
    }
    // Nada guardado e nenhum envio pendente: não usa a rede à toa.
    if (itens.length === 0 && !lerEnvioAgendado(usuarioId)) return null;

    rodando.current = true;
    setSincronizando(true);
    let resultado: ResultadoEnvio | null = null;
    try {
      let semConexao = false;
      let enviouAlgum = false;

      // Um de cada vez, na ordem em que foram salvos.
      for (const item of itens) {
        try {
          await enviarRegistro(item, TIMEOUT_ENVIO_FILA_MS);
          await removerDaFila(item.clienteId);
          enviouAlgum = true;
        } catch (err: any) {
          // Sem resposta (sem sinal) ou login expirado: para e tenta de novo depois.
          if (!err.response || err.response.status === 401) {
            semConexao = true;
            break;
          }
          // O servidor recusou (ex: cadastro excluído): fica guardado com o motivo.
          await salvarNaFila({ ...item, erro: err.response.data?.message ?? "O servidor recusou este registro." });
        }
      }

      if (enviouAlgum) setVersao((v) => v + 1);
      await recarregarFila();

      if (lerEnvioAgendado(usuarioId)) {
        if (semConexao) {
          resultado = { agendado: true };
        } else {
          try {
            const { data } = await api.post<{ enviados: number }>("/registros/enviar-lote");
            gravarEnvioAgendado(usuarioId, false);
            setVersao((v) => v + 1);
            resultado = { enviados: data.enviados };
          } catch (err: any) {
            if (!err.response) {
              resultado = { agendado: true };
            } else {
              gravarEnvioAgendado(usuarioId, false);
              resultado = { erro: err.response.data?.message ?? "Não foi possível enviar os registros. Tente novamente." };
            }
          }
        }
      }
      setEnvioAgendado(lerEnvioAgendado(usuarioId));
    } finally {
      rodando.current = false;
      setSincronizando(false);
    }
    return resultado;
  }, [usuarioId, recarregarFila]);

  // Ao entrar (ou trocar de usuário): carrega a fila e tenta enviar o que ficou.
  useEffect(() => {
    setEnvioAgendado(usuarioId !== null && lerEnvioAgendado(usuarioId));
    recarregarFila().then(() => sincronizarInterno());
  }, [usuarioId, recarregarFila, sincronizarInterno]);

  // Tenta de novo quando o sinal volta, quando o app volta para a tela e a cada minuto.
  useEffect(() => {
    const aoFicarOnline = () => {
      setOnline(true);
      sincronizarInterno();
    };
    const aoFicarOffline = () => setOnline(false);
    const aoVoltarParaTela = () => {
      if (document.visibilityState === "visible") sincronizarInterno();
    };
    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    document.addEventListener("visibilitychange", aoVoltarParaTela);
    const timer = window.setInterval(() => {
      if (navigator.onLine) sincronizarInterno();
    }, 60_000);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
      document.removeEventListener("visibilitychange", aoVoltarParaTela);
      window.clearInterval(timer);
    };
  }, [sincronizarInterno]);

  const adicionarNaFila = useCallback(
    async (item: RegistroNaFila) => {
      await salvarNaFila(item);
      // Pede ao navegador para não apagar esses dados quando faltar espaço.
      navigator.storage?.persist?.().catch(() => {});
      await recarregarFila();
    },
    [recarregarFila]
  );

  const descartarDaFila = useCallback(
    async (clienteId: string) => {
      await removerDaFila(clienteId);
      await recarregarFila();
    },
    [recarregarFila]
  );

  const sincronizar = useCallback(async () => {
    await sincronizarInterno();
  }, [sincronizarInterno]);

  const enviarTudo = useCallback(async (): Promise<ResultadoEnvio> => {
    if (usuarioId === null) return { erro: "Faça login novamente." };
    gravarEnvioAgendado(usuarioId, true);
    setEnvioAgendado(true);
    const resultado = await sincronizarInterno();
    return resultado ?? { agendado: true };
  }, [usuarioId, sincronizarInterno]);

  return (
    <SincronizacaoContext.Provider
      value={{ fila, online, sincronizando, envioAgendado, versao, adicionarNaFila, descartarDaFila, sincronizar, enviarTudo }}
    >
      {children}
    </SincronizacaoContext.Provider>
  );
}

export function useSincronizacao() {
  const ctx = useContext(SincronizacaoContext);
  if (!ctx) throw new Error("useSincronizacao deve ser usado dentro de SincronizacaoProvider.");
  return ctx;
}
