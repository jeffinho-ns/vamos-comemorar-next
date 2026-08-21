/**
 * Justino360 — metadados de comunicados internos.
 * Espelha a whitelist da API (routes/justino360/announcements.js).
 * Não tem relação com o módulo legado `intranet_announcements`.
 */

import { PRIORITY_LABEL } from "../../lib/justino360/labels";
import type { Priority } from "../../lib/justino360/types";

export const ANNOUNCEMENT_PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;

export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number]["value"];

export type J360Announcement = {
  id: number;
  title: string;
  body: string;
  priority: string;
  requires_ack: boolean;
  is_active: boolean;
  sector_id?: number | null;
  sector_name?: string | null;
  created_by_name?: string | null;
  published_at?: string;
  expires_at?: string | null;
  received_at?: string | null;
  read_at?: string | null;
  acked_at?: string | null;
  receipts_count?: number;
  read_count?: number;
  ack_count?: number;
};

export type J360AnnouncementReceipt = {
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  received_at?: string | null;
  read_at?: string | null;
  acked_at?: string | null;
};

/**
 * Comunicados usam `normal` como padrão; as demais prioridades reaproveitam os
 * rótulos do módulo (`media` ainda aparece em registros antigos).
 */
export function priorityLabel(value: string): string {
  if (value === "normal") return "Normal";
  return PRIORITY_LABEL[value as Priority] || value;
}
