/** Tipos e rótulos da aba Reservas (iguais ao painel do Renato). */

export interface ReservaEntry {
  id: string;
  date: string;
  pax: number;
  tipo: string;
  nomeCliente: string;
  telefone: string;
  email: string;
  observacao: string;
  submittedByName: string;
  submittedAt: string;
  convidados: string;
  origem: string;
  ativacaoId: string;
  hora: string;
}

/** Documento de getReservations (soma por dia). */
export interface ReservaDia {
  date: string;
  pax: number;
  happyHour: number;
  despedida: number;
  aniversario: number;
  submittedAt: string;
  porHora?: Record<string, number>;
}

export interface CrmLinha {
  id: string;
  data: string;
  criadoData: string;
  criadoHora?: number | string;
  status: string;
  origem: string;
  pessoas: number | string;
  criadoIA: number | string;
  atendidoIA: number | string;
  [coluna: string]: string | number | null | undefined;
}

export interface CrmFunil {
  periodo: string;
  capturedAt: string;
  conversas: number;
  duvida: number;
  inicio: number;
  finalizaram: number;
  resolucaoPct: number;
  handoff: number;
  handoffPct: number;
  sessoes: number;
  sessoesVar: number;
  reservasVar: number;
  metaAds: number;
  whatsapp: number;
  instagram: number;
}

export interface CrmConfigLeitura {
  capturedAt: number | string;
  cfg: Record<string, unknown>;
}

export const RESERVATION_TIPO_LABEL: Record<string, string> = { normal: "Normal", happyHour: "Happy Hour", despedida: "Despedida", aniversario: "Aniversário" };
export const RESERVA_ORIGEM_LABEL: Record<string, string> = { instagram: "📸 Instagram", whatsapp: "WhatsApp direto", indicacao: "Indicação", google: "Google/site", porta: "Passou na porta", outro: "Outro" };
export const CRM_META = { cancel: 10, noshow: 8, comparece: 90 };

export function parseConvidados(raw: string) {
  return (raw || "").split("\n").map((s) => s.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}
