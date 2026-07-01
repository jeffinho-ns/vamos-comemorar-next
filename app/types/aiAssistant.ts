export type AiAssistantGender = 'feminino' | 'masculino' | 'neutro';
export type AiResponseSize = 'curta' | 'media' | 'longa';
export type AiTone = 'amigavel' | 'neutro' | 'formal';
export type AiSlangIntensity = 'nunca' | 'leve' | 'moderado' | 'intenso';
export type AiChannel = 'whatsapp' | 'instagram';

export interface AiBehaviorConfig {
  nao_informar_reservas?: boolean;
  bloquear_visita_sem_reserva?: boolean;
  bloquear_info_menu?: boolean;
  evitar_palavra_evento?: boolean;
  bloquear_links_entrada_eventos?: boolean;
  chamar_humano_insistencia?: boolean;
  chamar_humano_erro?: boolean;
  chamar_humano_fora_area?: boolean;
  considerar_figurinhas?: boolean;
  ignorar_comentarios_instagram?: boolean;
  usar_classificador_bert?: boolean;
  cancelador_sutil?: boolean;
  mensagem_atendimento_humano?: string;
  fora_horario_comportamento?: string;
  tempo_limite_inatividade?: number;
}

export type AiFollowUpCategory =
  | 'reservas'
  | 'cardapio'
  | 'eventos'
  | 'fila'
  | 'saudacoes'
  | 'informacoes';

export interface AiFollowUpCategorySetting {
  enabled: boolean;
  instruction: string;
}

export interface AiFollowUpConfig {
  enabled?: boolean;
  intervals?: number[];
  categories?: Partial<Record<AiFollowUpCategory, AiFollowUpCategorySetting>>;
}

export interface AiAssistantSettings {
  establishment_id: number | null;
  is_active: boolean;
  assistant_name: string;
  gender: AiAssistantGender;
  response_size: AiResponseSize;
  tone: AiTone;
  use_emojis: boolean;
  use_bullets: boolean;
  use_greeting: boolean;
  greet_when_already_greeted: boolean;
  slang_text: string;
  slang_intensity: AiSlangIntensity;
  custom_rules: string[];
  behavior_config: AiBehaviorConfig;
  follow_up_config: AiFollowUpConfig;
  ice_breakers_enabled: boolean;
  ice_breakers_channels: AiChannel[];
  ai_globally_enabled: boolean;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface AiExternalLink {
  id?: number;
  link_key: string;
  title: string;
  url: string;
  description: string;
  is_active: boolean;
}

export interface AiIceBreaker {
  id?: number;
  channel: AiChannel;
  label: string;
  question: string;
  is_active: boolean;
}

export interface AiSticker {
  id?: number;
  trigger: string;
  media_id: string;
  url: string;
  description: string;
  is_active: boolean;
}

export interface AiAllowedNumber {
  id?: number;
  phone_e164: string;
  label: string;
}

export interface EstablishmentInfo {
  id?: number;
  topic: string;
  answer: string;
  category: string;
  is_active: boolean;
}

export function getDefaultAiAssistantSettings(
  establishmentId: number | null = null,
): AiAssistantSettings {
  return {
    establishment_id: establishmentId,
    is_active: false,
    assistant_name: '',
    gender: 'feminino',
    response_size: 'media',
    tone: 'amigavel',
    use_emojis: true,
    use_bullets: false,
    use_greeting: true,
    greet_when_already_greeted: false,
    slang_text: '',
    slang_intensity: 'leve',
    custom_rules: [],
    behavior_config: {},
    follow_up_config: {},
    ice_breakers_enabled: true,
    ice_breakers_channels: ['whatsapp'],
    ai_globally_enabled: true,
  };
}
