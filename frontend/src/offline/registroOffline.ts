import type { RegistroDraft } from "../contexts/RegistroContext";
import { api } from "../services/api";
import type { Registro } from "../types";
import type { CampoArquivo, RegistroNaFila } from "./filaDb";

function gerarClienteId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Monta o registro com id e horário próprios, pronto para enviar agora ou guardar na fila. */
export function montarRegistroParaEnvio(draft: RegistroDraft, status: "rascunho" | "enviado", usuarioId: number): RegistroNaFila {
  const clienteId = gerarClienteId();
  const criadoEm = new Date().toISOString();

  const arquivos: Partial<Record<CampoArquivo, Blob>> = {};
  if (draft.fotoTicket) arquivos.fotoTicket = draft.fotoTicket;
  for (const tipo of ["antes", "durante", "depois", "trena"] as const) {
    const foto = draft.fotos[tipo];
    if (foto) arquivos[tipo] = foto;
  }

  return {
    clienteId,
    usuarioId,
    criadoEm,
    rodoviaNome: draft.rodoviaNome,
    arquivos,
    campos: {
      clienteId,
      data: criadoEm,
      status,
      motoristaNome: draft.motoristaNome,
      placaId: String(draft.placaId),
      contratoId: String(draft.contratoId),
      servicoId: String(draft.servicoId),
      climaId: String(draft.climaId),
      usinaId: String(draft.usinaId),
      numeroTicket: draft.numeroTicket,
      toneladas: draft.toneladas,
      rodoviaId: String(draft.rodoviaId),
      km: draft.km,
      cidade: draft.cidade,
      comprimento: draft.comprimento,
      largura: draft.largura,
      espessura: draft.espessura,
      lado: draft.lado,
      observacoes: draft.observacoes,
    },
  };
}

export function enviarRegistro(item: RegistroNaFila, timeoutMs: number) {
  const form = new FormData();
  for (const [campo, valor] of Object.entries(item.campos)) form.append(campo, valor);
  for (const [campo, arquivo] of Object.entries(item.arquivos)) {
    if (!arquivo) continue;
    // O nome original mantém a extensão da foto no servidor.
    form.append(campo, arquivo, arquivo instanceof File ? arquivo.name : `${campo}.jpg`);
  }
  return api.post<Registro>("/registros", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: timeoutMs,
  });
}
