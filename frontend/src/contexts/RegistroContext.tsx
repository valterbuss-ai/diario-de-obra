import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
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
  submitDraft: (status?: "rascunho" | "enviado") => Promise<Registro>;
}

const RegistroContext = createContext<RegistroContextValue | undefined>(undefined);

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistroDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { usuario } = useAuth();

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
    try {
      const form = new FormData();
      form.append("motoristaNome", draft.motoristaNome);
      form.append("placaId", String(draft.placaId));
      form.append("contratoId", String(draft.contratoId));
      form.append("servicoId", String(draft.servicoId));
      form.append("climaId", String(draft.climaId));
      form.append("usinaId", String(draft.usinaId));
      form.append("numeroTicket", draft.numeroTicket);
      form.append("toneladas", draft.toneladas);
      form.append("rodoviaId", String(draft.rodoviaId));
      form.append("km", draft.km);
      form.append("cidade", draft.cidade);
      form.append("comprimento", draft.comprimento);
      form.append("largura", draft.largura);
      form.append("espessura", draft.espessura);
      form.append("lado", draft.lado);
      form.append("observacoes", draft.observacoes);
      form.append("status", status);
      if (draft.fotoTicket) form.append("fotoTicket", draft.fotoTicket);
      if (draft.fotos.antes) form.append("antes", draft.fotos.antes);
      if (draft.fotos.durante) form.append("durante", draft.fotos.durante);
      if (draft.fotos.depois) form.append("depois", draft.fotos.depois);
      if (draft.fotos.trena) form.append("trena", draft.fotos.trena);

      const { data } = await api.post<Registro>("/registros", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message ?? "Não foi possível enviar o registro. Tente novamente.";
      setSubmitError(message);
      throw new Error(message);
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
