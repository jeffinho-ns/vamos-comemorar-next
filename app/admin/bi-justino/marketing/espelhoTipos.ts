/**
 * Formatos crus das leituras `get*` da planilha do Seu Justino (espelho no banco),
 * copiados de apps-script/Code.gs. Só os campos que o painel usa.
 */

export interface ZigRevenueDoc {
  date: string;
  revenue: number;
  publico: number | null;
  servico?: number | null;
}
export interface ZigRevenueResp { ok: boolean; docs?: ZigRevenueDoc[] }

export interface EntryDoc {
  area: string;
  date: string;
  values: Record<string, unknown>;
  notes: Record<string, unknown>;
  submittedByName: string;
  submittedAt: string;
}
export interface EntriesResp { ok: boolean; docs?: EntryDoc[] }

export interface MkPlanDoc {
  date: string;
  trafficPlan: number;
  otherPlan: number;
  attractionsPlan: number;
  publicPlan: number;
  ticketPlan: number;
  revenuePlan: number;
  note: string;
  updatedAt: string;
  updatedBy: string;
}
export interface MkPlansResp { ok: boolean; docs?: MkPlanDoc[] }

export interface RevenueOverview {
  ok: boolean;
  monthKey: string;
  monthRevenue: number;
  monthRevenueZig: number;
  monthRevenueEventos: number;
  monthProjected: number;
  monthProjectedToDate: number;
  yearAvgMonthly: number | null;
  monthsInAverage: number;
  lastYearSameMonth: number | null;
  weekActual: number;
  weekStart?: string;
  weekEnd?: string;
  weekIsPrevious?: boolean;
  weekProjected: number | null;
  weekDiff: number | null;
  weekActualLastYear: number | null;
  ticketSemana: number | null;
  ticketSemanaAnoAnterior: number | null;
  ticketMes: number | null;
  ticketMesAnoAnterior: number | null;
  ticketAno: number | null;
  ticketAnoAnterior: number | null;
}

export interface MkReuniaoItem {
  id: string;
  tipo: "demanda" | "pauta" | "ata";
  titulo: string;
  descricao: string;
  dataReuniao: string;
  participantes: string;
  responsavel: string;
  prazo: string;
  prioridade: "alta" | "media" | "baixa";
  status: "aberto" | "andamento" | "concluido" | "cancelado";
  decisoes: string;
  reuniaoId: string;
  dataConclusao: string;
  observacao: string;
}
export interface MkReunioesResp { ok: boolean; items?: MkReuniaoItem[] }

export interface IgAtivacao {
  id: string;
  data: string;
  tipo: string;
  titulo: string;
  oferta: string;
  postId: string;
  observacao: string;
}
export interface IgAtivacoesResp { ok: boolean; items?: IgAtivacao[] }

export interface IgRetornoItem {
  id: string;
  data: string;
  tipo: string;
  titulo: string;
  oferta: string;
  postId: string;
  post: { tipo: string; permalink: string; reach: number | null; hora: string } | null;
  diretas: { n: number; pax: number };
  janela: { n: number; pax: number };
  base: { n: number; pax: number; semanas: number } | null;
  emAndamento: boolean;
}
export interface IgRetornoResp {
  ok: boolean;
  hoje?: string;
  items?: IgRetornoItem[];
  porTipo?: { tipo: string; acoes: number; diretas: number; janela: number; ganhoSoma: number; ganhoN: number }[];
  semanas?: { semana: string; total: number; informadas: number; instagram: number }[];
  cobertura30?: { total: number; comOrigem: number };
}

export interface IgResumo {
  date: string;
  followers: number | string;
  following?: number | string;
  mediaCount?: number | string;
  reach30: number | string | null;
  views30: number | string | null;
  profileViews30: number | string | null;
  websiteClicks30: number | string | null;
  accountsEngaged30: number | string | null;
  interactions30: number | string | null;
  avisos?: string;
}
export interface IgPost {
  id: string;
  date: string;
  tipo: string;
  permalink: string;
  likes: number | null;
  comments: number | null;
  reach: number | null;
  saved: number | null;
  shares: number | null;
  interactions: number | null;
  views: number | null;
  legenda: string;
  hora: string;
}
export interface InstagramResp {
  ok: boolean;
  configurado?: boolean;
  atual?: IgResumo | null;
  historico?: { date: string; followers: number | null; reach30: number | null }[];
  mensal?: { mes: string; reach: number | null; views: number | null; profileViews: number | null; websiteClicks: number | null; accountsEngaged: number | null; interactions: number | null }[];
  seguidoresMes?: Record<string, number | null>;
  posts?: IgPost[];
}

export interface GoogleAvaliacao {
  id: string;
  nota: number;
  texto: string;
  quando: string;
  respondida: boolean;
  sugestao: string;
  origem: string;
  status: string;
  textoFinal: string;
  capturedAt: number;
}
export interface GoogleAvaliacoesResp { ok: boolean; rows?: GoogleAvaliacao[]; contatos?: string }

export interface BandRankingItem {
  banda: string;
  aparicoesTotal: number;
  diasComDadoReal: number;
  faturamentoMedio: number;
  publicoMedio: number;
  grupo: string;
}
export interface BandRankingResp { ok: boolean; calculadoEm?: string | null; items?: BandRankingItem[] }

export interface ZigDeliveryResp { ok: boolean; cols?: string[]; rows?: [string, string, number][]; plataformas?: string[] }

export interface Food99Snap {
  pedidosConcluidos?: number | null;
  rendaVendas?: number | null;
  ticketMedio?: number | null;
  rankTicketMedio?: number | null;
  rankGanhos?: number | null;
  lojasNoRaio?: number | null;
  horasConectadoDia?: number | null;
  picoInicio?: string;
  picoFim?: string;
  tempoConectadoPicoPct?: number | null;
  statusConectadoMedioPct?: number | null;
  tempoPreparoMin?: number | null;
  naoPreparadosNoPrazoPct?: number | null;
  cancelamentosLojaPct?: number | null;
  itensIncorretosPct?: number | null;
  clientesTotal?: number | null;
  semAvaliacoes?: boolean;
  itens?: {
    vendidos?: { nome: string; volume: number }[];
    conversao?: { nome: string; impressoes: number; carrinho?: number }[];
  };
}
export interface Food99Resp { ok: boolean; rows?: { capturedAt: number | string; snap: Food99Snap }[] }

export interface DreHistoricoResp {
  ok: boolean;
  error?: string;
  termo?: string;
  rotulosDisponiveis?: string[];
  serie?: { mes: string; label: string; valor: number }[];
}

export interface FaturamentoSemanasResp { ok: boolean; semanas?: { semana: string; total: number; dias: number }[] }
export interface BudgetBaseResp { ok: boolean; hoje?: string; paxPorData?: Record<string, number> }
export interface ZigHourlyResp { ok: boolean; items?: { date: string; start: string; intervalInMinutes: number; value: number }[] }
export interface ZigHourlyDetailResp {
  ok: boolean;
  items?: { date: string; start: string; foodCount: number; bevCount: number; otherCount: number; entries: number }[];
}
export interface ZigBilheteriaResp {
  ok: boolean;
  docs?: { mes: string; receita: number; entradasQtd: number; publicoMes: number; pctClientesEntradas: number | null }[];
}

export interface EventoItem {
  id: string;
  data: string;
  status: string;
  valorContrato: number;
  valorExcedente?: number;
  valorTotal?: number;
  statusContrato?: string;
  statusPagamento?: string;
}
export interface EventosResp { ok: boolean; items?: EventoItem[] }

export interface FreelancerRequest { date: string; status: string; attendance: string | null; totalCost: number }
export interface FreelancerRequestsResp { ok: boolean; items?: FreelancerRequest[] }

export interface MonthClosure { id: string; area: string; monthKey: string; closedByEmail: string; closedAt: string }
export interface MonthClosuresResp { ok: boolean; items?: MonthClosure[] }

export interface Duvida {
  id: string;
  createdAt: string;
  askedByEmail: string;
  area: string;
  question: string;
  status: string;
  answer: string;
}
export interface DuvidasResp { ok: boolean; items?: Duvida[] }

export interface AuditoriaOpItem {
  id: string;
  setor: string;
  tipoServico: string;
  descricaoProblema: string;
  impactoOperacional: string;
  empresaExecutora: string;
  valorEstimado: number;
  prioridade: string;
  prazo: string;
  status: string;
}
export interface AuditoriaOpResp { ok: boolean; items?: AuditoriaOpItem[] }

export interface SalariesResp { ok: boolean; rows?: { role: string; name: string; admissionDate: string; baseSalary: number }[] }
export interface UsersListResp { ok: boolean; users?: { email: string; role: string; areas: string }[] }
export interface DeletionsLogResp {
  ok: boolean;
  items?: { deletedAt: string; deletedByEmail: string; kind: string; refDate: string; area: string; summary: string }[];
}
