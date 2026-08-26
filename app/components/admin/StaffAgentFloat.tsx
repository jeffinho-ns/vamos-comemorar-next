"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdClose, MdSend, MdSmartToy } from "react-icons/md";
import { getApiUrl } from "@/app/config/api";
import { useAppContext } from "@/app/context/AppContext";
import { useEstablishmentPermissions } from "@/app/hooks/useEstablishmentPermissions";

const STORAGE_KEY = "staffAgentEstablishmentId";

type ChatMsg = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  confirmId?: string;
};

type StatusPayload = {
  ok?: boolean;
  enabled_globally?: boolean;
  groq_configured?: boolean;
  establishment_enabled?: boolean;
  model?: string;
};

type TurnPayload = {
  ok?: boolean;
  type?: string;
  reply?: string;
  confirm_id?: string;
  error?: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Widget flutuante do Staff Agent (canto inferior direito).
 * Disponível em todas as páginas /admin quando a casa estiver na feature flag.
 */
export default function StaffAgentFloat() {
  const { token, establishments } = useAppContext();
  const { getFilteredEstablishments } = useEstablishmentPermissions();
  const houses = useMemo(() => {
    const filtered = getFilteredEstablishments(establishments || []);
    if (filtered.length > 0) return filtered;
    return establishments || [];
  }, [establishments, getFilteredEstablishments]);

  const [open, setOpen] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!houses.length) return;
    const saved = Number(localStorage.getItem(STORAGE_KEY) || 0);
    const fromSaved = houses.find((h) => Number(h.id) === saved);
    if (fromSaved) {
      setEstablishmentId(Number(fromSaved.id));
      return;
    }
    if (establishmentId == null) {
      setEstablishmentId(Number(houses[0].id));
    }
  }, [houses, establishmentId]);

  useEffect(() => {
    if (establishmentId != null) {
      localStorage.setItem(STORAGE_KEY, String(establishmentId));
    }
  }, [establishmentId]);

  const loadStatus = useCallback(async () => {
    if (!token || !establishmentId) {
      setStatus(null);
      return;
    }
    try {
      const res = await fetch(
        `${getApiUrl()}/api/staff-agent/status?establishment_id=${establishmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as StatusPayload;
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, [token, establishmentId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, loading]);

  const enabled = Boolean(
    status?.enabled_globally &&
      status?.establishment_enabled &&
      status?.groq_configured,
  );

  const pushAssistant = (text: string, confirmId?: string) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "assistant", text, confirmId },
    ]);
  };

  const sendTurn = async () => {
    const text = input.trim();
    if (!text || !token || !establishmentId || loading || pendingConfirmId) return;
    setInput("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-agent/turn`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ establishment_id: establishmentId, message: text }),
      });
      const data = (await res.json()) as TurnPayload;
      if (!res.ok || data.ok === false) {
        pushAssistant(data.error || "Não foi possível processar agora.");
        return;
      }
      const reply = data.reply || "Pronto.";
      if ((data.type === "confirm" || data.confirm_id) && data.confirm_id) {
        setPendingConfirmId(data.confirm_id);
        pushAssistant(reply, data.confirm_id);
      } else {
        pushAssistant(reply);
      }
    } catch {
      pushAssistant("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (apply: boolean) => {
    if (!pendingConfirmId || !token || loading) return;
    if (!apply) {
      setPendingConfirmId(null);
      pushAssistant("Cancelado. Nada foi alterado.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff-agent/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm_id: pendingConfirmId }),
      });
      const data = (await res.json()) as TurnPayload;
      setPendingConfirmId(null);
      pushAssistant(data.reply || (data.ok ? "Feito." : data.error || "Não aplicado."));
    } catch {
      pushAssistant("Falha ao confirmar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !enabled) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 pointer-events-none">
      {open && (
        <div className="pointer-events-auto w-[min(100vw-1.5rem,380px)] h-[min(70vh,520px)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-900 text-white">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Assistente do turno</p>
              <p className="text-[11px] text-slate-300 truncate">
                Groq · só esta casa · confirma antes de alterar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Fechar"
            >
              <MdClose size={18} />
            </button>
          </div>

          {houses.length > 1 && (
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <label className="sr-only" htmlFor="staff-agent-house">
                Estabelecimento
              </label>
              <select
                id="staff-agent-house"
                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                value={establishmentId ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setEstablishmentId(Number.isFinite(id) ? id : null);
                  setMessages([]);
                  setPendingConfirmId(null);
                }}
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 leading-relaxed">
                Ex.: “como está o dia de hoje?”, “quem está na espera?”, “pausar a
                caipirinha”.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-indigo-600 text-white rounded-br-md"
                    : "mr-auto bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-slate-400">Pensando…</p>
            )}
          </div>

          {pendingConfirmId && (
            <div className="flex gap-2 px-3 py-2 border-t border-slate-100 bg-amber-50">
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmAction(true)}
                className="flex-1 rounded-xl bg-emerald-600 text-white text-sm font-medium py-2 disabled:opacity-40"
              >
                Confirmar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmAction(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium py-2"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="flex gap-2 p-3 border-t border-slate-100 bg-white">
            <input
              type="text"
              value={input}
              disabled={loading || Boolean(pendingConfirmId)}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendTurn();
                }
              }}
              placeholder={
                pendingConfirmId
                  ? "Confirme ou cancele a ação…"
                  : "Escreva seu pedido…"
              }
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => void sendTurn()}
              disabled={loading || !input.trim() || Boolean(pendingConfirmId)}
              className="rounded-xl bg-slate-900 text-white p-2.5 disabled:opacity-40"
              aria-label="Enviar"
            >
              <MdSend size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 flex items-center justify-center"
        aria-label={open ? "Fechar assistente" : "Abrir assistente do turno"}
      >
        {open ? <MdClose size={24} /> : <MdSmartToy size={26} />}
      </button>
    </div>
  );
}
