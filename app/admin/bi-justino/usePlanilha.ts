"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiUrl } from "../../config/api";
import { getPublicSocketUrl } from "@/lib/publicApiUrl";

/** Resposta crua de uma leitura `get*` da planilha, copiada no banco. */
export interface CopiaPlanilha<T = Record<string, unknown>> {
  payload: T;
  capturedAt: string;
}

export type DadosPlanilha = Record<string, CopiaPlanilha | undefined>;

export function tokenPainel() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

/**
 * Lê do nosso banco a última cópia das leituras da planilha do Seu Justino.
 * As chaves são as do catálogo da API (`getMkReunioes`, `getEntries:marketing`, `getMonthClosures:rh`…).
 * Recarrega quando a API avisa que o espelho mudou e a cada 60 s.
 */
export function usePlanilha(chaves: string[]) {
  const [dados, setDados] = useState<DadosPlanilha>({});
  const [faltando, setFaltando] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const assinatura = useMemo(() => [...chaves].sort().join(","), [chaves]);
  const vivo = useRef(true);

  const carregar = useCallback(async () => {
    if (!assinatura) {
      setCarregando(false);
      return;
    }
    const token = tokenPainel();
    if (!token) {
      setErro("Entre de novo para ver o painel.");
      setCarregando(false);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/bi/justino/planilha?chaves=${encodeURIComponent(assinatura)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; dados?: DadosPlanilha; faltando?: string[] } | null;
      if (!vivo.current) return;
      if (!res.ok || !json?.ok) {
        setErro(res.status === 403 ? "Sem permissão para ver este painel." : "Não consegui ler o banco agora.");
        return;
      }
      setDados(json.dados ?? {});
      setFaltando(json.faltando ?? []);
      setErro(null);
    } catch {
      if (vivo.current) setErro("Sem conexão com a API.");
    } finally {
      if (vivo.current) setCarregando(false);
    }
  }, [assinatura]);

  useEffect(() => {
    vivo.current = true;
    carregar();
    const timer = window.setInterval(carregar, 60000);
    let socket: Socket | null = null;
    try {
      socket = io(getPublicSocketUrl(), { transports: ["websocket", "polling"] });
      socket.on("connect", () => socket?.emit("join_bi_justino"));
      socket.on("bi_justino_changed", () => { carregar(); });
    } catch {
      socket = null;
    }
    return () => {
      vivo.current = false;
      window.clearInterval(timer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [carregar]);

  return { dados, faltando, erro, carregando, recarregar: carregar };
}

/** Atalho tipado: devolve o payload de uma chave ou null. */
export function payloadDe<T>(dados: DadosPlanilha, chave: string): T | null {
  const copia = dados[chave];
  return copia ? (copia.payload as unknown as T) : null;
}

/** Lista `items`/`docs` do payload, ou o próprio array — nunca devolve algo que não seja array. */
export function itensDe<T>(bruto: unknown): T[] {
  if (Array.isArray(bruto)) return bruto as T[];
  if (!bruto || typeof bruto !== "object") return [];
  const obj = bruto as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as T[];
  if (Array.isArray(obj.docs)) return obj.docs as T[];
  if (obj.payload) return itensDe<T>(obj.payload);
  return [];
}

/** POST autenticado para as rotas de escrita do BI (`/api/bi/justino/...`). */
export async function chamarBi<T = Record<string, unknown>>(caminho: string, corpo: unknown): Promise<{ ok: boolean; status: number; json: T | null }> {
  const token = tokenPainel();
  const res = await fetch(`${getApiUrl()}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(corpo ?? {}),
  });
  const json = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, json };
}
