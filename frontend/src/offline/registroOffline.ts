import type { RegistroDraft } from "../contexts/RegistroContext";
import { copiaSegura, nomeDaFoto, reduzir } from "./fotos";
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
export async function montarRegistroParaEnvio(
  draft: RegistroDraft,
  status: "rascunho" | "enviado",
  usuarioId: number
): Promise<RegistroNaFila> {
  const clienteId = gerarClienteId();
  const criadoEm = new Date().toISOString();

  // Cópia própria de cada foto: o File da câmera é só uma referência a um arquivo
  // temporário, e guardar essa referência falhava quando a câmera já a tinha
  // liberado. A imagem não é alterada — a qualidade continua sendo a original.
  const arquivos: Partial<Record<CampoArquivo, Blob>> = {};
  if (draft.fotoTicket) arquivos.fotoTicket = await copiaSegura(draft.fotoTicket);
  for (const tipo of ["antes", "durante", "depois", "trena"] as const) {
    const foto = draft.fotos[tipo];
    if (foto) arquivos[tipo] = await copiaSegura(foto);
  }

  // O número da rua é guardado no campo km, como o engenheiro pediu. Número de
  // endereço nem sempre é um número ("s/n", "450A"): nesse caso ele é juntado ao
  // nome da rua, para não se perder, e o km fica vazio. Assim o operador nunca é
  // impedido de salvar por causa do formato do endereço.
  const numero = draft.numeroLogradouro.trim();
  const numeroEhNumerico = numero !== "" && /^\d+$/.test(numero);
  const logradouroParaEnviar =
    numero === "" || numeroEhNumerico ? draft.logradouro : `${draft.logradouro}, ${numero}`;
  const kmParaEnviar = draft.logradouro ? (numeroEhNumerico ? numero : "") : draft.km;

  return {
    clienteId,
    usuarioId,
    criadoEm,
    // Nome do local só para exibir na lista do dia: a rodovia, ou o logradouro nos
    // contratos de prefeitura. O campo mantém o nome para não invalidar os itens
    // já guardados no celular por versões anteriores.
    rodoviaNome: draft.rodoviaNome || draft.logradouro,
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
      km: kmParaEnviar,
      logradouro: logradouroParaEnviar,
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
    // O servidor tira a extensão do nome do arquivo, então ela vem do tipo da imagem.
    form.append(campo, arquivo, nomeDaFoto(campo, arquivo));
  }
  return api.post<Registro>("/registros", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: timeoutMs,
  });
}

/**
 * Mesmo registro, com as fotos reduzidas. Usado só quando o celular não conseguiu
 * guardar as fotos no tamanho original — perder um pouco de qualidade é melhor do
 * que perder o registro que o operador acabou de fazer em campo.
 */
export async function comFotosReduzidas(item: RegistroNaFila): Promise<RegistroNaFila> {
  const arquivos: Partial<Record<CampoArquivo, Blob>> = {};
  for (const [campo, foto] of Object.entries(item.arquivos)) {
    if (foto) arquivos[campo as CampoArquivo] = await reduzir(foto);
  }
  return { ...item, arquivos };
}
