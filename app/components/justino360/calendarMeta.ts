/**
 * Justino360 — metadados do calendário operacional.
 * Espelha a whitelist da API (services/justino360/calendarBriefing.js).
 *
 * Não tem relação com `operational_details` (OS de evento) nem com o
 * calendário de reservas.
 */

export const CALENDAR_EVENT_TYPES = [
  { value: "evento", label: "Evento" },
  { value: "campanha", label: "Campanha de marketing" },
  { value: "promocao", label: "Promoção" },
  { value: "gravacao", label: "Gravação / conteúdo" },
  { value: "corporativo", label: "Evento corporativo" },
  { value: "cardapio", label: "Mudança de cardápio" },
  { value: "outro", label: "Outro" },
] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number]["value"];

export type J360CalendarSector = {
  id: number;
  key: string;
  name: string;
};

export type J360CalendarEvent = {
  id: number;
  title: string;
  description?: string | null;
  event_type: string;
  starts_at: string;
  ends_at?: string | null;
  impact_sector_ids?: number[] | null;
  impact_sectors?: J360CalendarSector[];
  briefing?: string | null;
  materials_url?: string | null;
  is_active?: boolean;
  created_by_name?: string | null;
  /** Impacto no setor consultado — só vem quando a busca informa sector_id. */
  sector_briefing?: string | null;
};

export function eventTypeLabel(value: string): string {
  const found = CALENDAR_EVENT_TYPES.find((t) => t.value === value);
  return found ? found.label : value;
}

/** Cor por tipo para a equipe bater o olho e reconhecer a natureza da ação. */
export function eventTypeClass(value: string): string {
  switch (value) {
    case "campanha":
    case "promocao":
      return "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-500/40";
    case "gravacao":
      return "bg-sky-500/20 text-sky-200 ring-sky-500/40";
    case "corporativo":
      return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40";
    case "cardapio":
      return "bg-orange-500/20 text-orange-200 ring-orange-500/40";
    case "outro":
      return "bg-white/10 text-gray-300 ring-white/20";
    default:
      return "bg-amber-500/20 text-amber-200 ring-amber-500/40";
  }
}

/**
 * `datetime-local` exige `YYYY-MM-DDTHH:mm` no horário local — `toISOString()`
 * devolveria UTC e a data apareceria deslocada no formulário de edição.
 */
export function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Rótulo curto do dia ("qui, 21/08") para agrupar a agenda da equipe. */
export function dayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

/** "Hoje" / "Amanhã" / "em N dias" — contexto que a equipe lê primeiro. */
export function relativeDayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  if (diffDays < 0) return `há ${Math.abs(diffDays)} dia(s)`;
  return `em ${diffDays} dias`;
}
