/**
 * Justino360 — metadados de reuniões e decisões.
 * Espelha a API (routes/justino360/meetings.js): cada decisão gera, por padrão,
 * uma tarefa com origin = 'reuniao'.
 */

import type { Priority, TaskStatus } from "../../lib/justino360/types";

export type J360Meeting = {
  id: number;
  title: string;
  meeting_at: string;
  attendees?: string | null;
  minutes?: string | null;
  created_by_name?: string | null;
  decisions_count?: number;
  tasks_open?: number;
  tasks_done?: number;
};

export type J360MeetingDecision = {
  id: number;
  meeting_id: number;
  decision: string;
  task_id?: number | null;
  task_title?: string | null;
  task_status?: TaskStatus | null;
  task_priority?: Priority | null;
  task_due_at?: string | null;
  task_sector_name?: string | null;
  task_assigned_to_name?: string | null;
  task_is_overdue?: boolean | null;
  created_at?: string;
};

export type J360MeetingDetail = J360Meeting & {
  decisions: J360MeetingDecision[];
};

/** Uma linha do formulário de decisões — estado local, não payload da API. */
export type DecisionDraft = {
  /**
   * Chave estável para o React e para os ids dos campos. É um contador do
   * formulário (não UUID) para o id renderizado no servidor bater com o do
   * cliente e não quebrar a hidratação.
   */
  key: number;
  decision: string;
  sector_id: string;
  assigned_to: string;
  due_at: string;
  priority: Priority;
  create_task: boolean;
};

export function emptyDecisionDraft(key: number): DecisionDraft {
  return {
    key,
    decision: "",
    sector_id: "",
    assigned_to: "",
    due_at: "",
    priority: "media",
    create_task: true,
  };
}

export type DecisionPayload = {
  decision: string;
  sector_id: number | null;
  assigned_to: number | null;
  due_at: string | null;
  priority: Priority;
  create_task: boolean;
};

export function toDecisionPayload(draft: DecisionDraft): DecisionPayload {
  return {
    decision: draft.decision.trim(),
    sector_id: draft.sector_id ? Number(draft.sector_id) : null,
    assigned_to: draft.assigned_to ? Number(draft.assigned_to) : null,
    due_at: draft.due_at || null,
    priority: draft.priority,
    create_task: draft.create_task,
  };
}
