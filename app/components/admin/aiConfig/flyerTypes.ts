export type TriggerEvent = 'reserva_criada' | 'reserva_cancelada' | 'pos_visita' | 'sob_demanda';

export type AssetKind = 'informacao' | 'datas' | 'casa';

export type Flyer = {
  id: number;
  asset_kind: AssetKind;
  trigger_event: TriggerEvent;
  title: string;
  caption: string;
  usage_hint: string;
  media_url: string;
  delay_hours: number;
  is_active: boolean;
};

export const ASSET_KINDS: {
  id: AssetKind;
  label: string;
  hint: string;
  usagePlaceholder: string;
}[] = [
  {
    id: 'informacao',
    label: 'Flyer de informação',
    hint: 'Etiqueta, dress code, regras. A Sol envia no momento que você descrever na legenda.',
    usagePlaceholder:
      'Ex.: enviar quando a reserva for fechada — dicas de etiqueta e como se vestir',
  },
  {
    id: 'datas',
    label: 'Flyer de datas',
    hint: 'Programação, atrações e datas especiais. A Sol manda quando o cliente pergunta o que tem no dia.',
    usagePlaceholder: 'Ex.: flyer da programação de sábado / Réveillon',
  },
  {
    id: 'casa',
    label: 'Imagens da casa',
    hint: 'Fotos do espaço. A Sol envia quando o cliente pede para ver a casa, o bar ou uma área.',
    usagePlaceholder: 'Ex.: área externa / área interna / bar',
  },
];

export const EVENTS: { value: TriggerEvent; label: string; hint: string }[] = [
  {
    value: 'reserva_criada',
    label: 'Reserva criada',
    hint: 'Enviado logo após o cliente fazer a reserva.',
  },
  {
    value: 'reserva_cancelada',
    label: 'Reserva cancelada',
    hint: 'Enviado quando a reserva é cancelada.',
  },
  {
    value: 'pos_visita',
    label: 'Pós-visita (satisfação)',
    hint: 'Enviado algumas horas após o horário da reserva.',
  },
  {
    value: 'sob_demanda',
    label: 'Quando a Sol achar o momento',
    hint: 'Não dispara sozinho. A Sol envia se a conversa pedir essa arte.',
  },
];

export const EVENT_BADGE: Record<TriggerEvent, string> = {
  reserva_criada: 'bg-emerald-100 text-emerald-700',
  reserva_cancelada: 'bg-red-100 text-red-700',
  pos_visita: 'bg-sky-100 text-sky-700',
  sob_demanda: 'bg-amber-100 text-amber-800',
};

export function eventLabel(value: string) {
  return EVENTS.find((item) => item.value === value)?.label || value;
}

export function tokenHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
