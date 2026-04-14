"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { MdChat, MdRefresh, MdSend, MdSupportAgent } from "react-icons/md";
import { getApiUrl } from "@/app/config/api";
import { getPublicSocketUrl } from "@/lib/publicApiUrl";
import { useAppContext } from "@/app/context/AppContext";
import {
  isSuperAdminEmail,
  useUserPermissions,
} from "@/app/hooks/useUserPermissions";
import { WithPermission } from "@/app/components/WithPermission/WithPermission";

const SUPER_ADMIN_EMAILS = ["teste@teste", "jeffinho_ns@hotmail.com"];

const API_URL = getApiUrl();
const SOCKET_URL = getPublicSocketUrl();

type ConversationRow = {
  id: number;
  wa_id: string;
  contact_name: string | null;
  human_takeover_until: string | null;
  updated_at: string;
  last_body: string | null;
  last_message_at: string | null;
  last_direction: string | null;
};

type MessageRow = {
  id: number;
  direction: string;
  body: string;
  intent: string | null;
  suggested_reply: string | null;
  created_at: string;
};

function handoffActive(until: string | null | undefined): boolean {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

function pickLatestSuggestedReply(messages: MessageRow[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.direction === "inbound" && m.suggested_reply?.trim()) {
      return m.suggested_reply.trim();
    }
  }
  return "";
}

export default function AdminWhatsappPage() {
  const router = useRouter();
  const { token } = useAppContext();
  const { isLoading: permsLoading, userEmail } = useUserPermissions();
  const canAccessWhatsapp = isSuperAdminEmail(userEmail);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [conversationMeta, setConversationMeta] = useState<{
    human_takeover_until: string | null;
    contact_name: string | null;
  } | null>(null);
  const [composeText, setComposeText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftDirtyRef = useRef(false);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchConversations = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/conversations`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (
          res.status === 403 &&
          (j.error === "INVALID_TOKEN" ||
            /token inválido|expirado/i.test(String(j.message || "")))
        ) {
          throw new Error(
            "Sessão expirada ou token inválido. Faça login de novo para carregar as conversas — elas continuam salvas no servidor.",
          );
        }
        throw new Error(j.message || `Erro ${res.status}`);
      }
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar conversas");
    } finally {
      setLoadingList(false);
    }
  }, [authHeaders]);

  const fetchMessages = useCallback(
    async (waId: string) => {
      setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(waId)}/messages`,
          { headers: authHeaders },
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (
            res.status === 403 &&
            (j.error === "INVALID_TOKEN" ||
              /token inválido|expirado/i.test(String(j.message || "")))
          ) {
            throw new Error(
              "Sessão expirada ou token inválido. Faça login de novo para ver as mensagens.",
            );
          }
          throw new Error(j.message || `Erro ${res.status}`);
        }
        const data = await res.json();
        const list: MessageRow[] = data.messages || [];
        setMessages(list);
        if (data.conversation) {
          setConversationMeta({
            human_takeover_until: data.conversation.human_takeover_until,
            contact_name: data.conversation.contact_name,
          });
        } else {
          setConversationMeta(null);
        }
        if (!draftDirtyRef.current) {
          setComposeText(pickLatestSuggestedReply(list));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar mensagens");
      } finally {
        setLoadingThread(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;
    fetchConversations();
  }, [token, canAccessWhatsapp, fetchConversations]);

  useEffect(() => {
    if (!selectedWaId || !token) return;
    fetchMessages(selectedWaId);
  }, [selectedWaId, token, fetchMessages]);

  useEffect(() => {
    draftDirtyRef.current = false;
  }, [selectedWaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("join_whatsapp_inbox");
    });

    const onUpdate = (payload: { wa_id?: string; type?: string }) => {
      fetchConversations();
      if (payload?.wa_id && selectedWaId === payload.wa_id) {
        fetchMessages(payload.wa_id);
      }
    };

    socket.on("whatsapp_inbox_update", onUpdate);

    const interval = window.setInterval(() => {
      fetchConversations();
      if (selectedWaId) fetchMessages(selectedWaId);
    }, 8000);

    return () => {
      window.clearInterval(interval);
      socket.off("whatsapp_inbox_update", onUpdate);
      socket.disconnect();
    };
  }, [
    token,
    canAccessWhatsapp,
    selectedWaId,
    fetchConversations,
    fetchMessages,
  ]);

  const handleTakeover = async () => {
    if (!selectedWaId || !token) return;
    setTakeoverLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/takeover`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ hours: 24 }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      if (data.conversation) {
        setConversationMeta({
          human_takeover_until: data.conversation.human_takeover_until,
          contact_name: data.conversation.contact_name,
        });
      }
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao assumir conversa");
    } finally {
      setTakeoverLoading(false);
    }
  };

  const handleResumeAI = async () => {
    if (!selectedWaId || !token) return;
    setResumeLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/resume`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      if (data.conversation) {
        setConversationMeta({
          human_takeover_until: data.conversation.human_takeover_until,
          contact_name: data.conversation.contact_name,
        });
      }
      await fetchConversations();
      await fetchMessages(selectedWaId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao retomar IA");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedWaId || !token) return;
    const text = composeText.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/send`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      draftDirtyRef.current = false;
      setComposeText("");
      await fetchMessages(selectedWaId);
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.wa_id === selectedWaId);
  const handoff =
    handoffActive(conversationMeta?.human_takeover_until) ||
    handoffActive(selectedConv?.human_takeover_until);

  return (
    <WithPermission allowedRoles={[]} allowedEmails={SUPER_ADMIN_EMAILS}>
      {permsLoading ? (
        <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
          Carregando…
        </div>
      ) : (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MdChat className="text-2xl text-amber-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Central WhatsApp
            </h1>
            <p className="text-sm text-gray-600">
              Mensagens em tempo real (Socket.IO) + sugestão editável antes de
              enviar.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchConversations();
            if (selectedWaId) fetchMessages(selectedWaId);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50"
        >
          <MdRefresh />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-2">
          <p>{error}</p>
          {/Sessão expirada|token inválido/i.test(error) ? (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center rounded-lg bg-red-800 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-900"
            >
              Ir para o login
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-4 flex-col lg:flex-row border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-[40vh] lg:max-h-none">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Conversas {loadingList ? "…" : `(${conversations.length})`}
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 && !loadingList && (
              <p className="p-4 text-sm text-gray-500">
                Nenhuma conversa ainda. Envie uma mensagem para o número
                conectado à API ou rode a migration no banco.
              </p>
            )}
            {conversations.map((c) => {
              const active = c.wa_id === selectedWaId;
              const ho = handoffActive(c.human_takeover_until);
              return (
                <button
                  key={c.wa_id}
                  type="button"
                  onClick={() => setSelectedWaId(c.wa_id)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-amber-50/60 transition-colors ${
                    active ? "bg-amber-50 border-l-4 border-l-amber-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {c.contact_name || c.wa_id}
                    </span>
                    {ho && (
                      <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        Humano
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.last_body || "—"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-h-[50vh] lg:min-h-[560px]">
          {!selectedWaId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8">
              Selecione uma conversa à esquerda.
            </div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {conversationMeta?.contact_name ||
                      selectedConv?.contact_name ||
                      selectedWaId}
                  </h2>
                  <p className="text-xs text-gray-500 font-mono">{selectedWaId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {handoff ? (
                    <span className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded-md">
                      IA pausada (handoff ativo)
                    </span>
                  ) : null}
                  {handoff ? (
                    <button
                      type="button"
                      onClick={handleResumeAI}
                      disabled={resumeLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <MdSupportAgent className="text-lg" />
                      {resumeLoading ? "Retomando…" : "Retomar IA"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleTakeover}
                    disabled={takeoverLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    <MdSupportAgent className="text-lg" />
                    {takeoverLoading ? "Assumindo…" : "Assumir conversa"}
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/80">
                {loadingThread && messages.length === 0 ? (
                  <p className="text-sm text-gray-500">Carregando mensagens…</p>
                ) : null}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        m.direction === "outbound"
                          ? "bg-amber-600 text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      {m.direction === "inbound" && m.intent ? (
                        <p className="text-[10px] mt-1 opacity-80">
                          intent: {m.intent}
                        </p>
                      ) : null}
                      <p
                        className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-amber-100" : "text-gray-400"}`}
                      >
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t border-gray-200 p-4 bg-white space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  Sugestão da IA (edite antes de enviar)
                </label>
                <textarea
                  value={composeText}
                  onChange={(e) => {
                    draftDirtyRef.current = true;
                    setComposeText(e.target.value);
                  }}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y min-h-[96px]"
                  placeholder="A sugestão do Host Digital aparece aqui quando a IA processar a última mensagem…"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !composeText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    <MdSend />
                    {sending ? "Enviando…" : "Enviar no WhatsApp"}
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
      )}
    </WithPermission>
  );
}
