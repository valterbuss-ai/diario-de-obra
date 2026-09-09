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

export async function appendTableRow(tableName: string, values: (string | number | null)[]): Promise<void> {
  const res = await graphFetch(`${fileItemPath()}/workbook/tables('${encodeURIComponent(tableName)}')/rows/add`, {
    method: "POST",
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    throw new Error(`Erro ao adicionar linha na tabela "${tableName}" (${res.status}): ${await res.text()}`);
  }
}
