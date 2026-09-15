// Fila de registros salvos no celular enquanto não há internet. Fica no
// IndexedDB porque guarda as fotos (Blob), que não cabem no localStorage.

export type CampoArquivo = "fotoTicket" | "antes" | "durante" | "depois" | "trena";

export interface RegistroNaFila {
  clienteId: string;
  usuarioId: number;
  criadoEm: string;
  /** Campos de texto exatamente como vão no FormData de POST /registros. */
  campos: Record<string, string>;
  arquivos: Partial<Record<CampoArquivo, Blob>>;
  rodoviaNome: string;
  /** Motivo quando o servidor recusou o registro (não é falta de internet). */
  erro?: string;
}

const DB_NAME = "diario-de-obra-offline";
const STORE = "registros";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "clienteId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function comStore<T>(modo: IDBTransactionMode, acao: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrirBanco();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, modo);
      const req = acao(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listarFila(usuarioId: number): Promise<RegistroNaFila[]> {
  const todos = await comStore("readonly", (store) => store.getAll() as IDBRequest<RegistroNaFila[]>);
  return todos.filter((r) => r.usuarioId === usuarioId).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}

export async function salvarNaFila(item: RegistroNaFila): Promise<void> {
  await comStore("readwrite", (store) => store.put(item));
}

export async function removerDaFila(clienteId: string): Promise<void> {
  await comStore("readwrite", (store) => store.delete(clienteId));
}
