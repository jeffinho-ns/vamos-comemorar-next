export type OSType = 'artist' | 'bar_service' | null;

export interface OperationalDetail {
  id: number;
  os_type?: OSType;
  os_number?: string | null;
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
  
  // Campos para OS de Artista/Banda/DJ
  contractor_name?: string | null;
  contractor_cnpj?: string | null;
  contractor_address?: string | null;
  contractor_legal_responsible?: string | null;
  contractor_legal_cpf?: string | null;
  contractor_phone?: string | null;
  contractor_email?: string | null;
  artist_artistic_name?: string | null;
  artist_full_name?: string | null;
  artist_cpf_cnpj?: string | null;
  artist_address?: string | null;
  artist_phone?: string | null;
  artist_email?: string | null;
  artist_responsible_name?: string | null;
  artist_bank_name?: string | null;
  artist_bank_agency?: string | null;
  artist_bank_account?: string | null;
  artist_bank_account_type?: string | null;
  event_location_address?: string | null;
  event_presentation_date?: string | null;
  event_presentation_time?: string | null;
  event_duration?: string | null;
  event_soundcheck_time?: string | null;
  event_structure_offered?: string | null;
  event_equipment_provided_by_contractor?: string | null;
  event_equipment_brought_by_artist?: string | null;
  financial_total_value?: number | null;
  financial_payment_method?: string | null;
  financial_payment_conditions?: string | null;
  financial_discounts_or_fees?: string | null;
  general_penalties?: string | null;
  general_transport_responsibility?: string | null;
  general_image_rights?: string | null;
  contractor_signature?: string | null;
  artist_signature?: string | null;
  
  // Campos para OS de Bar/Fornecedor
  provider_name?: string | null;
  provider_cpf_cnpj?: string | null;
  provider_address?: string | null;
  provider_responsible_name?: string | null;
  provider_responsible_contact?: string | null;
  provider_bank_name?: string | null;
  provider_bank_agency?: string | null;
  provider_bank_account?: string | null;
  provider_bank_account_type?: string | null;
  service_type?: string | null;
  service_professionals_count?: number | null;
  service_materials_included?: string | null;
  service_start_date?: string | null;
  service_start_time?: string | null;
  service_end_date?: string | null;
  service_end_time?: string | null;
  service_setup_location?: string | null;
  service_technical_responsible?: string | null;
  commercial_total_value?: number | null;
  commercial_payment_method?: string | null;
  commercial_payment_deadline?: string | null;
  commercial_cancellation_policy?: string | null;
  commercial_additional_costs?: string | null;
  general_damage_responsibility?: string | null;
  general_conduct_rules?: string | null;
  general_insurance?: string | null;
  provider_signature?: string | null;
}

export interface OperationalDetailFormData {
  os_type?: OSType;
  os_number?: string;
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
  
  // Campos para OS de Artista/Banda/DJ
  contractor_name?: string;
  contractor_cnpj?: string;
  contractor_address?: string;
  contractor_legal_responsible?: string;
  contractor_legal_cpf?: string;
  contractor_phone?: string;
  contractor_email?: string;
  artist_artistic_name?: string;
  artist_full_name?: string;
  artist_cpf_cnpj?: string;
  artist_address?: string;
  artist_phone?: string;
  artist_email?: string;
  artist_responsible_name?: string;
  artist_bank_name?: string;
  artist_bank_agency?: string;
  artist_bank_account?: string;
  artist_bank_account_type?: string;
  event_name?: string;
  event_location_address?: string;
  event_presentation_date?: string;
  event_presentation_time?: string;
  event_duration?: string;
  event_soundcheck_time?: string;
  event_structure_offered?: string;
  event_equipment_provided_by_contractor?: string;
  event_equipment_brought_by_artist?: string;
  financial_total_value?: number;
  financial_payment_method?: string;
  financial_payment_conditions?: string;
  financial_discounts_or_fees?: string;
  general_penalties?: string;
  general_transport_responsibility?: string;
  general_image_rights?: string;
  contractor_signature?: string;
  artist_signature?: string;
  
  // Campos para OS de Bar/Fornecedor
  provider_name?: string;
  provider_cpf_cnpj?: string;
  provider_address?: string;
  provider_responsible_name?: string;
  provider_responsible_contact?: string;
  provider_bank_name?: string;
  provider_bank_agency?: string;
  provider_bank_account?: string;
  provider_bank_account_type?: string;
  service_type?: string;
  service_professionals_count?: number;
  service_materials_included?: string;
  service_start_date?: string;
  service_start_time?: string;
  service_end_date?: string;
  service_end_time?: string;
  service_setup_location?: string;
  service_technical_responsible?: string;
  commercial_total_value?: number;
  commercial_payment_method?: string;
  commercial_payment_deadline?: string;
  commercial_cancellation_policy?: string;
  commercial_additional_costs?: string;
  general_damage_responsibility?: string;
  general_conduct_rules?: string;
  general_insurance?: string;
  provider_signature?: string;
}


