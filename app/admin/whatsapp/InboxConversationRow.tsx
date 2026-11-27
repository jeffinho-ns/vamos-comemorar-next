"use client";

import { MdSmartToy, MdSupportAgent } from "react-icons/md";

export type InboxConversationRowData = {
  id: number;
  wa_id: string;
  contact_name: string | null;
  source_channel?: string | null;
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

const ESTABLISHMENT_DOT_COLORS: Record<number, string> = {
  7: "bg-indigo-500", // Highline
  1: "bg-amber-500", // Seu Justino
  8: "bg-emerald-500", // Pracinha do Seu Justino
  9: "bg-violet-500", // Reserva Rooftop
};

const FALLBACK_DOT_PALETTE = [
  "bg-indigo-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function getEstablishmentDotClass(establishmentId: number | null | undefined): string {
  if (!establishmentId) return "bg-slate-400";
  const pinned = ESTABLISHMENT_DOT_COLORS[establishmentId];
  if (pinned) return pinned;
  return FALLBACK_DOT_PALETTE[Math.abs(establishmentId) % FALLBACK_DOT_PALETTE.length] || "bg-slate-400";
}

/** Formata números WhatsApp BR (5511999998888 -> (11) 99999-8888) para facilitar leitura. */
export function formatReadableWaPhone(waId: string | null | undefined): string {
  const raw = String(waId || "").trim();
  if (!raw) return "";
  const cleanPart = raw.toLowerCase().startsWith("waba:")
    ? raw.split(":").pop() || raw
    : raw;
  const digits = cleanPart.replace(/\D/g, "");
  if (!digits) return cleanPart;

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const subscriber = digits.slice(4);
    const splitAt = subscriber.length === 9 ? 5 : 4;
    return `(${ddd}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const subscriber = digits.slice(2);
    const splitAt = subscriber.length === 9 ? 5 : 4;
    return `(${ddd}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
  }
  return `+${digits}`;
}

/** Garante que nomes vazios, apenas "." ou apenas emojis mostrem também o telefone legível. */
export function formatReadableContactName(conversation: {
  contact_name?: string | null;
  wa_id?: string | null;
  source_channel?: string | null;
  isInstagram?: boolean;
}): string {
  const rawName = String(conversation.contact_name || "").trim();
  const readablePhone = conversation.isInstagram
    ? "Instagram Direct"
    : formatReadableWaPhone(conversation.wa_id);

  if (!rawName) {
    return readablePhone || "Conversa";
  }

  const hasAlphanumeric = /[\p{L}\p{N}]/u.test(rawName);
  if (hasAlphanumeric) {
    return rawName;
  }

  const onlyPunctuation = /^[.\-_~•*,;:!?/\\|+=\s]+$/.test(rawName);
  if (onlyPunctuation) {
    return readablePhone || rawName;
  }

  // Ex.: perfil com apenas emoji ("🥴") -> exibe emoji + telefone para identificar rápido
  return readablePhone ? `${rawName} · ${readablePhone}` : rawName;
}

type InboxConversationRowProps = {
  conversation: InboxConversationRowData;
  active: boolean;
  isHumanHandoff: boolean;
  aiResponded: boolean;
  isInstagram: boolean;
  avatarInitials: string;
  avatarBgClass: string;
  relativeTime: string;
  showEstablishmentBadge: boolean;
  onSelect: (waId: string) => void;
};

export function InboxConversationRow({
  conversation: c,
  active,
  isHumanHandoff,
  aiResponded,
  isInstagram,
  avatarInitials,
  avatarBgClass,
  relativeTime,
  showEstablishmentBadge,
  onSelect,
}: InboxConversationRowProps) {
  const hasUnread = Boolean(c.has_unread);
  const isNewUnopened = !hasUnread && Boolean(c.never_opened_by_me);
  const needsHighlight = hasUnread || isNewUnopened;

  const displayName = formatReadableContactName({
    contact_name: c.contact_name,
    wa_id: c.wa_id,
    source_channel: c.source_channel,
    isInstagram,
  });

  const assigneeShort = c.assigned_user_name
    ? c.assigned_user_name.trim().split(/\s+/)[0]
    : null;

  const rowModifier = isHumanHandoff
    ? "wa-conv-row--human"
    : needsHighlight
      ? "wa-conv-row--unread"
      : "";

  const previewPrefix =
    c.last_direction === "inbound"
      ? "Cliente: "
      : c.last_direction === "outbound"
        ? aiResponded
          ? "IA: "
          : "Equipe: "
        : "";

  const avatarDotClass = isHumanHandoff
    ? "bg-amber-500"
    : hasUnread
      ? "bg-sky-500"
      : "bg-emerald-500";

  return (
    <button
      type="button"
      onClick={() => onSelect(c.wa_id)}
      className={`wa-conv-row ${rowModifier} ${active ? "wa-conv-row--active" : ""} w-full text-left px-3 py-2.5`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ${avatarBgClass}`}
        >
          {avatarInitials}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--wa-conv-bg)] ${avatarDotClass}`}
            title={isHumanHandoff ? "Atendimento humano" : "IA ativa"}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Linha 1: Nome claro e forte + Horário */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={`wa-conv-name truncate text-[14px] leading-snug ${
                  needsHighlight ? "font-bold" : "font-semibold"
                }`}
              >
                {displayName}
              </span>
              {isInstagram ? (
                <span className="shrink-0 rounded bg-gradient-to-r from-fuchsia-500 to-amber-400 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                  IG
                </span>
              ) : null}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              {relativeTime ? (
                <span
                  className={`text-[11px] tabular-nums whitespace-nowrap ${
                    hasUnread
                      ? "wa-conv-time--unread font-bold"
                      : "wa-conv-time font-medium"
                  }`}
                >
                  {relativeTime}
                </span>
              ) : null}
              {hasUnread ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500"
                  aria-label="Mensagem não lida"
                />
              ) : null}
            </div>
          </div>

          {/* Linha 2: Prévia legível da última mensagem */}
          <p
            className={`truncate text-xs leading-snug ${
              hasUnread
                ? "wa-conv-preview--unread font-medium"
                : "wa-conv-preview"
            }`}
          >
            {previewPrefix ? (
              <span className="opacity-80">{previewPrefix}</span>
            ) : null}
            {c.last_body || "Sem mensagens de texto"}
          </p>

          {/* Linha 3: Pílulas claras (IA vs Humano + Nova + Casa) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {isHumanHandoff ? (
              <span className="wa-badge-humano inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
                <MdSupportAgent size={12} />
                {assigneeShort ? `Humano · ${assigneeShort}` : "Humano"}
              </span>
            ) : (
              <span className="wa-badge-ia inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
                <MdSmartToy size={12} />
                {aiResponded ? "IA respondeu" : "IA ativa"}
              </span>
            )}

            {hasUnread && c.last_direction === "inbound" ? (
              <span className="wa-badge-nova inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none">
                Nova msg
              </span>
            ) : hasUnread ? (
              <span className="wa-badge-nova inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none">
                Não lida
              </span>
            ) : isNewUnopened ? (
              <span className="wa-badge-nao-aberta inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
                Nova conversa
              </span>
            ) : null}

            {showEstablishmentBadge ? (
              <span className="wa-badge-casa inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${getEstablishmentDotClass(
                    c.establishment_id,
                  )}`}
                />
                <span className="truncate max-w-[140px]">
                  {c.establishment_name || "Sem casa"}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
