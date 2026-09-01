/** Ideia RH — tipos compartilhados entre telas de staff e gestão RH. */

export type IriScope = "organization" | "establishment";

export type IriEstablishment = {
  id: number;
  name: string;
  slug?: string | null;
  legacy_bar_id?: number | null;
};

export type IriSector = {
  id: number;
  key: string;
  name: string;
};

export type IriAnnouncement = {
  id: number;
  title: string;
  body: string;
  priority: string;
  requires_ack: boolean;
  is_active: boolean;
  scope?: IriScope;
  establishment_id?: number | null;
  establishment_name?: string | null;
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

export type IriAnnouncementReceipt = {
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  establishment_name?: string | null;
  received_at?: string | null;
  read_at?: string | null;
  acked_at?: string | null;
};

export type IriDocument = {
  id: number;
  title: string;
  category: string;
  role_key?: string | null;
  description?: string | null;
  file_url?: string | null;
  sector_id?: number | null;
  sector_name?: string | null;
  uploaded_by_name?: string | null;
  version: number;
  is_current: boolean;
  replaces_id?: number | null;
  has_history?: boolean;
  scope?: IriScope;
  establishment_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type IriTrainingStatus = "pendente" | "em_andamento" | "concluido" | "vencido";

export type IriTraining = {
  id: number;
  title: string;
  description?: string | null;
  role_key?: string | null;
  content_url?: string | null;
  content_body?: string | null;
  validity_days?: number | null;
  is_mandatory: boolean;
  is_active: boolean;
  scope?: IriScope;
  establishment_id?: number | null;
  created_by_name?: string | null;
  assigned_count?: number;
  completed_count?: number;
  pending_count?: number;
  expired_count?: number;
  completion_rate?: number;
};

export type IriTrainingAssignment = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  establishment_name?: string | null;
  status: IriTrainingStatus;
  assigned_at?: string | null;
  due_at?: string | null;
  completed_at?: string | null;
  result?: string | null;
  expires_at?: string | null;
  days_until_expiry?: number | null;
};

export type IriTrainingDetail = IriTraining & {
  assignments: IriTrainingAssignment[];
  can_manage?: boolean;
};

export type IriMyTraining = {
  id: number;
  training_id: number;
  title: string;
  description?: string | null;
  content_url?: string | null;
  content_body?: string | null;
  role_key?: string | null;
  is_mandatory: boolean;
  validity_days?: number | null;
  status: IriTrainingStatus;
  due_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  days_until_expiry?: number | null;
};

export type IriTeamMember = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  establishment_name?: string | null;
  assignment_status?: IriTrainingStatus | null;
  due_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
};

export type IriHomeData = {
  comunicados: {
    id: number;
    title: string;
    requires_ack: boolean;
    acked_at?: string | null;
    expires_at?: string | null;
  }[];
  treinamentos: {
    id: number;
    training_id: number;
    title: string;
    status: IriTrainingStatus;
    due_at?: string | null;
    is_mandatory?: boolean;
  }[];
  pending_ack_count?: number;
  pending_training_count?: number;
};

export type IriUnitAckStats = {
  establishment_id: number;
  establishment_name: string;
  staff_count: number;
  ack_count: number;
  ack_rate: number;
  pending_trainings: number;
};

export type IriDashboardData = {
  comunicados_sem_ciencia: number;
  treinamentos_pendentes: number;
  treinamentos_vencidos: number;
  colaboradores_ativos: number;
  por_unidade: IriUnitAckStats[];
};

export type IriUploadResult = {
  url: string;
  object_path?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
};
