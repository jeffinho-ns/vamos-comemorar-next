"use client";

import { useCallback, useState } from "react";
import { j360Fetch } from "../../../lib/justino360/api";
import type { IaMeta } from "./iaMeta";

/**
 * Envelope dos endpoints /ai/*. `j360Fetch` devolve o JSON cru da API, então o
 * cast aqui só descreve os campos extras (`meta`, `code`) que a rota de IA envia
 * além de `success`/`data`/`message`.
 */
export type IaEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  meta?: IaMeta;
};

export async function iaFetch<T>(path: string, init?: RequestInit): Promise<IaEnvelope<T>> {
  const res = await j360Fetch<T>(path, init);
  return res as IaEnvelope<T>;
}

/**
 * Estado de uma ação de IA. Erro e resultado são exclusivos: uma nova execução
 * limpa o anterior para a tela nunca mostrar preview velho junto de erro novo.
 */
export function useIaAction<T>() {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<IaMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (path: string, init?: RequestInit): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await iaFetch<T>(path, init);
        if (!res.success || !res.data) {
          setData(null);
          setMeta(null);
          setError(res.message || "Não foi possível concluir a geração.");
          return null;
        }
        setData(res.data);
        setMeta(res.meta || null);
        return res.data;
      } catch {
        setData(null);
        setMeta(null);
        setError("Falha de conexão com a API. Verifique a rede e tente de novo.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setData(null);
    setMeta(null);
    setError(null);
  }, []);

  return { data, meta, error, loading, run, reset, setError };
}
