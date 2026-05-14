export interface EstablishmentFaq {
  id: number;
  establishment_id: number;
  topic: string;
  answer: string;
  is_active: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface EstablishmentFaqPayload {
  topic: string;
  answer: string;
  is_active?: boolean;
}
