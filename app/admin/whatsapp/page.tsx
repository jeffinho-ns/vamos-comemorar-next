"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  MdChat,
  MdContentCopy,
  MdLink,
  MdOpenInNew,
  MdRefresh,
  MdSend,
  MdSupportAgent,
} from "react-icons/md";
import { getApiUrl } from "@/app/config/api";
import { getPublicSocketUrl } from "@/lib/publicApiUrl";
import { useAppContext } from "@/app/context/AppContext";
import { useUserPermissions } from "@/app/hooks/useUserPermissions";

const API_URL = getApiUrl();
const SOCKET_URL = getPublicSocketUrl();

type ConversationRow = {
  id: number;
  wa_id: string;
  contact_name: string | null;
  establishment_id: number | null;
  establishment_name: string | null;
  status: "new" | "in_progress" | "waiting_customer" | "resolved";
  assigned_user_id: number | null;
  assigned_user_name: string | null;
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

type ContactRow = {
  id: number;
  wa_id: string;
  contact_name: string | null;
  client_email: string | null;
  birth_date: string | null;
  last_establishment_id: number | null;
  last_establishment_name: string | null;
  last_reservation_id: number | null;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  contact_status: "new" | "qualified" | "customer" | "inactive";
  tags: string[] | null;
  notes: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

type CampaignRow = {
  id: number;
  establishment_id: number;
  establishment_name: string | null;
  name: string;
  message_template: string;
  target_filters: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
};

type ReportSummary = {
  conversations_total: number;
  conversations_resolved: number;
  contacts_total: number;
  contacts_opt_in: number;
  reservations_whatsapp: number;
};

type CampaignBatchRow = {
  id: number;
  campaign_id: number;
  status: string;
  total_planned: number;
  processed_count: number;
  sent_ok: number;
  sent_fail: number;
  skipped_count: number;
  cursor_last_contact_id: number;
  chunk_size: number;
  delay_ms: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type CampaignSendLogRow = {
  id: number;
  batch_id: number;
  contact_id: number | null;
  wa_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type WhatsappAdminTab = "atendimento" | "links" | "crm" | "campanhas" | "relatorios";

/** Códigos fixos (API/banco); labels em PT para o time (opção A — sem mudar enum). */
type LeadContactStatus = "new" | "qualified" | "customer" | "inactive";

const LEAD_CONTACT_STATUS_ORDER: LeadContactStatus[] = [
  "new",
  "qualified",
  "customer",
  "inactive",
];

const LEAD_CONTACT_STATUS_LABELS: Record<LeadContactStatus, string> = {
  new: "Novo",
  qualified: "Em qualificação",
  customer: "Cliente",
  inactive: "Inativo",
};

const LEAD_CONTACT_STATUS_HINTS: Record<LeadContactStatus, string> = {
  new: "Primeiro contato ou ainda não trabalhado pelo time.",
  qualified: "Em conversão ou já qualificado comercialmente.",
  customer: "Já é cliente ou possui reserva associada.",
  inactive: "Sem interesse no momento ou lead arquivado.",
};

function leadContactStatusLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return LEAD_CONTACT_STATUS_LABELS[code as LeadContactStatus] ?? code;
}

function leadContactStatusBadgeClass(code: string | null | undefined): string {
  switch (code) {
    case "new":
      return "bg-sky-100 text-sky-800";
    case "qualified":
      return "bg-amber-100 text-amber-900";
    case "customer":
      return "bg-emerald-100 text-emerald-800";
    case "inactive":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

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

function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

function buildEstablishmentToken(establishmentId: number): string {
  return `#EST_${establishmentId}`;
}

function buildEstablishmentLinkText(establishmentName: string, establishmentId: number): string {
  return `Olá! Quero fazer uma reserva no ${establishmentName}. ${buildEstablishmentToken(establishmentId)}`;
}

function buildWhatsAppEntryLink(phoneDigits: string, text: string): string {
  const base = phoneDigits ? `https://wa.me/${phoneDigits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

function fallbackCopyText(value: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.createElement("textarea");
  el.value = value;
  el.setAttribute("readonly", "true");
  el.style.position = "fixed";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  el.focus();
  el.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(el);
  return copied;
}

export default function AdminWhatsappPage() {
  const router = useRouter();
  const { token, establishments } = useAppContext();
  const {
    isLoading: permsLoading,
    canAccessWhatsapp,
    isSuperAdmin,
    myEstablishmentPermissions,
  } = useUserPermissions();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [conversationMeta, setConversationMeta] = useState<{
    human_takeover_until: string | null;
    contact_name: string | null;
    establishment_id: number | null;
    establishment_name: string | null;
    status: "new" | "in_progress" | "waiting_customer" | "resolved";
    assigned_user_id: number | null;
    assigned_user_name: string | null;
  } | null>(null);
  const [composeText, setComposeText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [exportingContacts, setExportingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactEstablishmentId, setContactEstablishmentId] = useState<number | "">(
    "",
  );
  const [contactStatusFilter, setContactStatusFilter] = useState<
    "" | "new" | "qualified" | "customer" | "inactive"
  >("");
  const [savingContactIds, setSavingContactIds] = useState<number[]>([]);
  const [contactDrafts, setContactDrafts] = useState<
    Record<number, { marketing_opt_in: boolean; contact_status: string; tags: string; notes: string }>
  >({});
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
  const [previewLoadingCampaignId, setPreviewLoadingCampaignId] = useState<number | null>(
    null,
  );
  const [campaignAudiencePreview, setCampaignAudiencePreview] = useState<{
    campaignId: number;
    estimatedCount: number;
    sample: ContactRow[];
  } | null>(null);
  const [sendCampaignLoading, setSendCampaignLoading] = useState(false);
  const [selectedCampaignForSend, setSelectedCampaignForSend] = useState<number | "">(
    "",
  );
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [batchCampaignId, setBatchCampaignId] = useState<number | "">("");
  const [batchChunkSize, setBatchChunkSize] = useState(25);
  const [batchDelayMs, setBatchDelayMs] = useState(400);
  const [campaignBatches, setCampaignBatches] = useState<CampaignBatchRow[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [processingBatchId, setProcessingBatchId] = useState<number | null>(null);
  const [cancellingBatchId, setCancellingBatchId] = useState<number | null>(null);
  const [batchLogsForId, setBatchLogsForId] = useState<number | null>(null);
  const [batchLogs, setBatchLogs] = useState<CampaignSendLogRow[]>([]);
  const [loadingBatchLogs, setLoadingBatchLogs] = useState(false);
  const [campaignForm, setCampaignForm] = useState<{
    establishment_id: number | "";
    name: string;
    message_template: string;
    tags_filter: string;
    status_filter: "" | "new" | "qualified" | "customer" | "inactive";
    only_opt_in: boolean;
  }>({
    establishment_id: "",
    name: "",
    message_template: "",
    tags_filter: "",
    status_filter: "",
    only_opt_in: true,
  });
  const [manualCentralWhatsappNumber, setManualCentralWhatsappNumber] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WhatsappAdminTab>("atendimento");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const draftDirtyRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("admin_whatsapp_central_number_manual");
    if (saved?.trim()) {
      setManualCentralWhatsappNumber(saved.trim());
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = manualCentralWhatsappNumber.trim();
    if (!value) {
      window.localStorage.removeItem("admin_whatsapp_central_number_manual");
      return;
    }
    window.localStorage.setItem("admin_whatsapp_central_number_manual", value);
  }, [manualCentralWhatsappNumber]);

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
            establishment_id: data.conversation.establishment_id ?? null,
            establishment_name: data.conversation.establishment_name ?? null,
            status: data.conversation.status ?? "new",
            assigned_user_id: data.conversation.assigned_user_id ?? null,
            assigned_user_name: data.conversation.assigned_user_name ?? null,
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

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoadingContacts(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (contactSearch.trim()) {
        params.set("search", contactSearch.trim());
      }
      if (contactEstablishmentId !== "") {
        params.set("establishment_id", String(contactEstablishmentId));
      }
      if (contactStatusFilter) {
        params.set("contact_status", contactStatusFilter);
      }
      const query = params.toString();
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/contacts${query ? `?${query}` : ""}`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      const list = Array.isArray(data.contacts) ? (data.contacts as ContactRow[]) : [];
      setContacts(list);
      setContactDrafts((prev) => {
        const next: Record<
          number,
          { marketing_opt_in: boolean; contact_status: string; tags: string; notes: string }
        > = { ...prev };
        for (const contact of list) {
          next[contact.id] = {
            marketing_opt_in: Boolean(contact.marketing_opt_in),
            contact_status: contact.contact_status || "new",
            tags: Array.isArray(contact.tags) ? contact.tags.join(", ") : "",
            notes: contact.notes || "",
          };
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar contatos");
    } finally {
      setLoadingContacts(false);
    }
  }, [authHeaders, contactEstablishmentId, contactSearch, contactStatusFilter, token]);

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoadingCampaigns(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (contactEstablishmentId !== "") {
        params.set("establishment_id", String(contactEstablishmentId));
      }
      const query = params.toString();
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns${query ? `?${query}` : ""}`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar campanhas");
    } finally {
      setLoadingCampaigns(false);
    }
  }, [authHeaders, contactEstablishmentId, token]);

  const fetchCampaignBatches = useCallback(async () => {
    if (!token || batchCampaignId === "") return;
    setLoadingBatches(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${batchCampaignId}/batches`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaignBatches(Array.isArray(data.batches) ? data.batches : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar filas de disparo");
    } finally {
      setLoadingBatches(false);
    }
  }, [authHeaders, batchCampaignId, token]);

  const fetchReportSummary = useCallback(async () => {
    if (!token) return;
    setLoadingReport(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (contactEstablishmentId !== "") {
        params.set("establishment_id", String(contactEstablishmentId));
      }
      if (reportStartDate) params.set("start_date", reportStartDate);
      if (reportEndDate) params.set("end_date", reportEndDate);
      const query = params.toString();
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/reports/summary${query ? `?${query}` : ""}`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setReportSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar relatório");
    } finally {
      setLoadingReport(false);
    }
  }, [authHeaders, contactEstablishmentId, reportEndDate, reportStartDate, token]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;
    fetchConversations();
  }, [token, canAccessWhatsapp, fetchConversations]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;
    fetchContacts();
  }, [token, canAccessWhatsapp, fetchContacts]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;
    fetchCampaigns();
  }, [token, canAccessWhatsapp, fetchCampaigns]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp || batchCampaignId === "") return;
    fetchCampaignBatches();
  }, [token, canAccessWhatsapp, batchCampaignId, fetchCampaignBatches]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;
    fetchReportSummary();
  }, [token, canAccessWhatsapp, fetchReportSummary]);

  useEffect(() => {
    if (!selectedWaId || !token) return;
    fetchMessages(selectedWaId);
  }, [selectedWaId, token, fetchMessages]);

  useEffect(() => {
    draftDirtyRef.current = false;
  }, [selectedWaId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("join_whatsapp_inbox");
    });

    const onUpdate = () => {
      fetchConversations();
      if (selectedWaId) {
        fetchMessages(selectedWaId);
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
          establishment_id: data.conversation.establishment_id ?? null,
          establishment_name: data.conversation.establishment_name ?? null,
          status: data.conversation.status ?? "new",
          assigned_user_id: data.conversation.assigned_user_id ?? null,
          assigned_user_name: data.conversation.assigned_user_name ?? null,
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
          establishment_id: data.conversation.establishment_id ?? null,
          establishment_name: data.conversation.establishment_name ?? null,
          status: data.conversation.status ?? "new",
          assigned_user_id: data.conversation.assigned_user_id ?? null,
          assigned_user_name: data.conversation.assigned_user_name ?? null,
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

  const handleStatusChange = async (
    status: "new" | "in_progress" | "waiting_customer" | "resolved",
  ) => {
    if (!selectedWaId || !token) return;
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/status`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      if (data.conversation) {
        setConversationMeta({
          human_takeover_until: data.conversation.human_takeover_until,
          contact_name: data.conversation.contact_name,
          establishment_id: data.conversation.establishment_id ?? null,
          establishment_name: data.conversation.establishment_name ?? null,
          status: data.conversation.status ?? "new",
          assigned_user_id: data.conversation.assigned_user_id ?? null,
          assigned_user_name: data.conversation.assigned_user_name ?? null,
        });
      }
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssignSelf = async () => {
    if (!selectedWaId || !token) return;
    setAssignLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/assign-self`,
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
          establishment_id: data.conversation.establishment_id ?? null,
          establishment_name: data.conversation.establishment_name ?? null,
          status: data.conversation.status ?? "new",
          assigned_user_id: data.conversation.assigned_user_id ?? null,
          assigned_user_name: data.conversation.assigned_user_name ?? null,
        });
      }
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atribuir conversa");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedWaId || !token) return;
    setAssignLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/unassign`,
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
          establishment_id: data.conversation.establishment_id ?? null,
          establishment_name: data.conversation.establishment_name ?? null,
          status: data.conversation.status ?? "new",
          assigned_user_id: data.conversation.assigned_user_id ?? null,
          assigned_user_name: data.conversation.assigned_user_name ?? null,
        });
      }
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao liberar conversa");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleExportContactsCsv = async () => {
    if (!token) return;
    setExportingContacts(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (contactSearch.trim()) {
        params.set("search", contactSearch.trim());
      }
      if (contactEstablishmentId !== "") {
        params.set("establishment_id", String(contactEstablishmentId));
      }
      const query = params.toString();
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/contacts/export.csv${query ? `?${query}` : ""}`,
        { headers: authHeaders },
      );
      if (!res.ok) {
        const maybeJson = await res.json().catch(() => ({}));
        throw new Error(maybeJson.message || `Erro ${res.status}`);
      }
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `whatsapp-contacts-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao exportar CSV");
    } finally {
      setExportingContacts(false);
    }
  };

  const handleSaveContact = async (contactId: number) => {
    if (!token) return;
    const draft = contactDrafts[contactId];
    if (!draft) return;
    setSavingContactIds((prev) => [...prev, contactId]);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/contacts/${contactId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          marketing_opt_in: draft.marketing_opt_in,
          contact_status: draft.contact_status,
          tags: draft.tags,
          notes: draft.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchContacts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar contato");
    } finally {
      setSavingContactIds((prev) => prev.filter((id) => id !== contactId));
    }
  };

  const handleCreateCampaign = async () => {
    if (!token) return;
    if (!campaignForm.establishment_id || !campaignForm.name.trim() || !campaignForm.message_template.trim()) {
      setError("Preencha estabelecimento, nome e mensagem da campanha.");
      return;
    }
    setSavingCampaign(true);
    setError(null);
    try {
      const target_filters: Record<string, unknown> = {
        tags: campaignForm.tags_filter
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        contact_status: campaignForm.status_filter || null,
        marketing_opt_in: campaignForm.only_opt_in,
      };
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          establishment_id: campaignForm.establishment_id,
          name: campaignForm.name.trim(),
          message_template: campaignForm.message_template.trim(),
          target_filters,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaignForm((prev) => ({
        ...prev,
        name: "",
        message_template: "",
        tags_filter: "",
        status_filter: "",
      }));
      await fetchCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar campanha");
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignActive = async (campaign: CampaignRow) => {
    if (!token) return;
    setSavingCampaign(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_active: !campaign.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar campanha");
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!token) return;
    setDeletingCampaignId(campaignId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover campanha");
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const handlePreviewCampaignAudience = async (campaignId: number) => {
    if (!token) return;
    setPreviewLoadingCampaignId(campaignId);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${campaignId}/audience-preview`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaignAudiencePreview({
        campaignId,
        estimatedCount: Number(data.estimated_count || 0),
        sample: Array.isArray(data.sample) ? data.sample : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar prévia da campanha");
    } finally {
      setPreviewLoadingCampaignId(null);
    }
  };

  const handleUseCampaignOnComposer = (campaign: CampaignRow) => {
    if (!selectedWaId) {
      setError("Selecione uma conversa para aplicar a campanha no composer.");
      return;
    }
    draftDirtyRef.current = true;
    setComposeText(campaign.message_template || "");
    setSelectedCampaignForSend(campaign.id);
  };

  const handleSendCampaignToContact = async (contactId: number) => {
    if (!token) return;
    if (!selectedCampaignForSend) {
      setError("Selecione uma campanha para envio.");
      return;
    }
    setSendCampaignLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${selectedCampaignForSend}/send-to-contact`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ contact_id: contactId }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchConversations();
      await fetchContacts();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao enviar campanha para contato",
      );
    } finally {
      setSendCampaignLoading(false);
    }
  };

  const handleLoadBatchLogs = async (batchId: number) => {
    if (!token) return;
    setLoadingBatchLogs(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaign-batches/${batchId}/logs?limit=120`,
        { headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setBatchLogs(Array.isArray(data.logs) ? data.logs : []);
      setBatchLogsForId(batchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar logs");
    } finally {
      setLoadingBatchLogs(false);
    }
  };

  const handleCreateCampaignBatch = async () => {
    if (!token || batchCampaignId === "") return;
    setCreatingBatch(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/${batchCampaignId}/batches`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          chunk_size: batchChunkSize,
          delay_ms: batchDelayMs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaignBatches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar fila de disparo");
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleProcessBatch = async (batchId: number) => {
    if (!token) return;
    setProcessingBatchId(batchId);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaign-batches/${batchId}/process`,
        { method: "POST", headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaignBatches();
      await fetchConversations();
      if (batchLogsForId === batchId) {
        await handleLoadBatchLogs(batchId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao processar lote");
    } finally {
      setProcessingBatchId(null);
    }
  };

  const handleCancelBatch = async (batchId: number) => {
    if (!token) return;
    setCancellingBatchId(batchId);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaign-batches/${batchId}/cancel`,
        { method: "POST", headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaignBatches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar lote");
    } finally {
      setCancellingBatchId(null);
    }
  };

  const selectedConv = conversations.find((c) => c.wa_id === selectedWaId);
  const handoff =
    handoffActive(conversationMeta?.human_takeover_until) ||
    handoffActive(selectedConv?.human_takeover_until);
  const selectedStatus =
    conversationMeta?.status || selectedConv?.status || "new";
  const selectedAssignee =
    conversationMeta?.assigned_user_name || selectedConv?.assigned_user_name;
  const selectedEstablishmentName =
    conversationMeta?.establishment_name || selectedConv?.establishment_name;
  const envCentralWhatsappNumber = (
    process.env.NEXT_PUBLIC_WHATSAPP_CENTRAL_NUMBER || ""
  ).trim();
  const effectiveCentralWhatsappNumber = envCentralWhatsappNumber || manualCentralWhatsappNumber;
  const establishmentFilterOptions = useMemo(() => {
    if (isSuperAdmin) {
      return establishments
        .map((e) => ({ id: Number(e.id), name: e.name }))
        .filter((e) => Number.isFinite(e.id) && e.id > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    const map = new Map<number, string>();
    for (const p of myEstablishmentPermissions) {
      if (!p.can_manage_reservations) continue;
      const id = Number(p.establishment_id);
      if (!Number.isFinite(id) || id <= 0) continue;
      map.set(id, p.establishment_name || `Estabelecimento ${id}`);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [establishments, isSuperAdmin, myEstablishmentPermissions]);
  const centralWhatsappDigits = useMemo(
    () => digitsOnly(effectiveCentralWhatsappNumber),
    [effectiveCentralWhatsappNumber],
  );
  const hasCentralWhatsappDigits = centralWhatsappDigits.length >= 10;
  const handoffConversationsCount = useMemo(
    () => conversations.filter((conv) => handoffActive(conv.human_takeover_until)).length,
    [conversations],
  );
  const activeCampaignsCount = useMemo(
    () => campaigns.filter((campaign) => campaign.is_active).length,
    [campaigns],
  );
  const establishmentEntryLinks = useMemo(
    () =>
      establishmentFilterOptions.map((opt) => {
        const token = buildEstablishmentToken(opt.id);
        const text = buildEstablishmentLinkText(opt.name, opt.id);
        const link = buildWhatsAppEntryLink(centralWhatsappDigits, text);
        return {
          id: opt.id,
          name: opt.name,
          token,
          text,
          link,
        };
      }),
    [centralWhatsappDigits, establishmentFilterOptions],
  );

  const copyToClipboard = useCallback(async (value: string, key: string) => {
    try {
      if (!String(value || "").trim()) {
        throw new Error("empty-value");
      }
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!fallbackCopyText(value)) {
        throw new Error("clipboard-api-unavailable");
      }
      setCopiedLinkId(key);
      window.setTimeout(() => setCopiedLinkId((prev) => (prev === key ? null : prev)), 2200);
    } catch (_e) {
      setError(
        "Não foi possível copiar automaticamente neste navegador. Use o botão Abrir e copie pela barra de endereço.",
      );
    }
  }, []);

  useEffect(() => {
    if (campaignForm.establishment_id !== "") return;
    if (establishmentFilterOptions.length === 0) return;
    setCampaignForm((prev) => ({
      ...prev,
      establishment_id: establishmentFilterOptions[0].id,
    }));
  }, [campaignForm.establishment_id, establishmentFilterOptions]);

  if (permsLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        Carregando…
      </div>
    );
  }

  if (!canAccessWhatsapp) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600 p-6 text-center">
        Você não tem permissão para acessar a Central WhatsApp.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-4 py-4 md:px-5">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-500">Conversas ativas</p>
          <p className="text-2xl font-semibold text-gray-900">{conversations.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <p className="text-xs text-amber-700">Handoff humano</p>
          <p className="text-2xl font-semibold text-amber-900">{handoffConversationsCount}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
          <p className="text-xs text-indigo-700">Contatos CRM</p>
          <p className="text-2xl font-semibold text-indigo-900">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <p className="text-xs text-emerald-700">Campanhas ativas</p>
          <p className="text-2xl font-semibold text-emerald-900">{activeCampaignsCount}</p>
        </div>
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
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-[10px] rounded bg-gray-100 text-gray-600 px-1.5 py-0.5">
                      {c.establishment_name || "Sem estabelecimento"}
                    </span>
                    <span className="text-[10px] rounded bg-blue-100 text-blue-700 px-1.5 py-0.5">
                      {c.status || "new"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-h-[50vh] max-h-[70vh] lg:max-h-[760px]">
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
                  <p className="text-xs text-gray-500">
                    {selectedEstablishmentName || "Sem estabelecimento identificado"}{" "}
                    • {selectedAssignee ? `Responsável: ${selectedAssignee}` : "Sem responsável"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as
                          | "new"
                          | "in_progress"
                          | "waiting_customer"
                          | "resolved",
                      )
                    }
                    disabled={statusLoading}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                  >
                    <option value="new">new</option>
                    <option value="in_progress">in_progress</option>
                    <option value="waiting_customer">waiting_customer</option>
                    <option value="resolved">resolved</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignSelf}
                    disabled={assignLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {assignLoading ? "Salvando…" : "Assumir pra mim"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnassign}
                    disabled={assignLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Liberar
                  </button>
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

              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50/80"
              >
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3">
          {[
            { id: "atendimento", label: "Atendimento" },
            { id: "crm", label: "CRM de contatos" },
            { id: "campanhas", label: "Campanhas" },
            { id: "links", label: "Links de entrada" },
            { id: "relatorios", label: "Relatórios" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as WhatsappAdminTab)}
                className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "atendimento" ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 md:p-5">
          <h2 className="text-base font-semibold text-gray-900">Visão rápida do atendimento</h2>
          <p className="text-sm text-gray-500 mt-1">
            Use este fluxo para operação diária: selecione uma conversa, ajuste status e
            responsável, valide a sugestão da IA e envie.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Conversa selecionada</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {selectedWaId || "Nenhuma conversa selecionada"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Status atual</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{selectedStatus}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {selectedAssignee || "Sem responsável"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "links" ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Links de entrada por estabelecimento
          </h2>
          <p className="text-xs text-gray-500">
            Gere links com token automático (<code>#EST_ID</code>) para a Central AgilizaiApp
            já iniciar no estabelecimento correto.
          </p>
        </div>
        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-[minmax(320px,460px),1fr] gap-3 items-start">
          <div>
            <p className="text-xs font-medium text-gray-600">Número fixo da Central (Render)</p>
            {envCentralWhatsappNumber ? (
              <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p>
                  <strong>Configurado:</strong> {centralWhatsappDigits}
                </p>
                <p className="mt-1">
                  Fonte: <code>NEXT_PUBLIC_WHATSAPP_CENTRAL_NUMBER</code>
                </p>
              </div>
            ) : (
              <div className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <p>
                  Número da central não configurado no build do frontend. Defina{" "}
                  <code>NEXT_PUBLIC_WHATSAPP_CENTRAL_NUMBER</code> no Render e faça novo deploy.
                </p>
                <p className="mt-1">
                  Enquanto isso, use o fallback manual abaixo para gerar os links agora.
                </p>
                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-red-900 mb-1">
                    Fallback manual (apenas neste navegador)
                  </label>
                  <input
                    type="text"
                    value={manualCentralWhatsappNumber}
                    onChange={(e) => setManualCentralWhatsappNumber(e.target.value)}
                    placeholder="5511999998888"
                    className="w-full rounded-md border border-red-200 px-2 py-1.5 text-xs text-gray-800 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-medium">Como funciona</p>
            <p>
              Cada link envia uma mensagem inicial com token do estabelecimento. O webhook
              identifica o token e vincula a conversa automaticamente no CRM.
            </p>
            {!hasCentralWhatsappDigits ? (
              <p className="mt-1 text-red-700">
                Sem número configurado, os botões de link ficam bloqueados.
              </p>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Estabelecimento</th>
                <th className="text-left px-4 py-2">Token</th>
                <th className="text-left px-4 py-2">Mensagem inicial</th>
                <th className="text-left px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {establishmentEntryLinks.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={4}>
                    Nenhum estabelecimento disponível para gerar links.
                  </td>
                </tr>
              ) : null}
              {establishmentEntryLinks.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 text-gray-900">{item.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-indigo-700">{item.token}</td>
                  <td className="px-4 py-2 text-xs text-gray-700 max-w-[520px] break-words">
                    {item.text}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.link, `link-${item.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                        disabled={!hasCentralWhatsappDigits}
                        title={hasCentralWhatsappDigits ? "Copiar link do WhatsApp" : "Informe o número da Central primeiro"}
                      >
                        <MdLink className="text-sm" />
                        {copiedLinkId === `link-${item.id}` ? "Copiado!" : "Copiar link"}
                      </button>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs ${
                          hasCentralWhatsappDigits
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "border-gray-200 bg-gray-100 text-gray-400 pointer-events-none"
                        }`}
                        title={hasCentralWhatsappDigits ? "Abrir link em nova aba" : "Defina o número da Central no Render"}
                      >
                        <MdOpenInNew className="text-sm" />
                        Abrir
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.text, `text-${item.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-gray-300 bg-white text-xs hover:bg-gray-50"
                      >
                        <MdContentCopy className="text-sm" />
                        {copiedLinkId === `text-${item.id}` ? "Copiado!" : "Copiar texto"}
                      </button>
                    </div>
                    {hasCentralWhatsappDigits ? (
                      <p className="mt-1 text-[10px] text-gray-500 break-all">{item.link}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>
      ) : null}

      {activeTab === "crm" ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Contatos WhatsApp (CRM)
            </h2>
            <p className="text-xs text-gray-500">
              Lista por estabelecimento. Funil de lead: Novo → Em qualificação → Cliente →
              Inativo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchContacts}
              disabled={loadingContacts}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingContacts ? "Atualizando…" : "Atualizar contatos"}
            </button>
            <button
              type="button"
              onClick={handleExportContactsCsv}
              disabled={exportingContacts}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {exportingContacts ? "Exportando…" : "Exportar CSV"}
            </button>
            <select
              value={selectedCampaignForSend === "" ? "" : String(selectedCampaignForSend)}
              onChange={(e) =>
                setSelectedCampaignForSend(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Campanha para envio</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={String(campaign.id)}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            value={contactEstablishmentId === "" ? "" : String(contactEstablishmentId)}
            onChange={(e) => {
              if (!e.target.value) {
                setContactEstablishmentId("");
                return;
              }
              const parsed = Number(e.target.value);
              setContactEstablishmentId(Number.isFinite(parsed) ? parsed : "");
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os estabelecimentos</option>
            {establishmentFilterOptions.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
          <select
            value={contactStatusFilter}
            onChange={(e) =>
              setContactStatusFilter(
                e.target.value as "" | "new" | "qualified" | "customer" | "inactive",
              )
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos os status de lead</option>
            {LEAD_CONTACT_STATUS_ORDER.map((s) => (
              <option key={s} value={s} title={LEAD_CONTACT_STATUS_HINTS[s]}>
                {LEAD_CONTACT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchContacts}
            disabled={loadingContacts}
            className="inline-flex justify-center items-center px-3 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
          >
            Aplicar filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Contato</th>
                <th className="text-left px-4 py-2">WhatsApp</th>
                <th className="text-left px-4 py-2">E-mail</th>
                <th className="text-left px-4 py-2">Estabelecimento</th>
                <th className="text-left px-4 py-2">
                  <span className="block">Lead / CRM</span>
                  <span className="block text-[10px] font-normal text-gray-400">
                    opt-in, status, tags, notas
                  </span>
                </th>
                <th className="text-left px-4 py-2">Último contato</th>
                <th className="text-left px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && !loadingContacts ? (
                <tr>
                  <td
                    className="px-4 py-4 text-gray-500"
                    colSpan={7}
                  >
                    Nenhum contato encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : null}
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">
                    {contact.contact_name || "Sem nome"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">
                    {contact.wa_id}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {contact.client_email || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {contact.last_establishment_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 min-w-[260px]">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500">
                        Status:{" "}
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${leadContactStatusBadgeClass(
                            contactDrafts[contact.id]?.contact_status ?? contact.contact_status,
                          )}`}
                        >
                          {leadContactStatusLabel(
                            contactDrafts[contact.id]?.contact_status ?? contact.contact_status,
                          )}
                        </span>
                      </p>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(contactDrafts[contact.id]?.marketing_opt_in)}
                          onChange={(e) =>
                            setContactDrafts((prev) => ({
                              ...prev,
                              [contact.id]: {
                                ...(prev[contact.id] || {
                                  marketing_opt_in: false,
                                  contact_status: "new",
                                  tags: "",
                                  notes: "",
                                }),
                                marketing_opt_in: e.target.checked,
                              },
                            }))
                          }
                        />
                        Opt-in marketing
                      </label>
                      <select
                        value={contactDrafts[contact.id]?.contact_status || "new"}
                        onChange={(e) =>
                          setContactDrafts((prev) => ({
                            ...prev,
                            [contact.id]: {
                              ...(prev[contact.id] || {
                                marketing_opt_in: false,
                                contact_status: "new",
                                tags: "",
                                notes: "",
                              }),
                              contact_status: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                        aria-label="Status do lead"
                      >
                        {LEAD_CONTACT_STATUS_ORDER.map((s) => (
                          <option key={s} value={s} title={LEAD_CONTACT_STATUS_HINTS[s]}>
                            {LEAD_CONTACT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={contactDrafts[contact.id]?.tags || ""}
                        onChange={(e) =>
                          setContactDrafts((prev) => ({
                            ...prev,
                            [contact.id]: {
                              ...(prev[contact.id] || {
                                marketing_opt_in: false,
                                contact_status: "new",
                                tags: "",
                                notes: "",
                              }),
                              tags: e.target.value,
                            },
                          }))
                        }
                        placeholder="tags separadas por vírgula"
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={contactDrafts[contact.id]?.notes || ""}
                        onChange={(e) =>
                          setContactDrafts((prev) => ({
                            ...prev,
                            [contact.id]: {
                              ...(prev[contact.id] || {
                                marketing_opt_in: false,
                                contact_status: "new",
                                tags: "",
                                notes: "",
                              }),
                              notes: e.target.value,
                            },
                          }))
                        }
                        placeholder="nota interna"
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {new Date(contact.last_seen_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveContact(contact.id)}
                        disabled={savingContactIds.includes(contact.id)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50"
                      >
                        {savingContactIds.includes(contact.id) ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendCampaignToContact(contact.id)}
                        disabled={sendCampaignLoading || !selectedCampaignForSend}
                        className="inline-flex items-center px-2.5 py-1.5 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                        title="Respeita trava de opt-in"
                      >
                        {sendCampaignLoading ? "Enviando…" : "Enviar campanha"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>
      ) : null}

      {activeTab === "campanhas" ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Campanhas salvas por estabelecimento
          </h2>
          <p className="text-xs text-gray-500">
            Salve mensagem e filtros de público para uso rápido do time.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-gray-100">
          <select
            value={campaignForm.establishment_id === "" ? "" : String(campaignForm.establishment_id)}
            onChange={(e) =>
              setCampaignForm((prev) => ({
                ...prev,
                establishment_id: e.target.value ? Number(e.target.value) : "",
              }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Selecione o estabelecimento</option>
            {establishmentFilterOptions.map((opt) => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={campaignForm.name}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Nome da campanha"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            value={campaignForm.message_template}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, message_template: e.target.value }))
            }
            placeholder="Mensagem modelo da campanha"
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="text"
            value={campaignForm.tags_filter}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, tags_filter: e.target.value }))
            }
            placeholder="Filtro de tags (vip, rooftop, aniversário)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={campaignForm.status_filter}
              onChange={(e) =>
                setCampaignForm((prev) => ({
                  ...prev,
                  status_filter: e.target.value as
                    | ""
                    | "new"
                    | "qualified"
                    | "customer"
                    | "inactive",
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Status de lead: todos</option>
              {LEAD_CONTACT_STATUS_ORDER.map((s) => (
                <option key={s} value={s} title={LEAD_CONTACT_STATUS_HINTS[s]}>
                  {LEAD_CONTACT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
              <input
                type="checkbox"
                checked={campaignForm.only_opt_in}
                onChange={(e) =>
                  setCampaignForm((prev) => ({ ...prev, only_opt_in: e.target.checked }))
                }
              />
              Só opt-in
            </label>
          </div>
          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={savingCampaign}
            className="inline-flex justify-center items-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 md:col-span-2"
          >
            {savingCampaign ? "Salvando campanha…" : "Salvar campanha"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Campanha</th>
                <th className="text-left px-4 py-2">Estabelecimento</th>
                <th className="text-left px-4 py-2">Filtros</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && !loadingCampaigns ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={5}>
                    Nenhuma campanha salva ainda.
                  </td>
                </tr>
              ) : null}
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {campaign.message_template}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {campaign.establishment_name || `ID ${campaign.establishment_id}`}
                  </td>
                  <td className="px-4 py-2 text-gray-700 text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(campaign.target_filters || {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        campaign.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {campaign.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseCampaignOnComposer(campaign)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded bg-amber-600 text-white text-xs hover:bg-amber-700"
                      >
                        Usar no atendimento
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreviewCampaignAudience(campaign.id)}
                        disabled={previewLoadingCampaignId === campaign.id}
                        className="inline-flex items-center px-2.5 py-1.5 rounded border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        {previewLoadingCampaignId === campaign.id
                          ? "Calculando…"
                          : "Prévia público"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignActive(campaign)}
                        disabled={savingCampaign}
                        className="inline-flex items-center px-2.5 py-1.5 rounded border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        {campaign.is_active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        disabled={deletingCampaignId === campaign.id}
                        className="inline-flex items-center px-2.5 py-1.5 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingCampaignId === campaign.id ? "Removendo…" : "Remover"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 p-4 space-y-4 bg-slate-50/80">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Disparo em lote (marketing)
            </h3>
            <p className="text-xs text-gray-500">
              Crie uma fila por campanha e processe em chunks (com pausa entre envios). Cada
              chamada envia até um chunk; repita até o status ficar concluído.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[200px]">
              <label className="block text-xs text-gray-600 mb-1">Campanha</label>
              <select
                value={batchCampaignId === "" ? "" : String(batchCampaignId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setBatchCampaignId(v ? Number(v) : "");
                  setBatchLogsForId(null);
                  setBatchLogs([]);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              >
                <option value="">Selecione…</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Contatos por chunk</label>
              <input
                type="number"
                min={1}
                max={100}
                value={batchChunkSize}
                onChange={(e) => setBatchChunkSize(Number(e.target.value) || 25)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pausa (ms)</label>
              <input
                type="number"
                min={0}
                max={15000}
                value={batchDelayMs}
                onChange={(e) => setBatchDelayMs(Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateCampaignBatch}
              disabled={batchCampaignId === "" || creatingBatch}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingBatch ? "Criando fila…" : "Criar fila"}
            </button>
            <button
              type="button"
              onClick={() => fetchCampaignBatches()}
              disabled={batchCampaignId === "" || loadingBatches}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingBatches ? "Atualizando…" : "Atualizar filas"}
            </button>
          </div>

          {batchCampaignId !== "" ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Planejado</th>
                    <th className="text-left px-3 py-2">Processados</th>
                    <th className="text-left px-3 py-2">Enviados</th>
                    <th className="text-left px-3 py-2">Falhas</th>
                    <th className="text-left px-3 py-2">Pulados</th>
                    <th className="text-left px-3 py-2">Chunk / delay</th>
                    <th className="text-left px-3 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignBatches.length === 0 && !loadingBatches ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-gray-500">
                        Nenhuma fila para esta campanha. Crie uma acima.
                      </td>
                    </tr>
                  ) : null}
                  {campaignBatches.map((b) => (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-xs">{b.id}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "queued"
                                ? "bg-amber-100 text-amber-800"
                                : b.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : b.status === "cancelled"
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-red-100 text-red-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{b.total_planned}</td>
                      <td className="px-3 py-2">{b.processed_count}</td>
                      <td className="px-3 py-2">{b.sent_ok}</td>
                      <td className="px-3 py-2">{b.sent_fail}</td>
                      <td className="px-3 py-2">{b.skipped_count}</td>
                      <td className="px-3 py-2 text-xs">
                        {b.chunk_size} / {b.delay_ms}ms
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => handleProcessBatch(b.id)}
                            disabled={
                              processingBatchId === b.id ||
                              b.status === "completed" ||
                              b.status === "cancelled" ||
                              b.status === "failed"
                            }
                            className="px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-40"
                          >
                            {processingBatchId === b.id ? "Processando…" : "Próximo chunk"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBatch(b.id)}
                            disabled={
                              cancellingBatchId === b.id ||
                              b.status === "completed" ||
                              b.status === "cancelled" ||
                              b.status === "failed"
                            }
                            className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50 disabled:opacity-40"
                          >
                            {cancellingBatchId === b.id ? "…" : "Cancelar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadBatchLogs(b.id)}
                            disabled={loadingBatchLogs}
                            className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50"
                          >
                            Logs
                          </button>
                        </div>
                        {b.error_message ? (
                          <p className="text-[10px] text-red-600 mt-1 max-w-[220px]">
                            {b.error_message}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {batchLogsForId !== null ? (
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-gray-700">
                  Logs do lote #{batchLogsForId}
                </p>
                {loadingBatchLogs ? (
                  <span className="text-xs text-gray-500">Carregando…</span>
                ) : null}
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-1 pr-2">Quando</th>
                      <th className="text-left py-1 pr-2">WhatsApp</th>
                      <th className="text-left py-1 pr-2">Status</th>
                      <th className="text-left py-1">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchLogs.length === 0 && !loadingBatchLogs ? (
                      <tr>
                        <td colSpan={4} className="py-2 text-gray-500">
                          Nenhum registro ainda.
                        </td>
                      </tr>
                    ) : null}
                    {batchLogs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-50">
                        <td className="py-1 pr-2 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-1 pr-2 font-mono">{log.wa_id}</td>
                        <td className="py-1 pr-2">{log.status}</td>
                        <td className="py-1 text-gray-600">
                          {log.error_message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {campaignAudiencePreview ? (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <p className="text-sm text-gray-800">
              Prévia da campanha #{campaignAudiencePreview.campaignId}:{" "}
              <strong>{campaignAudiencePreview.estimatedCount}</strong> contatos.
            </p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {campaignAudiencePreview.sample.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                >
                  <p className="font-medium text-gray-900">
                    {contact.contact_name || "Sem nome"}
                  </p>
                  <p>{contact.wa_id}</p>
                  <p>
                    Lead: {leadContactStatusLabel(contact.contact_status)} • opt-in:{" "}
                    {contact.marketing_opt_in ? "sim" : "não"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        </section>
      ) : null}

      {activeTab === "relatorios" ? (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Relatórios rápidos (próxima fase)
            </h2>
            <p className="text-xs text-gray-500">
              Visão de conversas, contatos e reservas WhatsApp no período.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={fetchReportSummary}
              disabled={loadingReport}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {loadingReport ? "Carregando…" : "Atualizar resumo"}
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Conversas</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.conversations_total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Resolvidas</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.conversations_resolved ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Contatos</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.contacts_total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Opt-in</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.contacts_opt_in ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Reservas WhatsApp</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.reservations_whatsapp ?? 0}
            </p>
          </div>
        </div>
        </section>
      ) : null}
    </div>
  );
}
