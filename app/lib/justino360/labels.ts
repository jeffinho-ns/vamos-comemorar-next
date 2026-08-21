/** Justino360 — rótulos e cores de status para a UI. */

import type { IncidentStatus, Priority, RunItemStatus, TaskStatus } from "./types";

export const RUN_ITEM_STATUS_LABEL: Record<RunItemStatus, string> = {
  pendente: "Pendente",
  ok: "OK",
  nao_ok: "Não OK",
  na: "Não se aplica",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluida: "Concluída",
  validada: "Validada",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  solucionada: "Solucionada",
  cancelada: "Cancelada",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "aberta",
  "em_andamento",
  "aguardando",
  "concluida",
  "validada",
];

/** Transições que fazem sentido operacionalmente para cada status de tarefa. */
export const TASK_NEXT_STATUSES: Record<TaskStatus, TaskStatus[]> = {
  aberta: ["em_andamento", "aguardando", "concluida"],
  em_andamento: ["aguardando", "concluida"],
  aguardando: ["em_andamento", "concluida"],
  concluida: ["validada", "em_andamento"],
  validada: [],
};

export function priorityClass(priority: Priority | string): string {
  switch (priority) {
    case "critica":
      return "bg-red-500/20 text-red-200 ring-red-500/40";
    case "alta":
      return "bg-orange-500/20 text-orange-200 ring-orange-500/40";
    case "baixa":
      return "bg-white/10 text-gray-300 ring-white/20";
    default:
      return "bg-amber-500/20 text-amber-200 ring-amber-500/40";
  }
}

export function runItemStatusClass(status: RunItemStatus | string): string {
  switch (status) {
    case "ok":
      return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40";
    case "nao_ok":
      return "bg-red-500/20 text-red-200 ring-red-500/40";
    case "na":
      return "bg-white/10 text-gray-300 ring-white/20";
    default:
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
