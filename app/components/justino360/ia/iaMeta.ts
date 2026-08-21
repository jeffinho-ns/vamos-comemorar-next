/**
 * Justino360 IA — contratos de resposta e metadados da tela.
 * Espelha routes/justino360/ai.js + services/justino360/aiNormalizer.js.
 */

import type { Priority } from "../../../lib/justino360/types";

/** Envelope estável de todos os endpoints /ai/*. */
export type IaMeta = {
  model: string;
  ai_enabled: boolean;
  source: "ai" | "fallback" | "empty" | "config";
  generated_at: string;
};

export type IaStatus = {
  ai_enabled: boolean;
  model: string;
  can_manage: boolean;
};

export type IaChecklistItem = {
  title: string;
  description: string | null;
  requires_photo: boolean;
};

export type IaChecklist = {
  name: string;
  shift_type: string;
  sector: string;
  items: IaChecklistItem[];
};

export type IaPop = {
  title: string;
  role_key: string | null;
  body: string;
};

export type IaActionItem = {
  decision: string;
  suggested_task: string;
  priority: Priority;
  owner: string | null;
};

export type IaSummary = {
  summary: string;
  kind: string;
  action_items: IaActionItem[];
};

export type IaRecurringItem = {
  title: string;
  category: string | null;
  sector_name: string | null;
  times: number;
  last_seen: string | null;
  still_open: number;
};

export type IaSuggestedAction = {
  title: string;
  why: string | null;
  priority: Priority;
};

export type IaInsights = {
  items: IaRecurringItem[];
  insights: string[];
  suggested_actions: IaSuggestedAction[];
  window_days: number;
  min_times: number;
  note?: string;
};

/** Turnos aceitos por j360_checklist_templates.shift_type. */
export const SHIFT_TYPES = [
  { value: "abertura", label: "Abertura" },
  { value: "fechamento", label: "Fechamento" },
  { value: "rotina", label: "Rotina" },
  { value: "inspecao", label: "Inspeção" },
] as const;

export const SUMMARY_KINDS = [
  { value: "ata", label: "Ata de reunião" },
  { value: "relatorio", label: "Relatório interno" },
  { value: "laudo", label: "Laudo externo" },
  { value: "ocorrencia", label: "Registro de ocorrência" },
  { value: "treinamento", label: "Treinamento" },
  { value: "outro", label: "Outro" },
] as const;

export function shiftLabel(value: string): string {
  return SHIFT_TYPES.find((s) => s.value === value)?.label || value;
}

/** Classe de campo usada nas telas do Justino360. */
export const IA_FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 " +
  "placeholder:text-gray-500 focus:ring-amber-400/60";

export const IA_PRIMARY_BUTTON =
  "rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition " +
  "hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50";

export const IA_SECONDARY_BUTTON =
  "rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-100 transition hover:bg-white/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50";
