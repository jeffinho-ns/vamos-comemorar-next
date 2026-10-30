/** Constantes de freelancer iguais às do painel do Renato (FREELANCER_*). */
export const PAGAMENTO: Record<number, number> = { 8: 125, 9: 135, 10: 145, 11: 155, 12: 165 };
export const TURNOS = [8, 9, 10, 11, 12];
export const SETOR: Record<string, string> = {
  salao: "Garçom", cumim: "Cumim", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza",
  seguranca: "Segurança", caixa: "Caixa/Hostess", runner: "Runner/RP", manutencao: "Manutenção", estoquista: "Estoquista",
};
export const MOTIVO: Record<string, string> = {
  demanda: "Aumento de movimento", folga: "Cobertura de folga", ferias: "Cobertura de férias",
  falta: "Cobertura de falta", compensacao: "Compensação de horas", outro: "Outro motivo",
};

export interface PedidoFreelancer {
  id: string;
  date: string;
  sector: string;
  reason: string;
  shiftHours: number;
  qty: number;
  payPerPerson: number;
  totalCost: number;
  note: string;
  requestedByEmail: string;
  requestedAt: string;
  status: "pendente" | "aprovado" | "recusado" | string;
  decidedByEmail: string;
  decidedAt: string;
  decisionNote: string;
  attendance: "" | "compareceu" | "faltou" | string;
  attendanceNote: string;
  freelancerNames: string;
  horaEntrada: string;
  horaSaida: string;
  horaPausa: string;
}

export function setorLabel(chave: string) {
  return SETOR[chave] ?? chave;
}
