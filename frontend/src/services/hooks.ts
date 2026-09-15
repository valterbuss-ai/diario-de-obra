import { useEffect, useState } from "react";
import { api } from "./api";

const CACHE_PREFIX = "diario:cache:";

function lerCache<T>(url: string): T[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

function gravarCache(url: string, data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(data));
  } catch {
    // sem espaço no aparelho: segue sem cópia local
  }
}

// Guarda no aparelho a última resposta de cada lista. Sem internet, a tela usa
// essa cópia em vez de ficar vazia — é o que permite lançar registros offline.
export function useApiList<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>(() => lerCache<T>(url) ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const cache = lerCache<T>(url);
    if (cache) setData(cache);
    setLoading(!cache);
    api
      .get<T[]>(url)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setError(null);
        gravarCache(url, res.data);
      })
      .catch((err) => {
        if (!active) return;
        const semConexao = !err.response;
        if (!(cache && semConexao)) setError("Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, ...deps]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
