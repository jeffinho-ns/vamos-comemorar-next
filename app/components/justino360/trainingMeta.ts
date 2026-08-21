/**
 * Justino360 — metadados de treinamentos (LMS operacional).
 * A whitelist de funções é a mesma dos documentos na API
 * (`services/justino360/trainingRules.js` espelha `routes/justino360/documents.js`),
 * então reaproveitamos a lista e o rótulo já existentes em `documentMeta`.
 */

import { DOCUMENT_ROLES, roleLabel } from "./documentMeta";

export const TRAINING_ROLES = DOCUMENT_ROLES;
export { roleLabel };

export type TrainingStatus = "pendente" | "em_andamento" | "concluido" | "vencido";

export const TRAINING_STATUSES: TrainingStatus[] = [
  "pendente",
  "em_andamento",
  "concluido",
  "vencido",
];

export const TRAINING_STATUS_LABEL: Record<TrainingStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  vencido: "Vencido",
};

export type J360Training = {
  id: number;
  title: string;
  description?: string | null;
  role_key?: string | null;
  content_url?: string | null;
  content_body?: string | null;
  validity_days?: number | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_by_name?: string | null;
  assigned_count?: number;
  completed_count?: number;
  pending_count?: number;
  expired_count?: number;
  completion_rate?: number;
};

export type J360TrainingAssignment = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  status: TrainingStatus;
  assigned_at?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  result?: string | null;
  expires_at?: string | null;
  days_until_expiry?: number | null;
};

export type J360TrainingDetail = J360Training & {
  assignments: J360TrainingAssignment[];
  can_manage?: boolean;
};

export type J360MyTraining = {
  id: number;
  training_id: number;
  title: string;
  description?: string | null;
  content_url?: string | null;
  content_body?: string | null;
  role_key?: string | null;
  is_mandatory: boolean;
  validity_days?: number | null;
  status: TrainingStatus;
  due_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  days_until_expiry?: number | null;
};

export type J360TeamMember = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  assignment_status?: TrainingStatus | null;
  due_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
};

export type TrainingPayload = {
  title: string;
  description: string | null;
  role_key: string | null;
  content_url: string | null;
  content_body: string | null;
  validity_days: number | null;
  is_mandatory: boolean;
};

export function trainingStatusClass(status?: TrainingStatus | string | null): string {
  switch (status) {
    case "concluido":
      return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40";
    case "vencido":
      return "bg-red-500/20 text-red-200 ring-red-500/40";
    case "em_andamento":
      return "bg-sky-500/20 text-sky-200 ring-sky-500/40";
    case "pendente":
      return "bg-amber-500/20 text-amber-200 ring-amber-500/40";
    default:
      return "bg-white/10 text-gray-300 ring-white/20";
  }
}

export function statusLabel(status?: TrainingStatus | string | null): string {
  if (!status) return "Não atribuído";
  return TRAINING_STATUS_LABEL[status as TrainingStatus] || status;
}

/** Texto curto de reciclagem para o rodapé do card. */
export function validityHint(
  validityDays?: number | null,
  daysUntilExpiry?: number | null,
): string {
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) {
    return validityDays ? `Recicla a cada ${validityDays} dias` : "Sem reciclagem";
  }
  if (daysUntilExpiry < 0) return `Venceu há ${Math.abs(daysUntilExpiry)} dia(s)`;
  if (daysUntilExpiry === 0) return "Vence hoje";
  return `Válido por ${daysUntilExpiry} dia(s)`;
}
