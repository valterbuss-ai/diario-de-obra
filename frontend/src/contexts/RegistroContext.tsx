import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { atualizarRegistro, comFotosReduzidas, enviarRegistro, montarRegistroParaEnvio } from "../offline/registroOffline";
import { fotoUrl } from "../services/api";
import { useAuth } from "./AuthContext";
import { useSincronizacao } from "./SincronizacaoContext";
import type { LadoPista, Registro } from "../types";

export interface RegistroDraft {
  motoristaNome: string;
  placaId: number | "";
  contratoId: number | "";
  servicoId: number | "";
  climaId: number | "";
  usinaId: number | "";
  numeroTicket: string;
  toneladas: string;
  fotoTicket: File | null;
  rodoviaNome: string;
  km: string;
  /** Contrato de logradouro (prefeitura): nome da rua, no lugar da rodovia. */
  logradouro: string;
  /** Número da rua. Vai para o campo km quando for um número; ver registroOffline. */
  numeroLogradouro: string;
  cidade: string;
  rodoviaId: number | "";
  comprimento: string;
  largura: string;
  espessura: string;
  lado: LadoPista | "";
  observacoes: string;
  fotos: {
    antes: File | null;
    durante: File | null;
    depois: File | null;
    trena: File | null;
  };
}

export const emptyDraft: RegistroDraft = {
  motoristaNome: "",
  placaId: "",
  contratoId: "",
  servicoId: "",
  climaId: "",
  usinaId: "",
  numeroTicket: "",
  toneladas: "",
  fotoTicket: null,
  rodoviaNome: "",
  km: "",
  logradouro: "",
  numeroLogradouro: "",
  cidade: "",
  rodoviaId: "",
  comprimento: "",
  largura: "",
  espessura: "",
  lado: "",
  observacoes: "",
  fotos: { antes: null, durante: null, depois: null, trena: null },
};

export function equipePreenchida(draft: RegistroDraft) {
  return (
    draft.motoristaNome.trim().length >= 3 &&
    draft.placaId !== "" &&
    draft.contratoId !== "" &&
    draft.servicoId !== "" &&
    draft.climaId !== ""
  );
}

export function cargaPreenchida(draft: RegistroDraft) {
  return draft.usinaId !== "" && draft.numeroTicket.trim().length > 0 && Number(draft.toneladas) > 0;
}

interface RegistroContextValue {
  draft: RegistroDraft;
  updateDraft: (patch: Partial<RegistroDraft>) => void;
  updateFoto: (tipo: keyof RegistroDraft["fotos"], file: File | null) => void;
  resetDraft: () => void;
  /** Limpa só a etapa 3 (local, dimensões e fotos), mantendo equipe e carga. */
  resetLocal: () => void;
  submitting: boolean;
  submitError: string | null;
  /** Salva no servidor; sem internet, guarda no celular (offline: true). */
  submitDraft: (status?: "rascunho" | "enviado") => Promise<{ offline: boolean; fotosReduzidas: boolean }>;
  /** Id do registro sendo corrigido, ou null quando é um registro novo. */
  editandoId: number | null;
  /** Abre um registro pendente para correção, trazendo as fotos já anexadas. */
  iniciarEdicao: (registro: Registro) => Promise<void>;
  cancelarEdicao: () => void;
}

/**
 * Reconstrói o rascunho a partir de um registro já salvo, para o operador corrigi-lo.
 * No contrato de logradouro, rua e número foram guardados em campos diferentes
 * (o número vai no km, ou junto da rua quando não é numérico) — aqui eles voltam
 * a ser dois campos na tela.
 */
function draftDoRegistro(registro: Registro, arquivos: RegistroDraft["fotos"], fotoTicket: File | null): RegistroDraft {
  const ehLogradouro = registro.logradouro !== null;
  let rua = registro.logradouro ?? "";
  let numero = "";
  if (ehLogradouro) {
    if (registro.km) {
      numero = String(Number(registro.km));
    } else {
      // Número não numérico foi guardado junto da rua ("Rua X, s/n").
      const virgula = rua.lastIndexOf(", ");
      if (virgula > 0) {
        numero = rua.slice(virgula + 2);
        rua = rua.slice(0, virgula);
      }
    }
  }

  return {
    motoristaNome: registro.motorista.nome,
    placaId: registro.placa.id,
    contratoId: registro.contrato.id,
    servicoId: registro.servico.id,
    climaId: registro.clima.id,
    usinaId: registro.usina.id,
    numeroTicket: registro.numeroTicket,
    toneladas: String(registro.toneladas),
    fotoTicket,
    rodoviaNome: registro.rodovia?.rodovia ?? "",
    km: ehLogradouro ? "" : registro.km ?? "",
    logradouro: rua,
    numeroLogradouro: numero,
    cidade: registro.cidade,
    rodoviaId: registro.rodovia?.id ?? "",
    comprimento: String(registro.comprimento),
    largura: String(registro.largura),
    espessura: String(registro.espessura),
    lado: registro.lado,
    observacoes: registro.observacoes ?? "",
    fotos: arquivos,
  };
}

const RegistroContext = createContext<RegistroContextValue | undefined>(undefined);

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistroDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const { usuario } = useAuth();
  const { adicionarNaFila } = useSincronizacao();

  // Como equipe e carga passam a ser mantidas entre registros, um novo login no
  // mesmo celular não pode herdar o rascunho do operador anterior.
  useEffect(() => {
    setDraft(emptyDraft);
    setEditandoId(null);
  }, [usuario?.id]);

  /** Traz uma foto já arquivada de volta para o formulário, para poder ser trocada. */
  async function baixarFoto(fotoId: number, nome: string): Promise<File | null> {
    const url = fotoUrl(fotoId);
    if (!url) return null; // sem token guardado: a foto volta vazia e pode ser tirada de novo
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) return null;
      const blob = await resposta.blob();
      return new File([blob], nome, { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  }

  async function iniciarEdicao(registro: Registro) {
    const porTipo = Object.fromEntries(registro.fotos.map((f) => [f.tipo, f.id]));
    const [antes, durante, depois, trena, ticket] = await Promise.all([
      porTipo.antes ? baixarFoto(porTipo.antes, "antes.jpg") : null,
      porTipo.durante ? baixarFoto(porTipo.durante, "durante.jpg") : null,
      porTipo.depois ? baixarFoto(porTipo.depois, "depois.jpg") : null,
      porTipo.trena ? baixarFoto(porTipo.trena, "trena.jpg") : null,
      porTipo.ticket ? baixarFoto(porTipo.ticket, "ticket.jpg") : null,
    ]);
    setDraft(draftDoRegistro(registro, { antes, durante, depois, trena }, ticket));
    setSubmitError(null);
    setEditandoId(registro.id);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setDraft(emptyDraft);
  }

  function updateDraft(patch: Partial<RegistroDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateFoto(tipo: keyof RegistroDraft["fotos"], file: File | null) {
    setDraft((prev) => ({ ...prev, fotos: { ...prev.fotos, [tipo]: file } }));
  }

  // Começar um registro novo sempre sai do modo de correção: senão o próximo
  // "Salvar" sobrescreveria o registro que estava sendo editado.
  function resetDraft() {
    setEditandoId(null);
    setDraft(emptyDraft);
  }

  function resetLocal() {
    setEditandoId(null);
    setDraft((prev) => ({
      ...prev,
      rodoviaNome: emptyDraft.rodoviaNome,
      km: emptyDraft.km,
      logradouro: emptyDraft.logradouro,
      numeroLogradouro: emptyDraft.numeroLogradouro,
      cidade: emptyDraft.cidade,
      rodoviaId: emptyDraft.rodoviaId,
      comprimento: emptyDraft.comprimento,
      largura: emptyDraft.largura,
      espessura: emptyDraft.espessura,
      lado: emptyDraft.lado,
      observacoes: emptyDraft.observacoes,
      fotos: emptyDraft.fotos,
    }));
  }

  async function submitDraft(status: "rascunho" | "enviado" = "rascunho") {
    setSubmitting(true);
    setSubmitError(null);
    // Toda falha precisa virar mensagem na tela. Sem isto, um erro ao preparar as
    // fotos saía sem aviso nenhum e o operador só via o nada acontecer.
    let jaAvisou = false;
    const avisar = (texto: string) => {
      jaAvisou = true;
      setSubmitError(texto);
      return new Error(texto);
    };
    try {
      const item = await montarRegistroParaEnvio(draft, status, usuario?.id ?? 0);

      // Correção de um registro que já está no servidor. Não vai para a fila do
      // celular: a fila é para registros novos, e reenviá-la criaria um duplicado.
      if (editandoId !== null) {
        try {
          await atualizarRegistro(editandoId, item, 300_000);
          setEditandoId(null);
          return { offline: false, fotosReduzidas: false };
        } catch (err: any) {
          throw avisar(
            err.response?.data?.message ??
              "Não foi possível salvar a alteração. Verifique a internet e tente de novo."
          );
        }
      }

      if (navigator.onLine) {
        try {
          // Com sinal fraco não deixa o operador esperando: se passar do tempo,
          // guarda no celular. Se o envio tiver chegado mesmo assim, o reenvio
          // usa o mesmo id e o servidor não duplica.
          await enviarRegistro(item, 30_000);
          return { offline: false, fotosReduzidas: false };
        } catch (err: any) {
          if (err.response) {
            throw avisar(err.response.data?.message ?? "Não foi possível salvar o registro. Tente novamente.");
          }
        }
      }

      // Guardar no celular é a última linha de defesa do trabalho feito em campo.
      // Se a foto no tamanho original não couber, tenta de novo com as fotos
      // reduzidas em vez de deixar o operador perder o registro.
      try {
        await adicionarNaFila(item);
        return { offline: true, fotosReduzidas: false };
      } catch (erroOriginal: any) {
        try {
          await adicionarNaFila(await comFotosReduzidas(item));
          return { offline: true, fotosReduzidas: true };
        } catch (erroReduzido: any) {
          // O motivo vai na tela: sem ele, a falha anterior levou a investigar no escuro.
          const motivo = erroReduzido?.name === "QuotaExceededError" || erroOriginal?.name === "QuotaExceededError"
            ? "o celular está sem espaço."
            : `motivo: ${erroReduzido?.message ?? erroOriginal?.message ?? "desconhecido"}`;
          throw avisar(`Não foi possível guardar o registro no celular — ${motivo} Não feche o app: libere espaço e toque em salvar de novo.`);
        }
      }
    } catch (err: any) {
      // Rede de segurança: qualquer falha não prevista (por exemplo ao ler a foto
      // da câmera) também precisa aparecer, com o motivo técnico junto.
      if (!jaAvisou) {
        setSubmitError(`Não foi possível salvar o registro. Motivo: ${err?.message ?? err}. Não feche o app e tente de novo.`);
      }
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RegistroContext.Provider
      value={{
        draft,
        updateDraft,
        updateFoto,
        resetDraft,
        resetLocal,
        submitting,
        submitError,
        submitDraft,
        editandoId,
        iniciarEdicao,
        cancelarEdicao,
      }}
    >
      {children}
    </RegistroContext.Provider>
  );
}

export function useRegistroDraft() {
  const ctx = useContext(RegistroContext);
  if (!ctx) throw new Error("useRegistroDraft deve ser usado dentro de RegistroProvider.");
  return ctx;
}
