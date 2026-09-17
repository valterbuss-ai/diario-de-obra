const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não configurada.`);
  return value;
}

async function getGraphToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const tenantId = requiredEnv("MS_GRAPH_TENANT_ID");
  const clientId = requiredEnv("MS_GRAPH_CLIENT_ID");
  const clientSecret = requiredEnv("MS_GRAPH_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token do Microsoft Graph (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

export async function graphFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getGraphToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return res;
}

// Resolve o arquivo a partir do link de compartilhamento do SharePoint/OneDrive
// (formato exigido pela Graph API para o endpoint /shares): base64 da URL, sem
// padding, com / e + trocados por _ e -, prefixado com "u!".
// https://learn.microsoft.com/graph/api/shares-get
function encodeSharingUrl(url: string): string {
  const base64 = Buffer.from(url, "utf-8")
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\//g, "_")
    .replace(/\+/g, "-");
  return `u!${base64}`;
}

function fileItemPath(): string {
  const shareUrl = requiredEnv("MS_GRAPH_SHARE_URL");
  return `/shares/${encodeSharingUrl(shareUrl)}/driveItem`;
}

export async function listWorksheets(): Promise<any> {
  const res = await graphFetch(`${fileItemPath()}/workbook/worksheets`);
  if (!res.ok) throw new Error(`Erro ao listar abas (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function listTables(worksheetName?: string): Promise<any> {
  const scope = worksheetName ? `/workbook/worksheets('${encodeURIComponent(worksheetName)}')` : "/workbook";
  const res = await graphFetch(`${fileItemPath()}${scope}/tables`);
  if (!res.ok) throw new Error(`Erro ao listar tabelas (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function listTableColumns(tableName: string): Promise<any> {
  const res = await graphFetch(`${fileItemPath()}/workbook/tables('${encodeURIComponent(tableName)}')/columns`);
  if (!res.ok) throw new Error(`Erro ao listar colunas (${res.status}): ${await res.text()}`);
  return res.json();
}

// --- Fotos dos registros (biblioteca "Fotos do Sistema" no SharePoint) ---

const SITE_PATH =
  process.env.MS_GRAPH_SITE_PATH ?? "testecnologiadesolosltda.sharepoint.com:/sites/SistemaOperacionalTES:";
const BIBLIOTECA_FOTOS = process.env.MS_GRAPH_BIBLIOTECA_FOTOS ?? "Fotos do Sistema";

let bibliotecaFotosId: string | null = null;

/** driveId da biblioteca de fotos, resolvido uma vez e guardado em memória. */
export async function resolverBibliotecaFotos(): Promise<string> {
  if (bibliotecaFotosId) return bibliotecaFotosId;

  const res = await graphFetch(`/sites/${SITE_PATH}/drives`);
  if (!res.ok) throw new Error(`Erro ao listar bibliotecas do site (${res.status}): ${await res.text()}`);

  const { value } = (await res.json()) as { value: { id: string; name: string }[] };
  const biblioteca = value.find((d) => d.name === BIBLIOTECA_FOTOS);
  if (!biblioteca) throw new Error(`Biblioteca "${BIBLIOTECA_FOTOS}" não encontrada no site.`);

  bibliotecaFotosId = biblioteca.id;
  return biblioteca.id;
}

/**
 * Envia uma foto para `caminho` (ex: "CT-2024-091/2026/09 - Setembro/16/041-antes.jpg").
 * O Graph cria as subpastas que faltarem.
 */
export async function enviarFoto(
  caminho: string,
  conteudo: Buffer,
  contentType: string,
  opcoes: { naoSobrescrever?: boolean } = {}
): Promise<{ driveId: string; itemId: string; caminho: string }> {
  const driveId = await resolverBibliotecaFotos();

  const enviar = (alvo: string, falharSeExistir: boolean) =>
    graphFetch(
      `/drives/${driveId}/root:/${encodeURI(alvo)}:/content${falharSeExistir ? "?@microsoft.graph.conflictBehavior=fail" : ""}`,
      { method: "PUT", headers: { "Content-Type": contentType }, body: new Uint8Array(conteudo) }
    );

  if (!opcoes.naoSobrescrever) {
    const res = await enviar(caminho, false);
    if (!res.ok) throw new Error(`Erro ao enviar foto "${caminho}" (${res.status}): ${await res.text()}`);
    const item = (await res.json()) as { id: string };
    return { driveId, itemId: item.id, caminho };
  }

  // Nome já usado (ex: dois registros com o mesmo número de ticket no mesmo dia):
  // guarda os dois, virando "48213.jpg" e "48213-2.jpg". O conflictBehavior=fail é
  // atômico no Graph, então dois envios ao mesmo tempo não se sobrescrevem.
  const ponto = caminho.lastIndexOf(".");
  const base = ponto > 0 ? caminho.slice(0, ponto) : caminho;
  const extensao = ponto > 0 ? caminho.slice(ponto) : "";

  for (let tentativa = 1; tentativa <= 20; tentativa++) {
    const alvo = tentativa === 1 ? caminho : `${base}-${tentativa}${extensao}`;
    const res = await enviar(alvo, true);
    if (res.ok) {
      const item = (await res.json()) as { id: string };
      return { driveId, itemId: item.id, caminho: alvo };
    }
    if (res.status !== 409) throw new Error(`Erro ao enviar foto "${alvo}" (${res.status}): ${await res.text()}`);
  }
  throw new Error(`Não foi possível gravar "${caminho}": já existem 20 arquivos com esse nome na pasta.`);
}

/** Baixa o conteúdo de uma foto já enviada, para o backend repassar ao navegador. */
export async function baixarFoto(driveId: string, itemId: string): Promise<Response> {
  return graphFetch(`/drives/${driveId}/items/${itemId}/content`);
}

export async function appendTableRow(tableName: string, values: (string | number | null)[]): Promise<void> {
  const res = await graphFetch(`${fileItemPath()}/workbook/tables('${encodeURIComponent(tableName)}')/rows/add`, {
    method: "POST",
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    throw new Error(`Erro ao adicionar linha na tabela "${tableName}" (${res.status}): ${await res.text()}`);
  }
}
