"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  MdChat,
  MdClose,
  MdContentCopy,
  MdImage,
  MdLink,
  MdOpenInNew,
  MdRefresh,
  MdSearch,
  MdSend,
  MdSupportAgent,
} from "react-icons/md";
import { getApiUrl } from "@/app/config/api";
import { getPublicSocketUrl } from "@/lib/publicApiUrl";
import { useAppContext } from "@/app/context/AppContext";
import { useUserPermissions } from "@/app/hooks/useUserPermissions";
import EstablishmentTrainingPanel from "@/app/components/admin/EstablishmentTrainingPanel";
import AiConfigPanel from "@/app/components/admin/AiConfigPanel";

const API_URL = getApiUrl();
const SOCKET_URL = getPublicSocketUrl();
/** Distância do fim (px) para considerar que o operador está acompanhando o fim do chat. */
const MESSAGES_SCROLL_BOTTOM_THRESHOLD = 72;
const DEFAULT_ENTRY_LINK_TEMPLATE =
  "Olá! Quero fazer uma reserva no {estabelecimento}. {token}";

/** Filtro da lista de conversas por casa (token #EST_ID no link de entrada). */
type InboxEstablishmentFilter = "all" | "unassigned" | number;

type InboxEstablishmentTheme = {
  tabActive: string;
  tabInactive: string;
  listHover: string;
  listActive: string;
  listActiveBorder: string;
  badge: string;
  statusBadge: string;
  headerBg: string;
  headerBorder: string;
  outboundBubble: string;
};

const INBOX_UNASSIGNED_THEME: InboxEstablishmentTheme = {
  tabActive: "bg-slate-600 text-white shadow-sm",
  tabInactive:
    "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
  listHover: "hover:bg-slate-50/80",
  listActive: "bg-slate-50",
  listActiveBorder: "border-l-slate-500",
  badge: "bg-slate-100 text-slate-700",
  statusBadge: "bg-slate-200 text-slate-800",
  headerBg: "bg-slate-50/90",
  headerBorder: "border-slate-200",
  outboundBubble: "bg-slate-700",
};

const INBOX_ESTABLISHMENT_PALETTES: InboxEstablishmentTheme[] = [
  {
    tabActive: "bg-indigo-600 text-white shadow-sm",
    tabInactive:
      "bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100",
    listHover: "hover:bg-indigo-50/70",
    listActive: "bg-indigo-50",
    listActiveBorder: "border-l-indigo-600",
    badge: "bg-indigo-100 text-indigo-800",
    statusBadge: "bg-indigo-200/80 text-indigo-900",
    headerBg: "bg-indigo-50/80",
    headerBorder: "border-indigo-200",
    outboundBubble: "bg-indigo-600",
  },
  {
    tabActive: "bg-amber-600 text-white shadow-sm",
    tabInactive:
      "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100",
    listHover: "hover:bg-amber-50/70",
    listActive: "bg-amber-50",
    listActiveBorder: "border-l-amber-600",
    badge: "bg-amber-100 text-amber-900",
    statusBadge: "bg-amber-200/80 text-amber-950",
    headerBg: "bg-amber-50/80",
    headerBorder: "border-amber-200",
    outboundBubble: "bg-amber-600",
  },
  {
    tabActive: "bg-emerald-600 text-white shadow-sm",
    tabInactive:
      "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100",
    listHover: "hover:bg-emerald-50/70",
    listActive: "bg-emerald-50",
    listActiveBorder: "border-l-emerald-600",
    badge: "bg-emerald-100 text-emerald-800",
    statusBadge: "bg-emerald-200/80 text-emerald-900",
    headerBg: "bg-emerald-50/80",
    headerBorder: "border-emerald-200",
    outboundBubble: "bg-emerald-600",
  },
  {
    tabActive: "bg-violet-600 text-white shadow-sm",
    tabInactive:
      "bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100",
    listHover: "hover:bg-violet-50/70",
    listActive: "bg-violet-50",
    listActiveBorder: "border-l-violet-600",
    badge: "bg-violet-100 text-violet-800",
    statusBadge: "bg-violet-200/80 text-violet-900",
    headerBg: "bg-violet-50/80",
    headerBorder: "border-violet-200",
    outboundBubble: "bg-violet-600",
  },
  {
    tabActive: "bg-rose-600 text-white shadow-sm",
    tabInactive:
      "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100",
    listHover: "hover:bg-rose-50/70",
    listActive: "bg-rose-50",
    listActiveBorder: "border-l-rose-600",
    badge: "bg-rose-100 text-rose-800",
    statusBadge: "bg-rose-200/80 text-rose-900",
    headerBg: "bg-rose-50/80",
    headerBorder: "border-rose-200",
    outboundBubble: "bg-rose-600",
  },
  {
    tabActive: "bg-cyan-600 text-white shadow-sm",
    tabInactive:
      "bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100",
    listHover: "hover:bg-cyan-50/70",
    listActive: "bg-cyan-50",
    listActiveBorder: "border-l-cyan-600",
    badge: "bg-cyan-100 text-cyan-800",
    statusBadge: "bg-cyan-200/80 text-cyan-900",
    headerBg: "bg-cyan-50/80",
    headerBorder: "border-cyan-200",
    outboundBubble: "bg-cyan-600",
  },
  {
    tabActive: "bg-orange-600 text-white shadow-sm",
    tabInactive:
      "bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100",
    listHover: "hover:bg-orange-50/70",
    listActive: "bg-orange-50",
    listActiveBorder: "border-l-orange-600",
    badge: "bg-orange-100 text-orange-800",
    statusBadge: "bg-orange-200/80 text-orange-900",
    headerBg: "bg-orange-50/80",
    headerBorder: "border-orange-200",
    outboundBubble: "bg-orange-600",
  },
  {
    tabActive: "bg-teal-600 text-white shadow-sm",
    tabInactive:
      "bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100",
    listHover: "hover:bg-teal-50/70",
    listActive: "bg-teal-50",
    listActiveBorder: "border-l-teal-600",
    badge: "bg-teal-100 text-teal-800",
    statusBadge: "bg-teal-200/80 text-teal-900",
    headerBg: "bg-teal-50/80",
    headerBorder: "border-teal-200",
    outboundBubble: "bg-teal-600",
  },
];

/** Cores fixas para IDs conhecidos (HighLine, Justino, etc.). */
const PINNED_INBOX_ESTABLISHMENT_PALETTE: Record<number, number> = {
  7: 0,
  1: 1,
  8: 2,
  9: 3,
};

function getInboxEstablishmentTheme(
  establishmentId: number | null | undefined,
): InboxEstablishmentTheme {
  if (!establishmentId) return INBOX_UNASSIGNED_THEME;
  const pinned = PINNED_INBOX_ESTABLISHMENT_PALETTE[establishmentId];
  const paletteIndex =
    pinned ?? Math.abs(establishmentId) % INBOX_ESTABLISHMENT_PALETTES.length;
  return INBOX_ESTABLISHMENT_PALETTES[paletteIndex] ?? INBOX_ESTABLISHMENT_PALETTES[0];
}

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
  last_message_id?: number | null;
  last_intent?: string | null;
  never_opened_by_me?: boolean;
  has_unread?: boolean;
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
  message_type?: string | null;
  media_url?: string | null;
  media_mime?: string | null;
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
  headline?: string | null;
  message_template: string;
  image_url?: string | null;
  send_mode?: string | null;
  meta_template_name?: string | null;
  meta_template_language?: string | null;
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

type InboxListMeta = {
  limit: number;
  returned: number;
  total: number;
  unassigned: number;
  by_establishment: Record<string, number>;
  truncated: boolean;
};

type WhatsappAdminTab =
  | "treinamento"
  | "config-ia"
  | "atendimento"
  | "links"
  | "crm"
  | "campanhas"
  | "relatorios";

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

function conversationMatchesInboxFilter(
  conversation: ConversationRow,
  filter: InboxEstablishmentFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "unassigned") return !conversation.establishment_id;
  return conversation.establishment_id === filter;
}

function handoffActive(until: string | null | undefined): boolean {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

type InboxRowVisualState =
  | "human_handoff"
  | "unread_inbound"
  | "ai_active"
  | "never_opened"
  | "read";

const CAMPAIGN_INTENTS = new Set(["CAMPAIGN_SEND", "CAMPAIGN_BATCH"]);
const AI_ACTIVE_INTENTS = new Set([
  "AGENT_REPLY",
  "PROCESS_RESERVATION",
  "OPERATIONAL_INFO",
  "GUEST_LIST_LINK",
  "recovery_followup",
]);

function resolveInboxRowVisual(conversation: ConversationRow): InboxRowVisualState {
  if (handoffActive(conversation.human_takeover_until)) return "human_handoff";
  if (conversation.has_unread && conversation.last_direction === "inbound") {
    return "unread_inbound";
  }
  if (conversation.never_opened_by_me) return "never_opened";
  const intent = String(conversation.last_intent || "").trim();
  if (
    conversation.last_direction === "outbound" &&
    (AI_ACTIVE_INTENTS.has(intent) || (!intent && !CAMPAIGN_INTENTS.has(intent)))
  ) {
    return "ai_active";
  }
  return "read";
}

function inboxRowVisualStyles(
  state: InboxRowVisualState,
  active: boolean,
): { row: string; name: string; dot: string; label: string } {
  switch (state) {
    case "human_handoff":
      return {
        row: active ? "bg-amber-100/90 ring-1 ring-amber-200" : "bg-amber-50/90",
        name: "font-semibold text-amber-950",
        dot: "bg-amber-500",
        label: "Aguardando humano",
      };
    case "unread_inbound":
      return {
        row: active ? "bg-sky-100 ring-1 ring-sky-200" : "bg-sky-50",
        name: "font-bold text-sky-950",
        dot: "bg-sky-500",
        label: "Cliente aguardando",
      };
    case "ai_active":
      return {
        row: active ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-emerald-50/70",
        name: "font-medium text-emerald-950",
        dot: "bg-emerald-500",
        label: "IA ativa",
      };
    case "never_opened":
      return {
        row: active ? "bg-violet-50 ring-1 ring-violet-200" : "bg-violet-50/50",
        name: "font-medium text-violet-950",
        dot: "bg-violet-400",
        label: "Não aberta",
      };
    default:
      return {
        row: active ? "bg-white" : "",
        name: "font-medium text-gray-900",
        dot: "bg-transparent",
        label: "",
      };
  }
}

const AVATAR_BG_CLASSES = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function hashWaId(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function contactAvatarInitials(name: string | null, waId: string): string {
  const base = (name || "").trim();
  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }
  const digits = waId.replace(/\D/g, "");
  return digits.slice(-2) || "??";
}

function contactAvatarClass(waId: string): string {
  return AVATAR_BG_CLASSES[hashWaId(waId) % AVATAR_BG_CLASSES.length];
}

function inboxRowSortPriority(state: InboxRowVisualState): number {
  switch (state) {
    case "human_handoff":
      return 0;
    case "unread_inbound":
      return 1;
    case "never_opened":
      return 2;
    case "ai_active":
      return 3;
    default:
      return 4;
  }
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

const SAO_PAULO_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatSaoPauloDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return SAO_PAULO_DATE_TIME_FORMATTER.format(date);
}

function buildEstablishmentToken(establishmentId: number): string {
  return `#EST_${establishmentId}`;
}

function buildEstablishmentLinkText(establishmentName: string, establishmentId: number): string {
  return `Olá! Quero fazer uma reserva no ${establishmentName}. ${buildEstablishmentToken(establishmentId)}`;
}

function renderEntryLinkMessageTemplate(
  template: string,
  establishmentName: string,
  establishmentId: number,
): string {
  const fallback = buildEstablishmentLinkText(establishmentName, establishmentId);
  const safeTemplate = String(template || "").trim();
  if (!safeTemplate) return fallback;
  const token = buildEstablishmentToken(establishmentId);
  return safeTemplate
    .replaceAll("{estabelecimento}", establishmentName)
    .replaceAll("{token}", token);
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
  const searchParams = useSearchParams();
  const { token, establishments } = useAppContext();
  const {
    isLoading: permsLoading,
    canAccessWhatsapp,
    canAccessIaTraining,
    isSuperAdmin,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
    myEstablishmentPermissions,
  } = useUserPermissions();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [inboxListMeta, setInboxListMeta] = useState<InboxListMeta | null>(null);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeBatchLoading, setResumeBatchLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [exportingContacts, setExportingContacts] = useState(false);
  const [importEstablishmentId, setImportEstablishmentId] = useState<number | "">("");
  const [importCsvText, setImportCsvText] = useState("");
  const [importDefaultOptIn, setImportDefaultOptIn] = useState(true);
  const [importSourceTag, setImportSourceTag] = useState("importado");
  const [importingContacts, setImportingContacts] = useState(false);
  const [backfillOptInLoading, setBackfillOptInLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [inboxSearch, setInboxSearch] = useState("");
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
  const [bulkCampaignSending, setBulkCampaignSending] = useState(false);
  const [bulkSendProgress, setBulkSendProgress] = useState<{
    batchId: number;
    processed: number;
    total: number;
    sentOk: number;
    sentFail: number;
    status: string;
  } | null>(null);
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
    headline: string;
    message_template: string;
    image_url: string;
    send_mode: "auto" | "session" | "template";
    meta_template_name: string;
    tags_filter: string;
    status_filter: "" | "new" | "qualified" | "customer" | "inactive";
    only_opt_in: boolean;
  }>({
    establishment_id: "",
    name: "",
    headline: "",
    message_template: "",
    image_url: "",
    send_mode: "auto",
    meta_template_name: "",
    tags_filter: "",
    status_filter: "",
    only_opt_in: true,
  });
  const [uploadingCampaignImage, setUploadingCampaignImage] = useState(false);
  const [manualCentralWhatsappNumber, setManualCentralWhatsappNumber] = useState("");
  const [entryLinkTemplate, setEntryLinkTemplate] = useState(DEFAULT_ENTRY_LINK_TEMPLATE);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WhatsappAdminTab>("treinamento");
  const [inboxEstablishmentFilter, setInboxEstablishmentFilter] =
    useState<InboxEstablishmentFilter>(
      isWhatsappHighlineOnlyUser ? highlineEstablishmentId : "all",
    );

  const adminTabs = useMemo(() => {
    const items: { id: WhatsappAdminTab; label: string }[] = [];
    if (isWhatsappHighlineOnlyUser) {
      if (canAccessWhatsapp) {
        items.push({ id: "atendimento", label: "Conversas HighLine" });
      }
      return items;
    }
    if (canAccessIaTraining) {
      items.push({ id: "treinamento", label: "Treinamento IA" });
      items.push({ id: "config-ia", label: "Configurações de IA" });
    }
    if (canAccessWhatsapp) {
      items.push(
        { id: "atendimento", label: "Atendimento" },
        { id: "crm", label: "CRM de contatos" },
        { id: "campanhas", label: "Campanhas" },
        { id: "links", label: "Links de entrada" },
        { id: "relatorios", label: "Relatórios" },
      );
    }
    return items;
  }, [
    canAccessIaTraining,
    canAccessWhatsapp,
    isWhatsappHighlineOnlyUser,
  ]);

  const showWhatsappArea =
    canAccessWhatsapp && activeTab !== "treinamento" && activeTab !== "config-ia";
  const showWhatsappInbox = canAccessWhatsapp && activeTab === "atendimento";

  const selectTab = useCallback(
    (tab: WhatsappAdminTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "treinamento") {
        params.set("tab", "treinamento");
      } else {
        params.delete("tab");
      }
      const query = params.toString();
      router.replace(query ? `/admin/whatsapp?${query}` : "/admin/whatsapp", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const tabInitializedRef = useRef(false);

  useEffect(() => {
    if (permsLoading) return;
    if (isWhatsappHighlineOnlyUser) {
      setActiveTab("atendimento");
      setInboxEstablishmentFilter(highlineEstablishmentId);
      return;
    }
    const tabParam = searchParams.get("tab");
    if (tabParam === "treinamento" && canAccessIaTraining) {
      setActiveTab("treinamento");
      return;
    }
    if (tabInitializedRef.current) return;
    tabInitializedRef.current = true;
    if (canAccessWhatsapp) {
      setActiveTab("atendimento");
    } else if (canAccessIaTraining) {
      setActiveTab("treinamento");
    }
  }, [
    permsLoading,
    searchParams,
    canAccessIaTraining,
    canAccessWhatsapp,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isPinnedToBottomRef = useRef(true);
  const draftDirtyRef = useRef(false);
  const bulkSendAbortRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = messagesContainerRef.current;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior });
      isPinnedToBottomRef.current = true;
      setShowJumpToLatest(false);
    },
    [],
  );

  const updateScrollPinState = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const pinned = distanceFromBottom <= MESSAGES_SCROLL_BOTTOM_THRESHOLD;
    isPinnedToBottomRef.current = pinned;
    setShowJumpToLatest(!pinned);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("admin_whatsapp_central_number_manual");
    if (saved?.trim()) {
      setManualCentralWhatsappNumber(saved.trim());
    }
    const savedTemplate = window.localStorage.getItem("admin_whatsapp_entry_link_template");
    if (savedTemplate?.trim()) {
      setEntryLinkTemplate(savedTemplate);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = entryLinkTemplate.trim();
    if (!value) {
      window.localStorage.setItem(
        "admin_whatsapp_entry_link_template",
        DEFAULT_ENTRY_LINK_TEMPLATE,
      );
      return;
    }
    window.localStorage.setItem("admin_whatsapp_entry_link_template", value);
  }, [entryLinkTemplate]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchConversations = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoadingList(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (inboxEstablishmentFilter === "unassigned") {
        params.set("establishment_id", "unassigned");
      } else if (inboxEstablishmentFilter !== "all") {
        params.set("establishment_id", String(inboxEstablishmentFilter));
      }
      const query = params.toString();
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations${query ? `?${query}` : ""}`,
        {
          headers: authHeaders,
        },
      );
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
      setInboxListMeta(data.meta || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar conversas");
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [authHeaders, inboxEstablishmentFilter]);

  const fetchMessages = useCallback(
    async (waId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) setLoadingThread(true);
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
        const lastMsg = list.length > 0 ? list[list.length - 1] : null;
        await fetch(
          `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(waId)}/mark-read`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(
              lastMsg?.id ? { last_message_id: lastMsg.id } : {},
            ),
          },
        ).catch(() => {});
        setConversations((prev) =>
          prev.map((c) =>
            c.wa_id === waId
              ? {
                  ...c,
                  has_unread: false,
                  never_opened_by_me: false,
                  last_message_id: lastMsg?.id ?? c.last_message_id,
                }
              : c,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar mensagens");
      } finally {
        if (!silent) setLoadingThread(false);
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
    isPinnedToBottomRef.current = true;
    setShowJumpToLatest(false);
  }, [selectedWaId]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;
    if (isPinnedToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      setShowJumpToLatest(false);
    }
  }, [messages, selectedWaId]);

  useEffect(() => {
    if (!token || !canAccessWhatsapp) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 12,
    });
    socket.on("connect", () => {
      socket.emit("join_whatsapp_inbox");
    });

    const onUpdate = () => {
      fetchConversations({ silent: true });
      if (selectedWaId) {
        fetchMessages(selectedWaId, { silent: true });
      }
    };

    socket.on("whatsapp_inbox_update", onUpdate);

    const interval = window.setInterval(() => {
      fetchConversations({ silent: true });
      if (selectedWaId) fetchMessages(selectedWaId, { silent: true });
    }, 4000);

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
          body: JSON.stringify({ until_resume: true }),
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
      if (data.pending_delivery) {
        setSuccessMessage(
          "A Meta oscilou, mas a mensagem entrou em tentativa automática de envio.",
        );
      }
      draftDirtyRef.current = false;
      setComposeText("");
      isPinnedToBottomRef.current = true;
      await fetchMessages(selectedWaId);
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!selectedWaId || !token || !file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const caption = composeText.trim();
      if (caption) form.append("caption", caption);
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/${encodeURIComponent(selectedWaId)}/send-image`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      draftDirtyRef.current = false;
      setComposeText("");
      isPinnedToBottomRef.current = true;
      await fetchMessages(selectedWaId);
      await fetchConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar imagem");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleResumeUnassignedAI = async () => {
    if (!token) return;
    setResumeBatchLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/conversations/resume-ai-unassigned`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      const count = Number(data.resumed_count || 0);
      setSuccessMessage(
        count > 0
          ? `IA retomada em ${count} conversa${count === 1 ? "" : "s"} sem atendente.`
          : "Nenhuma conversa sem atendente precisava ser retomada.",
      );
      await fetchConversations();
      if (selectedWaId) await fetchMessages(selectedWaId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao retomar IA em massa");
    } finally {
      setResumeBatchLoading(false);
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

  const handleBackfillOptIn = async () => {
    if (!token) return;
    setBackfillOptInLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const body: Record<string, unknown> = {};
      if (contactEstablishmentId !== "") {
        body.establishment_id = contactEstablishmentId;
      }
      const res = await fetch(`${API_URL}/api/admin/whatsapp/contacts/backfill-opt-in`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchContacts();
      setSuccessMessage(
        typeof data.message === "string"
          ? data.message
          : `${data.updated ?? 0} contato(s) com opt-in concedido.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao conceder opt-in em massa");
    } finally {
      setBackfillOptInLoading(false);
    }
  };

  const handleImportContacts = async () => {
    if (!token) return;
    const estId = importEstablishmentId !== "" ? importEstablishmentId : contactEstablishmentId;
    if (estId === "") {
      setError("Selecione o estabelecimento da base importada.");
      return;
    }
    if (!importCsvText.trim()) {
      setError("Cole o CSV ou carregue um arquivo com os contatos.");
      return;
    }
    setImportingContacts(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/contacts/import`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          establishment_id: estId,
          csv_text: importCsvText,
          default_marketing_opt_in: importDefaultOptIn,
          source_tag: importSourceTag.trim() || "importado",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchContacts();
      setImportCsvText("");
      const imported = Number(data.imported ?? 0);
      const updated = Number(data.updated ?? 0);
      const skipped = Number(data.skipped ?? 0);
      const errorDetails = Array.isArray(data.errors)
        ? data.errors
            .slice(0, 5)
            .map((item: { line?: number; reason?: string }) =>
              `Linha ${item.line ?? "?"}: ${item.reason ?? "erro desconhecido"}`,
            )
            .join(" · ")
        : "";
      const baseMessage =
        typeof data.message === "string"
          ? data.message
          : `Importação: ${imported} novo(s), ${updated} atualizado(s), ${skipped} ignorado(s).`;
      if (imported + updated === 0 && skipped > 0) {
        setError(
          `${baseMessage}${errorDetails ? ` Detalhes: ${errorDetails}` : " Verifique se o telefone está na primeira coluna ou use o cabeçalho telefone,nome,email."}`,
        );
        return;
      }
      setSuccessMessage(
        errorDetails && skipped > 0 ? `${baseMessage} Avisos: ${errorDetails}` : baseMessage,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao importar contatos");
    } finally {
      setImportingContacts(false);
    }
  };

  const handleImportFileChange = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setImportCsvText(text);
      setSuccessMessage(`Arquivo "${file.name}" carregado. Revise e clique em Importar.`);
    } catch {
      setError("Não foi possível ler o arquivo CSV.");
    }
  };

  const handleDownloadImportTemplate = () => {
    const template = [
      "telefone,nome,email,marketing_opt_in,tags",
      "5511999999999,Maria Silva,maria@email.com,true,vip",
      "5511888888888,João Santos,joao@email.com,true,planilha-junho",
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-importacao-contatos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMessage("Modelo CSV baixado. Preencha e use Carregar CSV ou cole na caixa de texto.");
  };

  const persistContactDraft = useCallback(
    async (contactId: number, options?: { showSuccess?: boolean }) => {
      if (!token) return false;
      const draft = contactDrafts[contactId];
      if (!draft) return false;
      setSavingContactIds((prev) => [...prev, contactId]);
      setError(null);
      if (options?.showSuccess) setSuccessMessage(null);
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
        if (options?.showSuccess) {
          setSuccessMessage("Contato salvo com sucesso.");
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao salvar contato");
        return false;
      } finally {
        setSavingContactIds((prev) => prev.filter((id) => id !== contactId));
      }
    },
    [authHeaders, contactDrafts, fetchContacts, token],
  );

  const handleSaveContact = async (contactId: number) => {
    await persistContactDraft(contactId, { showSuccess: true });
  };

  const handleCreateCampaign = async () => {
    if (!token) return;
    if (!campaignForm.establishment_id || !campaignForm.name.trim()) {
      setError("Preencha estabelecimento e nome da campanha.");
      return;
    }
    if (!campaignForm.message_template.trim() && !campaignForm.image_url.trim()) {
      setError("Informe o texto da campanha e/ou envie uma imagem.");
      return;
    }
    setSavingCampaign(true);
    setError(null);
    setSuccessMessage(null);
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
          headline: campaignForm.headline.trim() || campaignForm.name.trim(),
          message_template: campaignForm.message_template.trim(),
          image_url: campaignForm.image_url.trim() || null,
          send_mode: campaignForm.send_mode,
          meta_template_name: campaignForm.meta_template_name.trim() || null,
          target_filters,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaignForm((prev) => ({
        ...prev,
        name: "",
        headline: "",
        message_template: "",
        image_url: "",
        tags_filter: "",
        status_filter: "",
      }));
      await fetchCampaigns();
      setSuccessMessage("Campanha salva com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar campanha");
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleUploadCampaignImage = async (file: File | null) => {
    if (!token || !file) return;
    setUploadingCampaignImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/upload-image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setCampaignForm((prev) => ({
        ...prev,
        image_url: String(data.image_url || ""),
      }));
      setSuccessMessage("Imagem da campanha carregada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar imagem");
    } finally {
      setUploadingCampaignImage(false);
    }
  };

  const handleToggleCampaignActive = async (campaign: CampaignRow) => {
    if (!token) return;
    setSavingCampaign(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_active: !campaign.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaigns();
      setSuccessMessage(
        campaign.is_active ? "Campanha desativada." : "Campanha ativada.",
      );
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
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaigns();
      setSuccessMessage("Campanha removida com sucesso.");
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
    const draft = contactDrafts[contactId];
    if (draft && !draft.marketing_opt_in) {
      setError("Envio bloqueado: este contato está sem opt-in de marketing.");
      return;
    }
    const saved = await persistContactDraft(contactId);
    if (!saved) {
      setError("Não foi possível salvar o contato antes do envio da campanha.");
      return;
    }
    const contact = contacts.find((item) => item.id === contactId);
    const sendQuery = new URLSearchParams({ contact_id: String(contactId) });
    if (contact?.wa_id) {
      sendQuery.set("wa_id", contact.wa_id);
    }
    setSendCampaignLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${selectedCampaignForSend}/send-to-contact?${sendQuery.toString()}`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            contact_id: contactId,
            wa_id: contact?.wa_id || null,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchConversations();
      await fetchContacts();
      setSuccessMessage("Campanha enviada para o contato.");
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
    setSuccessMessage(null);
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
      setSuccessMessage("Fila de disparo criada.");
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
    setSuccessMessage(null);
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
      setSuccessMessage("Chunk processado com sucesso.");
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
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/whatsapp/campaign-batches/${batchId}/cancel`,
        { method: "POST", headers: authHeaders },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      await fetchCampaignBatches();
      setSuccessMessage("Fila cancelada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar lote");
    } finally {
      setCancellingBatchId(null);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleBulkSendCampaignFromCrm = async () => {
    if (!token) return;
    if (selectedCampaignForSend === "") {
      setError("Selecione uma campanha para envio em massa.");
      return;
    }

    const campaignId = selectedCampaignForSend;
    const campaign = campaigns.find((item) => item.id === campaignId);

    setError(null);
    setSuccessMessage(null);

    let estimatedCount = 0;
    try {
      const previewRes = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${campaignId}/audience-preview`,
        { headers: authHeaders },
      );
      const previewData = await previewRes.json().catch(() => ({}));
      if (!previewRes.ok) {
        throw new Error(previewData.message || `Erro ${previewRes.status}`);
      }
      estimatedCount = Number(previewData.estimated_count || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao estimar público da campanha");
      return;
    }

    if (estimatedCount === 0) {
      setError("Nenhum contato elegível para esta campanha (verifique filtros e opt-in).");
      return;
    }

    const campaignName = campaign?.name || `#${campaignId}`;
    const confirmed = window.confirm(
      `Enviar a campanha "${campaignName}" para aproximadamente ${estimatedCount} contatos?\n\nO envio usa os filtros configurados na campanha (não apenas a lista filtrada do CRM). Respeita opt-in e pausas entre mensagens.`,
    );
    if (!confirmed) return;

    bulkSendAbortRef.current = false;
    setBulkCampaignSending(true);
    setBulkSendProgress(null);
    setBatchCampaignId(campaignId);

    let lastBatch: CampaignBatchRow | null = null;

    try {
      const createRes = await fetch(
        `${API_URL}/api/admin/whatsapp/campaigns/${campaignId}/batches`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            chunk_size: batchChunkSize,
            delay_ms: batchDelayMs,
          }),
        },
      );
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(createData.message || `Erro ${createRes.status}`);

      const batchId = Number(createData.batch?.id);
      if (!Number.isFinite(batchId) || batchId <= 0) {
        throw new Error("Resposta inválida ao criar fila de disparo");
      }

      lastBatch = createData.batch as CampaignBatchRow;
      setBulkSendProgress({
        batchId,
        processed: lastBatch.processed_count || 0,
        total: lastBatch.total_planned || estimatedCount,
        sentOk: lastBatch.sent_ok || 0,
        sentFail: lastBatch.sent_fail || 0,
        status: lastBatch.status || "queued",
      });

      while (!bulkSendAbortRef.current) {
        const processRes = await fetch(
          `${API_URL}/api/admin/whatsapp/campaign-batches/${batchId}/process`,
          { method: "POST", headers: authHeaders },
        );
        const processData = await processRes.json().catch(() => ({}));

        if (processRes.status === 409) {
          await sleep(1500);
          continue;
        }
        if (!processRes.ok) {
          throw new Error(processData.message || `Erro ${processRes.status}`);
        }

        lastBatch = processData.batch as CampaignBatchRow;
        setBulkSendProgress({
          batchId,
          processed: lastBatch.processed_count || 0,
          total: lastBatch.total_planned || estimatedCount,
          sentOk: lastBatch.sent_ok || 0,
          sentFail: lastBatch.sent_fail || 0,
          status: lastBatch.status || "queued",
        });

        if (processData.last_chunk?.done || lastBatch.status === "completed") {
          break;
        }
        if (lastBatch.status === "cancelled" || lastBatch.status === "failed") {
          throw new Error(lastBatch.error_message || "Disparo interrompido");
        }

        await sleep(400);
      }

      if (bulkSendAbortRef.current) {
        setSuccessMessage("Disparo em massa cancelado.");
      } else if (lastBatch) {
        setSuccessMessage(
          `Campanha enviada em massa: ${lastBatch.sent_ok ?? 0} ok, ${lastBatch.sent_fail ?? 0} falhas.`,
        );
      }

      await fetchCampaignBatches();
      await fetchConversations();
    } catch (e) {
      if (!bulkSendAbortRef.current) {
        setError(e instanceof Error ? e.message : "Falha no envio em massa");
      }
    } finally {
      setBulkCampaignSending(false);
      bulkSendAbortRef.current = false;
    }
  };

  const handleCancelBulkCampaignSend = async () => {
    bulkSendAbortRef.current = true;
    const batchId = bulkSendProgress?.batchId;
    if (batchId) {
      await handleCancelBatch(batchId);
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
    if (isWhatsappHighlineOnlyUser) {
      const fromPerms = myEstablishmentPermissions
        .filter((p) => p.can_manage_reservations)
        .map((p) => ({
          id: Number(p.establishment_id),
          name: p.establishment_name || "HighLine",
        }))
        .filter((e) => Number.isFinite(e.id) && e.id > 0);
      if (fromPerms.length > 0) {
        return fromPerms.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      }
      const fromCatalog = establishments.find(
        (e) => Number(e.id) === highlineEstablishmentId,
      );
      return [
        {
          id: highlineEstablishmentId,
          name: fromCatalog?.name || "HighLine",
        },
      ];
    }

    if (isSuperAdmin) {
      return establishments
        .map((e) => ({ id: Number(e.id), name: e.name }))
        .filter((e) => Number.isFinite(e.id) && e.id > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    const map = new Map<number, string>();
    for (const p of myEstablishmentPermissions) {
      if (p.is_active === false) continue;
      const id = Number(p.establishment_id);
      if (!Number.isFinite(id) || id <= 0) continue;
      map.set(id, p.establishment_name || `Estabelecimento ${id}`);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [
    establishments,
    isSuperAdmin,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
    myEstablishmentPermissions,
  ]);

  const inboxEstablishmentTabs = useMemo(() => {
    const highlineName =
      establishmentFilterOptions.find((o) => o.id === highlineEstablishmentId)
        ?.name || "HighLine";

    if (isWhatsappHighlineOnlyUser) {
      const highlineCount =
        inboxListMeta?.by_establishment?.[String(highlineEstablishmentId)] ??
        conversations.filter((c) => c.establishment_id === highlineEstablishmentId).length;
      return [
        {
          key: highlineEstablishmentId as InboxEstablishmentFilter,
          label: highlineName,
          count: highlineCount,
          theme: getInboxEstablishmentTheme(highlineEstablishmentId),
        },
      ];
    }

    const byId = new Map<number, string>();
    for (const opt of establishmentFilterOptions) {
      byId.set(opt.id, opt.name);
    }
    for (const conv of conversations) {
      const id = conv.establishment_id;
      if (!id || byId.has(id)) continue;
      byId.set(id, conv.establishment_name || `Estabelecimento ${id}`);
    }

    const tabs: {
      key: InboxEstablishmentFilter;
      label: string;
      count: number;
      theme: InboxEstablishmentTheme;
    }[] = [
      {
        key: "all",
        label: "Todos",
        count: inboxListMeta?.total ?? conversations.length,
        theme: INBOX_UNASSIGNED_THEME,
      },
    ];

    for (const [id, name] of Array.from(byId.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "pt-BR"),
    )) {
      tabs.push({
        key: id,
        label: name,
        count:
          inboxListMeta?.by_establishment?.[String(id)] ??
          conversations.filter((c) => c.establishment_id === id).length,
        theme: getInboxEstablishmentTheme(id),
      });
    }

    const unassignedCount =
      inboxListMeta?.unassigned ??
      conversations.filter((c) => !c.establishment_id).length;
    if (unassignedCount > 0) {
      tabs.push({
        key: "unassigned",
        label: "Sem casa",
        count: unassignedCount,
        theme: INBOX_UNASSIGNED_THEME,
      });
    }

    return tabs;
  }, [
    conversations,
    establishmentFilterOptions,
    inboxListMeta,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
  ]);

  const filteredInboxConversations = useMemo(() => {
    const allowedIds = new Set(establishmentFilterOptions.map((opt) => opt.id));
    let scoped = conversations;
    if (isWhatsappHighlineOnlyUser) {
      scoped = conversations.filter(
        (c) => c.establishment_id === highlineEstablishmentId,
      );
    } else if (!isSuperAdmin && allowedIds.size > 0) {
      scoped = conversations.filter(
        (c) => c.establishment_id != null && allowedIds.has(c.establishment_id),
      );
    }
    return scoped.filter((c) =>
      conversationMatchesInboxFilter(c, inboxEstablishmentFilter),
    );
  }, [
    conversations,
    inboxEstablishmentFilter,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
    isSuperAdmin,
    establishmentFilterOptions,
  ]);

  const visibleInboxConversations = useMemo(() => {
    const query = inboxSearch.trim();
    let rows = filteredInboxConversations;
    if (query) {
      const norm = (value: string | null | undefined) =>
        (value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const nq = norm(query);
      const digitsQuery = query.replace(/\D/g, "");
      rows = filteredInboxConversations.filter((c) => {
        if (norm(c.contact_name).includes(nq)) return true;
        if (norm(c.last_body).includes(nq)) return true;
        if (digitsQuery && (c.wa_id || "").includes(digitsQuery)) return true;
        return false;
      });
    }
    return [...rows].sort((a, b) => {
      const pa = inboxRowSortPriority(resolveInboxRowVisual(a));
      const pb = inboxRowSortPriority(resolveInboxRowVisual(b));
      if (pa !== pb) return pa - pb;
      const ta = new Date(a.last_message_at || a.updated_at).getTime();
      const tb = new Date(b.last_message_at || b.updated_at).getTime();
      return tb - ta;
    });
  }, [filteredInboxConversations, inboxSearch]);

  const activeInboxEstablishmentTheme = useMemo(() => {
    if (inboxEstablishmentFilter === "all") {
      const estId =
        selectedConv?.establishment_id ?? conversationMeta?.establishment_id ?? null;
      return getInboxEstablishmentTheme(estId);
    }
    if (inboxEstablishmentFilter === "unassigned") {
      return INBOX_UNASSIGNED_THEME;
    }
    return getInboxEstablishmentTheme(inboxEstablishmentFilter);
  }, [
    inboxEstablishmentFilter,
    selectedConv?.establishment_id,
    conversationMeta?.establishment_id,
  ]);

  const centralWhatsappDigits = useMemo(
    () => digitsOnly(effectiveCentralWhatsappNumber),
    [effectiveCentralWhatsappNumber],
  );
  const hasCentralWhatsappDigits = centralWhatsappDigits.length >= 10;
  const handoffConversationsCount = useMemo(() => {
    const allowedIds = new Set(establishmentFilterOptions.map((opt) => opt.id));
    const source = isWhatsappHighlineOnlyUser
      ? conversations.filter(
          (conv) => conv.establishment_id === highlineEstablishmentId,
        )
      : !isSuperAdmin && allowedIds.size > 0
        ? conversations.filter(
            (c) => c.establishment_id != null && allowedIds.has(c.establishment_id),
          )
        : conversations;
    return source.filter((conv) => handoffActive(conv.human_takeover_until)).length;
  }, [
    conversations,
    isWhatsappHighlineOnlyUser,
    highlineEstablishmentId,
    isSuperAdmin,
    establishmentFilterOptions,
  ]);

  const scopedContacts = useMemo(() => {
    if (isSuperAdmin) return contacts;
    const allowedIds = new Set(establishmentFilterOptions.map((opt) => opt.id));
    if (allowedIds.size === 0) return contacts;
    return contacts.filter(
      (c) =>
        c.last_establishment_id != null &&
        allowedIds.has(Number(c.last_establishment_id)),
    );
  }, [contacts, isSuperAdmin, establishmentFilterOptions]);

  const scopedCampaigns = useMemo(() => {
    if (isSuperAdmin) return campaigns;
    const allowedIds = new Set(establishmentFilterOptions.map((opt) => opt.id));
    if (allowedIds.size === 0) return campaigns;
    return campaigns.filter((c) => allowedIds.has(Number(c.establishment_id)));
  }, [campaigns, isSuperAdmin, establishmentFilterOptions]);

  const scopedConversationsCount = useMemo(() => {
    if (isWhatsappHighlineOnlyUser) return filteredInboxConversations.length;
    if (isSuperAdmin) return conversations.length;
    const allowedIds = new Set(establishmentFilterOptions.map((opt) => opt.id));
    if (allowedIds.size === 0) return conversations.length;
    return conversations.filter(
      (c) => c.establishment_id != null && allowedIds.has(c.establishment_id),
    ).length;
  }, [
    conversations,
    filteredInboxConversations.length,
    isWhatsappHighlineOnlyUser,
    isSuperAdmin,
    establishmentFilterOptions,
  ]);

  const activeCampaignsCount = useMemo(
    () => scopedCampaigns.filter((campaign) => campaign.is_active).length,
    [scopedCampaigns],
  );
  const crmContactGroups = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; contactCount: number; contacts: ContactRow[] }
    >();
    for (const contact of contacts) {
      const id = contact.last_establishment_id || "sem_estabelecimento";
      const key = String(id);
      const label = contact.last_establishment_name || "Sem estabelecimento";
      const current = groups.get(key);
      if (!current) {
        groups.set(key, { key, label, contactCount: 1, contacts: [contact] });
      } else {
        current.contactCount += 1;
        current.contacts.push(contact);
      }
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (b.contactCount !== a.contactCount) return b.contactCount - a.contactCount;
      return a.label.localeCompare(b.label, "pt-BR");
    });
  }, [contacts]);
  const reportDerived = useMemo(() => {
    const conversations = reportSummary?.conversations_total ?? 0;
    const resolved = reportSummary?.conversations_resolved ?? 0;
    const contactsTotal = reportSummary?.contacts_total ?? 0;
    const contactsOptIn = reportSummary?.contacts_opt_in ?? 0;
    const reservationsWhatsapp = reportSummary?.reservations_whatsapp ?? 0;
    const resolutionRate = conversations > 0 ? (resolved / conversations) * 100 : 0;
    const optInRate = contactsTotal > 0 ? (contactsOptIn / contactsTotal) * 100 : 0;
    const reservationConversion =
      contactsTotal > 0 ? (reservationsWhatsapp / contactsTotal) * 100 : 0;
    return {
      resolutionRate,
      optInRate,
      reservationConversion,
    };
  }, [reportSummary]);
  const establishmentEntryLinks = useMemo(
    () =>
      establishmentFilterOptions.map((opt) => {
        const token = buildEstablishmentToken(opt.id);
        const text = renderEntryLinkMessageTemplate(entryLinkTemplate, opt.name, opt.id);
        const link = buildWhatsAppEntryLink(centralWhatsappDigits, text);
        return {
          id: opt.id,
          name: opt.name,
          token,
          text,
          link,
        };
      }),
    [centralWhatsappDigits, establishmentFilterOptions, entryLinkTemplate],
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

  useEffect(() => {
    if (permsLoading || isSuperAdmin || isWhatsappHighlineOnlyUser) return;
    if (establishmentFilterOptions.length !== 1) return;
    const onlyId = establishmentFilterOptions[0].id;
    setInboxEstablishmentFilter(onlyId);
    setContactEstablishmentId((prev) => (prev === "" ? onlyId : prev));
  }, [
    permsLoading,
    isSuperAdmin,
    isWhatsappHighlineOnlyUser,
    establishmentFilterOptions,
  ]);

  useEffect(() => {
    if (!selectedWaId || inboxEstablishmentFilter === "all") return;
    const conv = conversations.find((c) => c.wa_id === selectedWaId);
    if (!conv) return;
    if (!conversationMatchesInboxFilter(conv, inboxEstablishmentFilter)) {
      setSelectedWaId(null);
    }
  }, [inboxEstablishmentFilter, conversations, selectedWaId]);

  if (permsLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        Carregando…
      </div>
    );
  }

  if (!canAccessWhatsapp && !canAccessIaTraining) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600 p-6 text-center">
        Você não tem permissão para acessar o Atendimento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)]">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4 md:px-5 ${
          isWhatsappHighlineOnlyUser
            ? "border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/40"
            : "border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <MdChat
            className={`text-2xl ${
              isWhatsappHighlineOnlyUser ? "text-indigo-600" : "text-amber-600"
            }`}
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isWhatsappHighlineOnlyUser
                ? "Atendimento HighLine"
                : "Atendimento"}
            </h1>
            <p className="text-sm text-gray-600">
              {isWhatsappHighlineOnlyUser
                ? "Conversas do WhatsApp vinculadas ao HighLine (#EST_7). Demais estabelecimentos não aparecem aqui."
                : activeTab === "treinamento"
                  ? "Treine a IA com as regras e o comportamento de cada casa."
                  : "WhatsApp em tempo real, CRM, campanhas e treinamento da IA."}
            </p>
          </div>
        </div>
        {showWhatsappInbox ? (
          <div className="flex flex-wrap items-center gap-2">
            {handoffConversationsCount > 0 ? (
              <button
                type="button"
                onClick={handleResumeUnassignedAI}
                disabled={resumeBatchLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <MdSupportAgent />
                {resumeBatchLoading ? "Retomando…" : "Retomar IA sem atendente"}
              </button>
            ) : null}
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
        ) : null}
      </div>

      {adminTabs.length > 1 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3 bg-gray-50/70">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`rounded-full px-3.5 py-2 text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "treinamento" ? <EstablishmentTrainingPanel /> : null}

      {activeTab === "config-ia" ? <AiConfigPanel /> : null}

      {showWhatsappArea ? (
      <>
      <div
        className={`grid gap-3 ${
          isWhatsappHighlineOnlyUser
            ? "grid-cols-2"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-500">
            {isWhatsappHighlineOnlyUser
              ? "Conversas HighLine"
              : "Conversas ativas"}
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {isWhatsappHighlineOnlyUser
              ? filteredInboxConversations.length
              : scopedConversationsCount}
          </p>
        </div>
        <div
          className={`rounded-xl border px-4 py-3 shadow-sm ${
            isWhatsappHighlineOnlyUser
              ? "border-indigo-200 bg-indigo-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p
            className={`text-xs ${
              isWhatsappHighlineOnlyUser ? "text-indigo-700" : "text-amber-700"
            }`}
          >
            Handoff humano
          </p>
          <p
            className={`text-2xl font-semibold ${
              isWhatsappHighlineOnlyUser ? "text-indigo-900" : "text-amber-900"
            }`}
          >
            {handoffConversationsCount}
          </p>
        </div>
        {!isWhatsappHighlineOnlyUser ? (
          <>
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white px-4 py-3 shadow-sm">
              <p className="text-xs text-indigo-700">Contatos CRM</p>
              <p className="text-2xl font-semibold text-indigo-900">{scopedContacts.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-3 shadow-sm">
              <p className="text-xs text-emerald-700">Campanhas ativas</p>
              <p className="text-2xl font-semibold text-emerald-900">
                {activeCampaignsCount}
              </p>
            </div>
          </>
        ) : null}
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
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          {successMessage}
        </div>
      )}

      {activeTab === "atendimento" ? (
      <div className="flex h-[calc(100vh-15rem)] min-h-[560px] max-h-[860px] gap-4 flex-col lg:flex-row border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <aside className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col h-[42vh] min-h-[280px] lg:h-full">
          <div className="px-3 py-2 border-b border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Conversas por estabelecimento
            </p>
            <p className="text-[11px] text-gray-500 leading-snug">
              Clientes que entram pelo link com{" "}
              <code className="text-[10px] bg-gray-100 px-1 rounded">#EST_ID</code>{" "}
              aparecem na aba da casa correspondente.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {inboxEstablishmentTabs.map((tab) => {
                const isActive = inboxEstablishmentFilter === tab.key;
                return (
                  <button
                    key={String(tab.key)}
                    type="button"
                    onClick={() => setInboxEstablishmentFilter(tab.key)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      isActive ? tab.theme.tabActive : tab.theme.tabInactive
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1 tabular-nums ${isActive ? "opacity-90" : "opacity-70"}`}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <MdSearch
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Buscar por nome, número ou conversa"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-8 text-sm text-gray-800 placeholder:text-gray-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              {inboxSearch && (
                <button
                  type="button"
                  onClick={() => setInboxSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Limpar busca"
                >
                  <MdClose size={15} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {loadingList
                ? "Carregando…"
                : inboxSearch.trim()
                  ? `${visibleInboxConversations.length} resultado(s) para “${inboxSearch.trim()}”`
                  : `${filteredInboxConversations.length} nesta aba${
                      inboxListMeta?.truncated
                        ? ` (mostrando ${inboxListMeta.returned} mais recentes de ${inboxListMeta.total})`
                        : inboxListMeta?.total != null
                          ? ` de ${inboxListMeta.total} no total`
                          : ""
                    }`}
            </p>
          </div>
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">
              Legenda
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Cliente aguardando
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Humano
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                IA ativa
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Não aberta
              </span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 && !loadingList && (
              <p className="p-4 text-sm text-gray-500">
                Nenhuma conversa ainda. Envie uma mensagem para o número
                conectado à API ou rode a migration no banco.
              </p>
            )}
            {conversations.length > 0 &&
              visibleInboxConversations.length === 0 &&
              !loadingList &&
              (inboxSearch.trim() ? (
                <p className="p-4 text-sm text-gray-500">
                  Nenhuma conversa encontrada para “{inboxSearch.trim()}”. Tente
                  outro nome, número ou trecho da conversa.
                </p>
              ) : (
                <p className="p-4 text-sm text-gray-500">
                  Nenhuma conversa nesta aba. Troque o estabelecimento ou aguarde
                  novos contatos pelo link da casa.
                </p>
              ))}
            {visibleInboxConversations.map((c) => {
              const active = c.wa_id === selectedWaId;
              const ho = handoffActive(c.human_takeover_until);
              const theme = getInboxEstablishmentTheme(c.establishment_id);
              const visual = resolveInboxRowVisual(c);
              const visualStyles = inboxRowVisualStyles(visual, active);
              const avatarInitials = contactAvatarInitials(c.contact_name, c.wa_id);
              return (
                <button
                  key={c.wa_id}
                  type="button"
                  onClick={() => setSelectedWaId(c.wa_id)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-50/80 transition-colors ${visualStyles.row || theme.listHover} ${
                    active && !visualStyles.row
                      ? `${theme.listActive} border-l-4 ${theme.listActiveBorder}`
                      : active
                        ? "border-l-4 border-l-gray-400"
                        : ""
                  } ${!active && !visualStyles.row ? theme.listHover : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ${contactAvatarClass(c.wa_id)}`}
                      title="Foto de perfil não disponível via WhatsApp — exibindo iniciais"
                    >
                      {avatarInitials}
                      {visualStyles.dot !== "bg-transparent" ? (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${visualStyles.dot}`}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${visualStyles.name}`}>
                          {c.contact_name || c.wa_id}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {visualStyles.label ? (
                            <span className="text-[9px] font-medium text-gray-500 hidden sm:inline">
                              {visualStyles.label}
                            </span>
                          ) : null}
                          {ho && (
                            <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Humano
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          visual === "unread_inbound" ? "text-gray-700 font-medium" : "text-gray-500"
                        }`}
                      >
                        {c.last_direction === "inbound" ? "← " : c.last_direction === "outbound" ? "→ " : ""}
                        {c.last_body || "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span
                          className={`text-[10px] rounded font-medium px-1.5 py-0.5 ${theme.badge}`}
                        >
                          {c.establishment_name || "Sem estabelecimento"}
                        </span>
                        <span
                          className={`text-[10px] rounded px-1.5 py-0.5 ${theme.statusBadge}`}
                        >
                          {c.status || "new"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-h-0 h-full">
          {!selectedWaId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8">
              Selecione uma conversa à esquerda.
            </div>
          ) : (
            <>
              <header
                className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${activeInboxEstablishmentTheme.headerBg} ${activeInboxEstablishmentTheme.headerBorder}`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-900">
                      {conversationMeta?.contact_name ||
                        selectedConv?.contact_name ||
                        selectedWaId}
                    </h2>
                    <span
                      className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${activeInboxEstablishmentTheme.badge}`}
                    >
                      {selectedEstablishmentName || "Sem estabelecimento"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{selectedWaId}</p>
                  <p className="text-xs text-gray-600">
                    {selectedAssignee
                      ? `Responsável: ${selectedAssignee}`
                      : "Sem responsável"}
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
                      IA pausada — só atendimento humano
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
                      {resumeLoading ? "Retornando…" : "Retornar para IA"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTakeover}
                      disabled={takeoverLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      <MdSupportAgent className="text-lg" />
                      {takeoverLoading ? "Assumindo…" : "Assumir conversa"}
                    </button>
                  )}
                </div>
              </header>

              <div className="relative flex-1 min-h-0 flex flex-col">
                <div
                  ref={messagesContainerRef}
                  onScroll={updateScrollPinState}
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
                          ? `${activeInboxEstablishmentTheme.outboundBubble} text-white rounded-br-md`
                          : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                        }`}
                      >
                        {m.media_url && m.message_type === "image" ? (
                          <a
                            href={m.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.media_url}
                              alt={m.body || "Imagem enviada"}
                              className="mb-1 max-h-64 w-auto rounded-lg object-cover"
                            />
                          </a>
                        ) : null}
                        {m.body ? (
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        ) : null}
                        {m.direction === "inbound" && m.intent ? (
                          <p className="text-[10px] mt-1 opacity-80">
                            intent: {m.intent}
                          </p>
                        ) : null}
                        <p
                          className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-amber-100" : "text-gray-400"}`}
                        >
                          {formatSaoPauloDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {showJumpToLatest ? (
                  <button
                    type="button"
                    onClick={() => scrollMessagesToBottom("smooth")}
                    className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-amber-200 bg-white px-4 py-1.5 text-xs font-medium text-amber-900 shadow-md hover:bg-amber-50"
                  >
                    Mensagens recentes ↓
                  </button>
                ) : null}
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
                <div className="flex items-center justify-between gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSendImage(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage || sending}
                    title="Enviar imagem para o cliente"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    <MdImage />
                    {uploadingImage ? "Enviando imagem…" : "Imagem"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || uploadingImage || !composeText.trim()}
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
      ) : null}
      </>
      ) : null}

      {showWhatsappInbox && activeTab === "atendimento" ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 md:p-5">
          <h2 className="text-base font-semibold text-gray-900">Visão rápida do atendimento</h2>
          <p className="text-sm text-gray-500 mt-1">
            Use este fluxo para operação diária: selecione uma conversa, ajuste status e
            responsável, valide a sugestão da IA e envie.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              <p className="text-xs text-gray-500">Conversa selecionada</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {selectedWaId || "Nenhuma conversa selecionada"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              <p className="text-xs text-gray-500">Status atual</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{selectedStatus}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {selectedAssignee || "Sem responsável"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {showWhatsappArea && activeTab === "links" ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-white">
          <h2 className="text-base font-semibold text-gray-900">
            Links de entrada por estabelecimento
          </h2>
          <p className="text-xs text-gray-500">
            Gere links com token automático (<code>#EST_ID</code>) para a Central AgilizaiApp
            já iniciar no estabelecimento correto.
          </p>
        </div>
        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-[minmax(320px,460px),1fr] gap-3 items-start bg-white">
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
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70">
          <label className="block text-xs font-semibold text-gray-700">
            Mensagem inicial padrão (edição única)
          </label>
          <p className="mt-1 text-[11px] text-gray-500">
            Use <code>{"{estabelecimento}"}</code> para o nome da casa e{" "}
            <code>{"{token}"}</code> para o token automático.
          </p>
          <textarea
            value={entryLinkTemplate}
            onChange={(e) => setEntryLinkTemplate(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            placeholder={DEFAULT_ENTRY_LINK_TEMPLATE}
          />
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
                <tr key={item.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70 transition-colors">
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

      {showWhatsappArea && activeTab === "crm" ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 via-white to-white flex flex-wrap items-center justify-between gap-2">
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
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : "";
                setSelectedCampaignForSend(next);
                setBatchCampaignId(next);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Campanha para envio</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={String(campaign.id)}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkSendCampaignFromCrm}
              disabled={
                bulkCampaignSending || selectedCampaignForSend === "" || campaigns.length === 0
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              title="Envia para todos os contatos elegíveis da campanha (filtros + opt-in)"
            >
              {bulkCampaignSending ? "Enviando em massa…" : "Enviar em massa"}
            </button>
            {bulkCampaignSending ? (
              <button
                type="button"
                onClick={handleCancelBulkCampaignSend}
                disabled={cancellingBatchId !== null}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
              >
                {cancellingBatchId !== null ? "Cancelando…" : "Cancelar envio"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50/40 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Contatos por lote</label>
              <input
                type="number"
                min={1}
                max={100}
                value={batchChunkSize}
                onChange={(e) => setBatchChunkSize(Number(e.target.value) || 25)}
                disabled={bulkCampaignSending}
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pausa entre envios (ms)</label>
              <input
                type="number"
                min={0}
                max={15000}
                value={batchDelayMs}
                onChange={(e) => setBatchDelayMs(Number(e.target.value) || 0)}
                disabled={bulkCampaignSending}
                className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500 max-w-xl pb-2">
              O envio em massa usa os filtros da campanha selecionada (estabelecimento, tags,
              status e opt-in), não apenas os contatos visíveis na tabela abaixo.
            </p>
          </div>
          {bulkSendProgress ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <span>
                  Progresso: {bulkSendProgress.processed} / {bulkSendProgress.total} ·{" "}
                  {bulkSendProgress.sentOk} enviados · {bulkSendProgress.sentFail} falhas ·{" "}
                  {bulkSendProgress.status}
                </span>
                {bulkSendProgress.total > 0 ? (
                  <span>
                    {Math.min(
                      100,
                      Math.round((bulkSendProgress.processed / bulkSendProgress.total) * 100),
                    )}
                    %
                  </span>
                ) : null}
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width:
                      bulkSendProgress.total > 0
                        ? `${Math.min(100, (bulkSendProgress.processed / bulkSendProgress.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50/40">
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

        <div className="p-4 border-b border-gray-100 bg-white">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Importar base de contatos</h3>
          <div className="text-xs text-gray-500 mb-3 space-y-1">
            <p>
              <strong>Passo 1:</strong> selecione o estabelecimento acima (não vai dentro do CSV).
            </p>
            <p>
              <strong>Passo 2:</strong> cole ou carregue um CSV. A coluna obrigatória é{" "}
              <code className="text-[11px] bg-gray-100 px-1 rounded">telefone</code> (WhatsApp com
              DDI 55). Opcionais: nome, email, marketing_opt_in, tags.
            </p>
            <p>
              <strong>Contato único:</strong> cole duas linhas — cabeçalho + linha de dados — ou só
              uma linha no formato{" "}
              <code className="text-[11px] bg-gray-100 px-1 rounded">
                5511999999999,Maria,true,vip
              </code>{" "}
              (telefone primeiro).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select
              value={importEstablishmentId === "" ? "" : String(importEstablishmentId)}
              onChange={(e) => {
                if (!e.target.value) {
                  setImportEstablishmentId("");
                  return;
                }
                const parsed = Number(e.target.value);
                setImportEstablishmentId(Number.isFinite(parsed) ? parsed : "");
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="">Estabelecimento da base (obrigatório)</option>
              {establishmentFilterOptions.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.name}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 px-2">
              <input
                type="checkbox"
                checked={importDefaultOptIn}
                onChange={(e) => setImportDefaultOptIn(e.target.checked)}
              />
              Marcar opt-in na importação
            </label>
            <input
              type="text"
              value={importSourceTag}
              onChange={(e) => setImportSourceTag(e.target.value)}
              placeholder="Tag da fonte (ex.: planilha-junho)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder={`telefone,nome,email,marketing_opt_in,tags\n5511999999999,Maria Silva,maria@email.com,true,vip`}
            rows={5}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono mb-3"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadImportTemplate}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              Baixar modelo CSV
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleImportFileChange(e.target.files?.[0] ?? null)}
              />
              Carregar CSV
            </label>
            <button
              type="button"
              onClick={handleImportContacts}
              disabled={importingContacts}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {importingContacts ? "Importando…" : "Importar contatos"}
            </button>
            <button
              type="button"
              onClick={handleBackfillOptIn}
              disabled={backfillOptInLoading}
              className="inline-flex items-center px-3 py-2 rounded-lg border border-emerald-300 text-emerald-800 text-sm hover:bg-emerald-50 disabled:opacity-50"
              title="Concede opt-in a quem já mandou mensagem pelo WhatsApp"
            >
              {backfillOptInLoading ? "Processando…" : "Opt-in para quem já conversou"}
            </button>
          </div>
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
              {crmContactGroups.map((group) => (
                <Fragment key={`group-${group.key}`}>
                  <tr className="border-t border-indigo-100 bg-indigo-50/60">
                    <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-indigo-900">
                      {group.label} • {group.contactCount} contato(s)
                    </td>
                  </tr>
                  {group.contacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
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
                        {formatSaoPauloDateTime(contact.last_seen_at)}
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
                            disabled={
                              sendCampaignLoading ||
                              bulkCampaignSending ||
                              !selectedCampaignForSend
                            }
                            className="inline-flex items-center px-2.5 py-1.5 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                            title="Respeita trava de opt-in"
                          >
                            {sendCampaignLoading ? "Enviando…" : "Enviar campanha"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        </section>
      ) : null}

      {showWhatsappArea && activeTab === "campanhas" ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 via-white to-white">
          <h2 className="text-base font-semibold text-gray-900">
            Campanhas (estilo e-mail marketing)
          </h2>
          <p className="text-xs text-gray-500">
            Título + imagem + texto. Modo automático: imagem livre na janela de 24h; template Meta
            fora dela (bases importadas e disparo em massa).
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 border-b border-gray-100">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
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
            placeholder="Nome interno da campanha"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={campaignForm.headline}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, headline: e.target.value }))
            }
            placeholder="Título (assunto — aparece no topo da mensagem)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={campaignForm.message_template}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, message_template: e.target.value }))
            }
            placeholder="Texto principal da campanha"
            rows={5}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          />
          <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingCampaignImage}
                onChange={(e) => handleUploadCampaignImage(e.target.files?.[0] ?? null)}
              />
              {uploadingCampaignImage ? "Enviando imagem…" : "Enviar imagem hero"}
            </label>
            {campaignForm.image_url ? (
              <span className="text-xs text-emerald-700 truncate max-w-[240px]">Imagem OK</span>
            ) : null}
          </div>
          <select
            value={campaignForm.send_mode}
            onChange={(e) =>
              setCampaignForm((prev) => ({
                ...prev,
                send_mode: e.target.value as "auto" | "session" | "template",
              }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white md:col-span-2"
          >
            <option value="auto">Modo automático (recomendado)</option>
            <option value="session">Só janela 24h (sem template)</option>
            <option value="template">Só template Meta (marketing em massa)</option>
          </select>
          <input
            type="text"
            value={campaignForm.meta_template_name}
            onChange={(e) =>
              setCampaignForm((prev) => ({ ...prev, meta_template_name: e.target.value }))
            }
            placeholder="Template Meta (opcional — default: agilizai_campanha_marketing)"
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
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Prévia (como o cliente vê)</p>
            <div className="rounded-lg bg-white border border-gray-100 shadow-sm overflow-hidden">
              {campaignForm.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaignForm.image_url}
                  alt="Prévia campanha"
                  className="w-full max-h-40 object-cover"
                />
              ) : (
                <div className="h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Sem imagem
                </div>
              )}
              <div className="p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {campaignForm.headline || campaignForm.name || "Título da campanha"}
                </p>
                <p className="text-gray-700 mt-2 whitespace-pre-wrap text-xs">
                  {campaignForm.message_template || "Texto da campanha…"}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Template Meta: cabeçalho IMAGE + corpo com {"{{1}}"} título e {"{{2}}"} texto.
              Necessário para disparos fora da janela de 24h.
            </p>
          </div>
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
                <tr key={campaign.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-2 text-gray-900">
                    <p className="font-medium">{campaign.name}</p>
                    {campaign.headline ? (
                      <p className="text-xs font-medium text-gray-700">{campaign.headline}</p>
                    ) : null}
                    {campaign.image_url ? (
                      <p className="text-[10px] text-indigo-600">Com imagem</p>
                    ) : null}
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {campaign.message_template}
                    </p>
                    <p className="text-[10px] text-gray-400">Modo: {campaign.send_mode || "auto"}</p>
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

        <div className="border-t border-gray-100 p-4 space-y-4 bg-slate-50/70">
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
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
                    <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
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
                          {formatSaoPauloDateTime(log.created_at)}
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
          <div className="border-t border-gray-100 p-4 bg-gradient-to-b from-gray-50 to-white">
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

      {showWhatsappArea && activeTab === "relatorios" ? (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 via-white to-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Relatórios de desempenho do WhatsApp
            </h2>
            <p className="text-xs text-gray-500">
              Acompanhe volume, qualidade de atendimento, opt-in e conversão em reservas.
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
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Conversas</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.conversations_total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Resolvidas</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.conversations_resolved ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Contatos</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.contacts_total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Opt-in</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.contacts_opt_in ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Reservas WhatsApp</p>
            <p className="text-xl font-semibold text-gray-900">
              {reportSummary?.reservations_whatsapp ?? 0}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Taxa de resolução</p>
            <p className="text-2xl font-semibold text-emerald-900">
              {reportDerived.resolutionRate.toFixed(1)}%
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              Conversas resolvidas em relação ao total no período.
            </p>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-xs text-indigo-700">Taxa de opt-in</p>
            <p className="text-2xl font-semibold text-indigo-900">
              {reportDerived.optInRate.toFixed(1)}%
            </p>
            <p className="text-[11px] text-indigo-800 mt-1">
              Contatos com permissão para campanhas de marketing.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Conversão em reservas</p>
            <p className="text-2xl font-semibold text-amber-900">
              {reportDerived.reservationConversion.toFixed(1)}%
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Reservas geradas via WhatsApp sobre base de contatos.
            </p>
          </div>
        </div>
        </section>
      ) : null}
    </div>
  );
}
