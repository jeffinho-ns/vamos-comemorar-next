export interface Reservation {
  id: number;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  data_nascimento_cliente?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'completed';
  area_name: string;
  notes?: string;
  establishment_id?: number;
  establishment_name?: string;
  area_id?: number;
  table_number?: string;
  origin?: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReservationFormData {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  area_id?: number;
  table_number?: string;
  status?: string;
  origin?: string;
  notes?: string;
  establishment_id?: number;
  created_by?: number;
}

