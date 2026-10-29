/** Tópicos canônicos — devem coincidir com a API (faqTopicCanonical.js / agentTools.js). */
export type FaqTopicTemplate = {
  value: string;
  label: string;
  description: string;
  placeholder: string;
  legacyAliases?: string[];
};

export const FAQ_TOPIC_TEMPLATES: FaqTopicTemplate[] = [
  {
    value: 'dias_horarios_funcionamento',
    label: 'Dias e horários de funcionamento',
    description:
      'Dias da semana que abre/fecha, horários (ex.: sábado 16h–04h), club, música do dia.',
    placeholder:
      'Ex.: Aos sábados abrimos às 16h e fechamos às 04h. Tocamos house, open format, brasilidades. Club às 00h. Entrada: até 18h VIP; 18h–00h R$60/R$160; após 00h R$80/R$200. Sujeito a alteração.',
    legacyAliases: ['horario_funcionamento', 'horarios', 'funcionamento'],
  },
  {
    value: 'valores_entrada',
    label: 'Valores de entrada e lista',
    description: 'Preços por faixa de horário, VIP, consumação, regras com reserva/nome na lista.',
    placeholder:
      'Ex.: Até 18h todos VIP. Das 18h à 00h: R$60 seco ou R$160 consome. Após 00h: R$80 seco ou R$200 consome. Sujeito a alteração.',
    legacyAliases: ['entrada', 'precos', 'vip'],
  },
  {
    value: 'beneficios_aniversario',
    label: 'Vantagens para aniversariante',
    description: 'Benefícios do aniversariante e cortesias por quantidade de convidados presentes.',
    placeholder:
      'Ex.: 2 VIPs + 2 G&T (aniversariante + acompanhante). 20 convidados presentes: 1 garrafa Gin 142 ou Clericot. 30 convidados: garrafa + 1 drink cortesia.',
    legacyAliases: ['aniversarios', 'aniversario', 'niver'],
  },
  {
    value: 'areas_mesas_camarotes_diferenca',
    label: 'Áreas, mesas e camarotes',
    description: 'Diferença entre mesa, rooftop, camarote, valores consumíveis.',
    placeholder:
      'Ex.: Mesas sem taxa de reserva. Rooftop Lounge 6 pessoas R$800 consumível. Camarote 8 VIPs R$2000...',
    legacyAliases: ['areas', 'area', 'camarote', 'mesa'],
  },
  {
    value: 'reserva_grupos_grandes_highline',
    label: 'Reservas grandes (16+ pessoas) — Highline',
    description:
      'Somente Highline: grupos a partir de 16 pessoas. A IA não deve dizer "sem vaga" por falta de mesa única — explica que pode não haver cadeira para todos, mas registra a reserva.',
    placeholder:
      'Ex.: A partir de 16 pessoas juntamos mesas no Deck. Pode não caber todo mundo sentado de uma vez, mas a reserva é feita e a Hostess organiza na chegada. Só lista de espera se zero mesas livres no dia.',
    legacyAliases: ['grupo_grande', 'grupos_grandes', 'reserva_grande'],
  },
  {
    value: 'reserva_areas_operacional_highline',
    label: 'Áreas do Sistema de Reservas (Highline)',
    description:
      'Somente Highline: subáreas e mesas do painel /admin/restaurant-reservations. A IA consulta disponibilidade, sugere área por quantidade de pessoas e usa lista de espera se tudo estiver cheio.',
    placeholder:
      'Ex.: Respostas curtas e humanizadas. consultar_areas_mesa_reserva com data e pessoas. Em criar_pre_reserva/criar_lista_espera, preencher observacoes: "Cliente quer Deck Frente", pedidos especiais, etc.',
    legacyAliases: ['areas_reserva', 'lista_espera'],
  },
  {
    value: 'regras_bolo',
    label: 'Regras para bolo',
    description: 'Se pode levar bolo, peso máximo, nota fiscal, etc.',
    placeholder: 'Ex.: Pode levar bolo até 2kg com nota fiscal na entrada.',
    legacyAliases: ['bolo'],
  },
  {
    value: 'redes_sociais_fotos',
    label: 'Redes sociais e fotos do ambiente',
    description: 'Instagram oficial e como o cliente pode ver o ambiente.',
    placeholder: 'Ex.: Indique o Instagram @highlinebar para fotos e vibe do local.',
    legacyAliases: ['instagram', 'fotos'],
  },
  {
    value: 'estacionamento',
    label: 'Estacionamento',
    description: 'Valet, estacionamento conveniado, orientações de acesso.',
    placeholder: 'Ex.: Temos estacionamento conveniado na rua X; valet aos sábados.',
  },
  {
    value: 'pet',
    label: 'Pets',
    description: 'Política para animais de estimação.',
    placeholder: 'Ex.: Pets não são permitidos, exceto em eventos específicos — confirmar com a equipe.',
    legacyAliases: ['pets'],
  },
  {
    value: 'musica',
    label: 'Música / programação',
    description: 'Estilos musicais e programação (se não couber em horários).',
    placeholder: 'Ex.: Sexta e sábado: house, open format e brasilidades.',
  },
  {
    value: 'cardapio',
    label: 'Cardápio',
    description: 'Link ou orientação sobre o cardápio digital.',
    placeholder: 'Ex.: Envie o link do cardápio digital e convide a explorar drinks e petiscos.',
    legacyAliases: ['menu'],
  },
  {
    value: 'dress_code',
    label: 'Dress code',
    description: 'Traje e vestimenta recomendada.',
    placeholder: 'Ex.: Casual elegante; evitar chinelos e bermudas rasgadas.',
  },
];

export const LEGACY_FAQ_TOPIC_VALUES = new Set(
  FAQ_TOPIC_TEMPLATES.flatMap((t) => t.legacyAliases || [])
);

export function formatFaqTopicLabel(topic: string): string {
  const match = FAQ_TOPIC_TEMPLATES.find((item) => item.value === topic);
  if (match) return match.label;
  return topic.replace(/_/g, ' ');
}

export function getFaqTopicTemplate(topic: string): FaqTopicTemplate | undefined {
  return FAQ_TOPIC_TEMPLATES.find((item) => item.value === topic);
}

/** HighLine (places.id = 7) — checklist completo antes dos demais estabelecimentos. */
export const HIGHLINE_ESTABLISHMENT_ID = 7;

export const HIGHLINE_RECOMMENDED_TOPIC_VALUES = [
  'dias_horarios_funcionamento',
  'valores_entrada',
  'beneficios_aniversario',
  'reserva_grupos_grandes_highline',
  'reserva_areas_operacional_highline',
  'areas_mesas_camarotes_diferenca',
  'regras_bolo',
  'redes_sociais_fotos',
  'estacionamento',
  'pet',
  'musica',
  'cardapio',
  'dress_code',
] as const;

/** Tópicos mínimos para demais casas. */
export const DEFAULT_RECOMMENDED_TOPIC_VALUES = [
  'dias_horarios_funcionamento',
  'valores_entrada',
  'beneficios_aniversario',
] as const;

/** Seu Justino (places.id = 1) — mesmos slugs gravados na API. */
export const SEU_JUSTINO_ESTABLISHMENT_ID = 1;

export const SEU_JUSTINO_RECOMMENDED_TOPIC_VALUES = [
  'dias_horarios_funcionamento',
  'valores_entrada',
  'informacoes_terca',
  'informacoes_quarta',
  'informacoes_quinta',
  'informacoes_sexta',
  'informacoes_sabado',
  'reservas_assentos_sabado',
  'informacoes_domingo',
  'programacao_15_11',
  'programacao_02_11',
  'programacao_01_11',
  'reveillon',
  'eventos_corporativos',
  'beneficios_aniversario',
  'flyer_aniversario',
  'regras_bolo',
  'mesas_assentos',
  'tempo_permanencia',
  'atraso_tolerancia',
  'cancelamento_reserva',
  'acessibilidade',
  'guarda_volume',
  'vagas_emprego',
  'formas_pagamento',
  'como_chegar',
  'compras_fornecedor',
  'estacionamento',
  'entrada_bebidas',
  'estrutura_funcionamento',
  'delivery',
  'menores_criancas',
  'area_kids',
  'documento_entrada',
  'narguile',
  'pet',
  'musica',
] as const;

const SEU_JUSTINO_TOPIC_LABELS: Record<string, string> = {
  informacoes_terca: 'Informações de terça-feira',
  informacoes_quarta: 'Informações de quarta-feira',
  informacoes_quinta: 'Informações de quinta-feira',
  informacoes_sexta: 'Informações de sexta-feira',
  informacoes_sabado: 'Informações de sábado',
  reservas_assentos_sabado: 'Reservas e assentos aos sábados',
  informacoes_domingo: 'Informações de domingo',
  programacao_15_11: 'Feriado de 15/11',
  programacao_02_11: 'Feriado de 02/11',
  programacao_01_11: '01/11 — véspera de feriado',
  reveillon: 'Réveillon',
  eventos_corporativos: 'Eventos corporativos',
  flyer_aniversario: 'Flyer de aniversário',
  mesas_assentos: 'Mesas, lugares e assentos',
  tempo_permanencia: 'Tempo de permanência',
  atraso_tolerancia: 'Atraso e tolerância',
  cancelamento_reserva: 'Cancelamento de reserva',
  acessibilidade: 'Acessibilidade',
  guarda_volume: 'Guarda-volumes e chapelaria',
  vagas_emprego: 'Currículo, freelancer e vagas',
  formas_pagamento: 'Formas de pagamento',
  como_chegar: 'Como chegar',
  compras_fornecedor: 'Compras e fornecedor',
  entrada_bebidas: 'Entrada com bebidas',
  estrutura_funcionamento: 'Estrutura e funcionamento',
  delivery: 'Delivery',
  menores_criancas: 'Menores e crianças',
  area_kids: 'Área kids',
  documento_entrada: 'Documento para entrada',
  narguile: 'Narguilé',
};

for (const [value, label] of Object.entries(SEU_JUSTINO_TOPIC_LABELS)) {
  FAQ_TOPIC_TEMPLATES.push({
    value,
    label,
    description: 'Informação operacional do Seu Justino.',
    placeholder: '',
  });
}

export function getRecommendedTopicValues(establishmentId: number): readonly string[] {
  if (Number(establishmentId) === HIGHLINE_ESTABLISHMENT_ID) {
    return HIGHLINE_RECOMMENDED_TOPIC_VALUES;
  }
  if (Number(establishmentId) === SEU_JUSTINO_ESTABLISHMENT_ID) {
    return SEU_JUSTINO_RECOMMENDED_TOPIC_VALUES;
  }
  return DEFAULT_RECOMMENDED_TOPIC_VALUES;
}

/** Espelha a normalização da API ao salvar (slug do tópico). */
export function normalizeTopicInput(raw: string): string {
  const canonicalMap: Record<string, string> = {
    horario: 'dias_horarios_funcionamento',
    horarios: 'dias_horarios_funcionamento',
    funcionamento: 'dias_horarios_funcionamento',
    horario_funcionamento: 'dias_horarios_funcionamento',
    horario_de_funcionamento: 'dias_horarios_funcionamento',
    entrada: 'valores_entrada',
    entradas: 'valores_entrada',
    aniversario: 'beneficios_aniversario',
    aniversarios: 'beneficios_aniversario',
    vantagens_aniversariante: 'beneficios_aniversario',
    areas: 'areas_mesas_camarotes_diferenca',
    area: 'areas_mesas_camarotes_diferenca',
    lista_espera: 'reserva_areas_operacional_highline',
    areas_reserva: 'reserva_areas_operacional_highline',
    grupo_grande: 'reserva_grupos_grandes_highline',
    grupos_grandes: 'reserva_grupos_grandes_highline',
    reserva_grande: 'reserva_grupos_grandes_highline',
    pets: 'pet',
    menu: 'cardapio',
  };

  const slug = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return canonicalMap[slug] || slug;
}

export function isKnownFaqTopic(topic: string): boolean {
  const normalized = normalizeTopicInput(topic);
  return FAQ_TOPIC_TEMPLATES.some((item) => item.value === normalized);
}
