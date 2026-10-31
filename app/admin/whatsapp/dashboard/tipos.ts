export type FunilPasso = {
  id: string;
  label: string;
  valor: number;
};

export type OrigemLinha = {
  origem: string;
  label: string;
  reservas: number;
  pessoas: number;
  pct: number;
};

export type WhatsappDashboardSummary = {
  conversations_total: number;
  conversations_resolved: number;
  contacts_total: number;
  contacts_opt_in: number;
  reservations_whatsapp: number;
  periodo?: { inicio: string; fim: string; anteriorInicio?: string; anteriorFim?: string } | null;
  kpis?: {
    reservas: number;
    pessoas: number;
    pessoasPorReserva: number;
    tempoConversaoHoras: number | null;
    variacaoReservasPct: number | null;
    variacaoConversasPct: number | null;
    conversas: number;
  };
  funil?: FunilPasso[];
  ia?: {
    reservas: number;
    conversas: number;
    taxaPct: number;
    capturadas: number;
    vendas: number;
    handoff: number;
  };
  origens?: OrigemLinha[];
  temas?: { tema: string; n: number }[];
  heatmap?: { dow: number; hora: number; n: number }[];
  serie?: { date: string; conversas: number; reservas: number }[];
  statusReservas?: {
    confirmadas: number;
    compareceram: number;
    canceladas: number;
    noshow: number;
  };
  atendimento?: {
    resolvidas: number;
    handoffAtivo: number;
    passaramHumano: number;
  };
  operacao?: OperacaoSummary | null;
};

export type OperacaoPontoSemana = {
  dia: string;
  dow: number;
  valor: number;
};

export type OperacaoSummary = {
  taxaResolucaoPct: number;
  taxaIaPct: number;
  resolvidas: number;
  total: number;
  primeiraRespostaSegundos: number | null;
  primeiraRespostaMediana: number | null;
  resolucaoAutomatica: { ia: number; humano: number };
  origemSessoes: { label: string; n: number; pct: number }[];
  heatmapConversas: { dow: number; hora: number; n: number }[];
  pico: { dia: string; hora: number; n: number } | null;
  resolvidosPorDia: OperacaoPontoSemana[];
  primeiraRespostaPorDia: OperacaoPontoSemana[];
  tempoAtendimentoPorDia: OperacaoPontoSemana[];
  categorias: { tema: string; n: number }[];
  cancelamentos: { motivo: string; n: number; pct: number }[];
};

export type CasaOpcao = { id: number; name: string };
