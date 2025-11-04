export interface OperationalDetail {
  id: number;
  event_id?: number | null;
  establishment_id?: number | null;
  event_date: string; // YYYY-MM-DD
  artistic_attraction: string;
  show_schedule?: string | null;
  ticket_prices: string;
  promotions?: string | null;
  visual_reference_url?: string | null;
  admin_notes?: string | null;
  operational_instructions?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  establishment_name?: string;
  event_name?: string;
}

export interface OperationalDetailFormData {
  event_id?: number | null;
  establishment_id?: number | null;
  event_date: string;
  artistic_attraction: string;
  show_schedule?: string;
  ticket_prices: string;
  promotions?: string;
  visual_reference_url?: string;
  admin_notes?: string;
  operational_instructions?: string;
  is_active?: boolean;
}

