"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiUrl } from "../../config/api";
import { getPublicSocketUrl } from "@/lib/publicApiUrl";

export interface BiStatusRow {
  status: string;
  reservas: number;
  pessoas: number;
  checkins: number;
}

export interface BiRecente {
  id: number;
  status: string;
  pessoas: number;
  hora: string | null;
  nome: string;
  checkedIn: boolean;
}

export interface BiMapItem {
  action: string;
  area: string;
  label: string;
  origem: "nosso_banco" | "aguarda_variaveis";
  tabela: string | null;
}

export interface BiLiveData {
  ok: boolean;
  updatedAt: string;
  hoje: { reservas: number; pessoas: number; checkins: number; convidados: number | null };
  agenda: { reservas: number; pessoas: number };
  ultimoDia: { data: string; reservas: number; pessoas: number } | null;
  mes: { reservas: number; pessoas: number };
  porStatus: BiStatusRow[];
  recentesEm: string;
  recentes: BiRecente[];
  mapa: BiMapItem[];
}

function readToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

export function useBiLive() {
  const [data, setData] = useState<BiLiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [freshIds, setFreshIds] = useState<number[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setError("Entre de novo para ver o painel.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/bi/justino/ao-vivo`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(res.status === 403 ? "Sem permissão para ver este painel." : "Não consegui ler o banco agora.");
        return;
      }
      const next = json as BiLiveData;
      const arrived = next.recentes.map((row) => row.id);
      if (!firstLoad.current) {
        const unseen = arrived.filter((id) => !seenIds.current.has(id));
        if (unseen.length) {
          setFreshIds(unseen);
          window.setTimeout(() => setFreshIds([]), 1200);
        }
      }
      firstLoad.current = false;
      seenIds.current = new Set(arrived);
      setData(next);
      setError(null);
    } catch {
      setError("Sem conexão com a API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    let socket: Socket | null = null;
    try {
      socket = io(getPublicSocketUrl(), { transports: ["websocket", "polling"] });
      socket.on("connect", () => {
        setConnected(true);
        socket?.emit("join_bi_justino");
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("bi_justino_changed", () => {
        load();
      });
    } catch {
      setConnected(false);
    }
    return () => {
      window.clearInterval(timer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [load]);

  return { data, error, loading, connected, freshIds, reload: load };
}
