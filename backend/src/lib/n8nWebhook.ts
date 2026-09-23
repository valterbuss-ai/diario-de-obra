import type { Registro, Contrato, Placa, Servico, Clima, Usina, Rodovia } from "@prisma/client";

type RegistroCompleto = Registro & {
  contrato: Contrato;
  placa: Placa;
  servico: Servico;
  clima: Clima;
  usina: Usina;
  // Nulo nos contratos de logradouro (prefeitura), onde não existe rodovia.
  rodovia: Rodovia | null;
};

// Payload enviado ao Webhook do fluxo n8n "TESTE - Microsoft Graph SharePoint TES"
// (nó "13 - Calcular Proxima Linha" espera exatamente estes campos, em
// $('Webhook').first().json.body). DATA vai em ISO (yyyy-mm-dd) — nunca formatada
// como dd/mm/yyyy, que é ambígua e já causou gravação errada em teste real.
interface RegistroWebhookPayload {
  contrato: string;
  data: string;
  clima: string;
  /** Coluna E da planilha, que já se chama "RODOVIA / LOGRADOURO". */
  rodovia: string;
  cidade: string;
  /**
   * Colunas G (KM INICIAL) e H (KM FINAL) — o nó do n8n usa este mesmo valor nas
   * duas, cru, sem Number(). Contrato de logradouro não tem km: vai string vazia,
   * que o Graph grava como célula em branco. Nunca null, que na gravação de
   * intervalo pode significar "não altere a célula" e deixaria lixo da linha anterior.
   */
  km: number | "";
  lado: string;
  servico: string;
  comprimento: number;
  largura: number;
  espessura: number;
  usina: string;
  placa: string;
  numeroTicket: string;
  toneladas: number;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
  return value;
}

function montarPayload(registro: RegistroCompleto): RegistroWebhookPayload {
  // Contrato de prefeitura: o logradouro ocupa a coluna E no lugar da rodovia e as
  // colunas de km ficam em branco. A coluna já se chama "RODOVIA / LOGRADOURO" na
  // planilha do cliente, então o fluxo n8n não precisa mudar.
  const ehLogradouro = registro.contrato.tipoLocal === "logradouro";
  return {
    contrato: registro.contrato.codigo,
    data: registro.data.toISOString().slice(0, 10),
    clima: registro.clima.condicao,
    rodovia: (ehLogradouro ? registro.logradouro : registro.rodovia?.rodovia) ?? "",
    cidade: registro.cidade,
    km: registro.km === null ? "" : Number(registro.km),
    lado: { direito: "Direito", esquerdo: "Esquerdo", ambos: "Ambos" }[registro.lado] ?? registro.lado,
    servico: registro.servico.nome,
    comprimento: Number(registro.comprimento),
    largura: Number(registro.largura),
    espessura: Number(registro.espessura),
    usina: registro.usina.nome,
    placa: registro.placa.placa,
    numeroTicket: registro.numeroTicket,
    toneladas: Number(registro.toneladas),
  };
}

/**
 * Envia um registro para o fluxo n8n que grava a linha na planilha real do cliente
 * (PLANILHA ALIMENTAÇÃO - TESTE.xlsm, aba ACOMP DIÁRIO). Nunca lança para quem chamou —
 * o app de campo não pode falhar por causa de instabilidade nessa integração. Erros só
 * são logados.
 */
export async function enviarRegistroParaPlanilha(registro: RegistroCompleto): Promise<void> {
  try {
    const url = requiredEnv("N8N_WEBHOOK_URL");
    const payload = montarPayload(registro);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[n8nWebhook] Falha ao enviar registro ${registro.id} para a planilha (${res.status}): ${text}`);
      return;
    }

    console.log(`[n8nWebhook] Registro ${registro.id} enviado para a planilha com sucesso.`);
  } catch (err) {
    console.error(`[n8nWebhook] Erro ao enviar registro ${registro.id} para a planilha:`, err);
  }
}
