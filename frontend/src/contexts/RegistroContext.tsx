import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { enviarRegistro, montarRegistroParaEnvio } from "../offline/registroOffline";
import { useAuth } from "./AuthContext";
import { useSincronizacao } from "./SincronizacaoContext";
import type { LadoPista } from "../types";

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
  /** Contrato de logradouro (prefeitura): substitui rodovia e km. */
  logradouro: string;
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
  submitDraft: (status?: "rascunho" | "enviado") => Promise<{ offline: boolean }>;
}

const RegistroContext = createContext<RegistroContextValue | undefined>(undefined);

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistroDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { usuario } = useAuth();
  const { adicionarNaFila } = useSincronizacao();

  // Como equipe e carga passam a ser mantidas entre registros, um novo login no
  // mesmo celular não pode herdar o rascunho do operador anterior.
  useEffect(() => {
    setDraft(emptyDraft);
  }, [usuario?.id]);

  function updateDraft(patch: Partial<RegistroDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function updateFoto(tipo: keyof RegistroDraft["fotos"], file: File | null) {
    setDraft((prev) => ({ ...prev, fotos: { ...prev.fotos, [tipo]: file } }));
  }

  function resetDraft() {
    setDraft(emptyDraft);
  }

  function resetLocal() {
    setDraft((prev) => ({
      ...prev,
      rodoviaNome: emptyDraft.rodoviaNome,
      km: emptyDraft.km,
      logradouro: emptyDraft.logradouro,
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
    const item = montarRegistroParaEnvio(draft, status, usuario?.id ?? 0);
    try {
      if (navigator.onLine) {
        try {
          // Com sinal fraco não deixa o operador esperando: se passar do tempo,
          // guarda no celular. Se o envio tiver chegado mesmo assim, o reenvio
          // usa o mesmo id e o servidor não duplica.
          await enviarRegistro(item, 30_000);
          return { offline: false };
        } catch (err: any) {
          if (err.response) {
            const message = err.response.data?.message ?? "Não foi possível salvar o registro. Tente novamente.";
            setSubmitError(message);
            throw new Error(message);
          }
        }
      }

      try {
        await adicionarNaFila(item);
      } catch {
        const message = "Sem internet e não foi possível guardar o registro no celular. Não feche o app e tente de novo.";
        setSubmitError(message);
        throw new Error(message);
      }
      return { offline: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RegistroContext.Provider value={{ draft, updateDraft, updateFoto, resetDraft, resetLocal, submitting, submitError, submitDraft }}>
      {children}
    </RegistroContext.Provider>
  );
}

export function useRegistroDraft() {
  const ctx = useContext(RegistroContext);
  if (!ctx) throw new Error("useRegistroDraft deve ser usado dentro de RegistroProvider.");
  return ctx;
}
