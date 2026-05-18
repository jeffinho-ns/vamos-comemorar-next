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
