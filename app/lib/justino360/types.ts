/** Justino360 — tipos compartilhados entre telas de staff e gestão. */

export type RunItemStatus = "pendente" | "ok" | "nao_ok" | "na";

export type TaskStatus =
  | "aberta"
  | "em_andamento"
  | "aguardando"
  | "concluida"
  | "validada";

export type IncidentStatus =
  | "aberta"
  | "em_andamento"
  | "aguardando"
  | "solucionada"
  | "cancelada";

export type Priority = "baixa" | "media" | "alta" | "critica";

export type MaintenanceKind = "corretiva" | "preventiva" | "inspecao";

export type MaintenanceStatus =
  | "aberta"
  | "em_andamento"
  | "aguardando_peca"
  | "concluida"
  | "cancelada";

export type ChecklistRunItem = {
  id: number;
  title: string;
  status: RunItemStatus;
  observation?: string | null;
  evidence_url?: string | null;
  requires_photo?: boolean;
  answered_by_name?: string | null;
  answered_at?: string | null;
  incident_id?: number | null;
  incident_status?: IncidentStatus | null;
  task_id?: number | null;
  task_status?: TaskStatus | null;
};

export type ChecklistRunDetail = {
  id: number;
  template_name: string;
  sector_name?: string | null;
  status: string;
  run_date?: string;
  items: ChecklistRunItem[];
  total_items: number;
  answered_items: number;
  nao_ok_count: number;
  can_manage?: boolean;
  can_validate?: boolean;
};

export type ChecklistTemplate = {
  id: number;
  name: string;
  sector_name?: string | null;
  shift_type: string;
  items_count: number;
};

export type ChecklistRunSummary = {
  id: number;
  template_name: string;
  sector_name?: string | null;
  status: string;
  total_items: number;
  answered_items: number;
  nao_ok_count?: number;
  run_date?: string;
};

export type J360Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  origin: string;
  due_at?: string | null;
  sector_name?: string | null;
  assigned_to_name?: string | null;
  evidence_url?: string | null;
  is_overdue?: boolean;
};

export type J360Incident = {
  id: number;
  title: string;
  description?: string | null;
  status: IncidentStatus;
  priority: Priority;
  sector_name?: string | null;
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  checklist_item_title?: string | null;
  evidence_url?: string | null;
  solution?: string | null;
  created_at: string;
};

export type J360Sector = {
  id: number;
  name: string;
  key?: string;
};

export type J360Asset = {
  id: number;
  name: string;
  code?: string | null;
  location?: string | null;
  manufacturer?: string | null;
  notes?: string | null;
  sector_id?: number | null;
  sector_name?: string | null;
  next_maintenance_at?: string | null;
  is_active?: boolean;
  open_tickets?: number;
  last_maintenance_at?: string | null;
};

export type J360Maintenance = {
  id: number;
  asset_id: number;
  asset_name?: string | null;
  asset_location?: string | null;
  sector_name?: string | null;
  kind: MaintenanceKind;
  title: string;
  description?: string | null;
  resolution?: string | null;
  status: MaintenanceStatus;
  evidence_url?: string | null;
  due_at?: string | null;
  performed_at?: string | null;
  performed_by_name?: string | null;
  created_by_name?: string | null;
  created_at: string;
};

/** Resposta de `GET /assets/:id`. */
export type J360AssetDetail = {
  asset: J360Asset;
  maintenance: J360Maintenance[];
  incidents: {
    id: number;
    title: string;
    status: IncidentStatus;
    priority: Priority;
    created_at: string;
    resolved_at?: string | null;
    solution?: string | null;
  }[];
  can_manage?: boolean;
};

export type J360MaintenanceMetrics = {
  abertos: number;
  em_andamento: number;
  concluidos: number;
  concluidos_30d: number;
  tempo_medio_horas: number | null;
  preventivas_vencidas: number;
  por_tipo: { kind: MaintenanceKind; abertos: number; concluidos: number }[];
};

export type J360HomeData = {
  tarefas: J360Task[];
  checklists: ChecklistRunSummary[];
  checklists_disponiveis: ChecklistTemplate[];
  ocorrencias: J360Incident[];
  treinamentos: { id: number; title: string; status: string; due_at?: string | null }[];
  comunicados: {
    id: number;
    title: string;
    requires_ack: boolean;
    acked_at?: string | null;
  }[];
  agenda: { id: number; title: string; starts_at: string; event_type: string }[];
};

export type J360DashboardData = {
  checklists_concluidos_hoje: number;
  checklists_atrasados: number;
  checklists_nao_iniciados_hoje: number;
  ocorrencias_abertas: number;
  ocorrencias_criticas: number;
  ocorrencias_solucionadas_hoje: number;
  tarefas_abertas: number;
  tarefas_atrasadas: number;
  tarefas_concluidas_hoje: number;
  treinamentos_pendentes: number;
  comunicados_sem_ciencia: number;
  /** Opcional: só existe depois do deploy da Fase 5 da API. */
  manutencoes_abertas?: number;
  por_setor: { sector: string; tasks_open: number; incidents_open: number }[];
  problemas_recorrentes: { title: string; times: number }[];
};

/** Retorno do PATCH de item de checklist. */
export type AnswerItemResult = {
  item: ChecklistRunItem;
  incident?: { id: number } | null;
  task?: { id: number } | null;
  run_status?: string;
  pending_items?: number;
};
