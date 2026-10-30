import { SETOR } from "../operacao/freelancerTipos";

export interface ItemAuditoriaOp {
  id: string;
  dataIdentificacao: string;
  setor: string;
  tipoServico: string;
  descricaoProblema: string;
  impactoOperacional: string;
  responsavelInterno: string;
  empresaExecutora: string;
  necessitaAprovacao: boolean;
  valorEstimado: number;
  prioridade: string;
  prazo: string;
  dataInicio: string;
  dataConclusao: string;
  status: string;
  observacao: string;
  createdByEmail: string;
  createdAt: string;
  updatedByEmail: string;
  updatedAt: string;
  observacaoAprovacao: string;
}

export interface Evidencia {
  id: string;
  itemId: string;
  antesDepois: "antes" | "depois" | string;
  descricao: string;
  url: string;
  fileName: string;
  uploadedByEmail: string;
  uploadedAt: string;
}

export const AUOP_TIPO_LABEL: Record<string, string> = { manutencao: "Manutenção", organizacao: "Organização", obra: "Obra", limpeza: "Limpeza", aquisicao: "Aquisição", outros: "Outros" };
export const AUOP_PRIORIDADE_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const AUOP_PRIORIDADE_BADGE: Record<string, "r" | "b" | "bl"> = { alta: "r", media: "b", baixa: "bl" };
export const AUOP_STATUS_LABEL: Record<string, string> = { aberto: "Aberto", andamento: "Em andamento", aguardandoAprovacao: "Aguardando aprovação", concluido: "Concluído", negado: "Negado", aprovado: "Aprovado" };
export const AUOP_STATUS_BADGE: Record<string, "b" | "y" | "p" | "g" | "r"> = { aberto: "b", andamento: "y", aguardandoAprovacao: "p", concluido: "g", negado: "r", aprovado: "g" };
export const AUOP_SETORES = [...Object.keys(SETOR), "areaExterna"];

export function auopSetorLabel(s: string) {
  return s === "areaExterna" ? "Área Externa" : (SETOR[s] ?? s);
}

export function auopAtrasado(item: ItemAuditoriaOp, hoje: string) {
  if (item.status === "concluido" || !item.prazo) return false;
  return item.prazo < hoje;
}

/** Mesma conta de renderAuditoriaOpItens (KPIs sobre a lista inteira). */
export function indicadoresAuop(itens: ItemAuditoriaOp[], hoje: string) {
  return {
    aberto: itens.filter((x) => x.status === "aberto").length,
    andamento: itens.filter((x) => x.status === "andamento").length,
    aguardando: itens.filter((x) => x.status === "aguardandoAprovacao").length,
    concluido: itens.filter((x) => x.status === "concluido").length,
    atrasado: itens.filter((x) => auopAtrasado(x, hoje)).length,
    valorAberto: itens.filter((x) => x.status !== "concluido").reduce((s, x) => s + (Number(x.valorEstimado) || 0), 0),
  };
}
