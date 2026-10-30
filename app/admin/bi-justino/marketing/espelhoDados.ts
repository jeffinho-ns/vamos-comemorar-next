import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import type {
  BandRankingItem,
  BandRankingResp,
  EntriesResp,
  EntryDoc,
  MkPlanDoc,
  MkPlansResp,
  RevenueOverview,
  ZigRevenueResp,
} from "./espelhoTipos";
import { numeroDe } from "./numeros";

/** Chaves do espelho que a aba Marketing inteira lê (uma chamada só, memoizada). */
export const CHAVES_MARKETING = [
  "getEntries:marketing",
  "getEntries:financeiro",
  "getEntries:rh",
  "getEntries:operacao",
  "getEntries:cmv",
  "getMkPlans",
  "getMkReunioes",
  "getIgAtivacoes",
  "getIgRetorno",
  "getInstagram",
  "getGoogleAvaliacoes",
  "getBandRanking",
  "getBudgetAtracoesBase",
  "getZigDelivery",
  "get99Food",
  "getDreFaturamentoHistorico",
  "getZigRevenue",
  "getRevenueOverview",
  "getFaturamentoSemanas",
  "getZigHourly",
  "getZigHourlyDetail",
  "getZigBilheteria",
  "getFreelancerRequests",
  "getMonthClosures:marketing",
  "getDuvidas",
] as const;

export type PorData = Record<string, number>;

export interface ZigPorData {
  revenue: PorData;
  publico: PorData;
  servico: PorData;
}

/** zigRevenueByDate / zigPublicoByDate / zigServicoByDate do painel do Renato. */
export function lerZig(dados: DadosPlanilha): ZigPorData {
  const resp = payloadDe<ZigRevenueResp>(dados, "getZigRevenue");
  const revenue: PorData = {};
  const publico: PorData = {};
  const servico: PorData = {};
  for (const doc of resp?.docs ?? []) {
    if (!doc?.date) continue;
    revenue[doc.date] = Number(doc.revenue) || 0;
    if (doc.publico != null) publico[doc.date] = Number(doc.publico) || 0;
    if (doc.servico != null) servico[doc.date] = Number(doc.servico) || 0;
  }
  return { revenue, publico, servico };
}

export function lerEntradas(dados: DadosPlanilha, area: string): EntryDoc[] {
  const resp = payloadDe<EntriesResp>(dados, `getEntries:${area}`);
  return (resp?.docs ?? []).filter((doc) => doc && typeof doc.date === "string");
}

export function valorDe(doc: EntryDoc | null | undefined, chave: string): number | null {
  if (!doc) return null;
  return numeroDe(doc.values?.[chave] as number | string | null | undefined);
}

export interface MkAtual { spend: number; revenue: number }

/** mkActualByDate: gasto e receita atribuída por dia a partir dos envios do Marketing. */
export function mkAtualPorData(docs: EntryDoc[]): Record<string, MkAtual> {
  const saida: Record<string, MkAtual> = {};
  for (const doc of docs) {
    const v = doc.values || {};
    const n = (chave: string) => numeroDe(v[chave] as number | string | null | undefined) ?? 0;
    saida[doc.date] = {
      spend: n("mkTraffic") + n("mkOther") + n("mkAttractions"),
      revenue: (n("mkShow") + n("mkWalkins")) * n("mkTicket"),
    };
  }
  return saida;
}

export type AreaEnvio = "marketing" | "financeiro" | "rh" | "operacao" | "cmv";
export const AREAS_ENVIO: AreaEnvio[] = ["marketing", "financeiro", "rh", "operacao", "cmv"];

/** latestByArea: o envio mais recente de cada área (docs já vêm do mais novo para o mais antigo). */
export function ultimoPorArea(dados: DadosPlanilha): Record<AreaEnvio, EntryDoc | null> {
  const saida = {} as Record<AreaEnvio, EntryDoc | null>;
  for (const area of AREAS_ENVIO) {
    const docs = lerEntradas(dados, area);
    saida[area] = docs.length ? [...docs].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  }
  return saida;
}

export function planosPorData(dados: DadosPlanilha): Record<string, MkPlanDoc> {
  const resp = payloadDe<MkPlansResp>(dados, "getMkPlans");
  const saida: Record<string, MkPlanDoc> = {};
  for (const doc of resp?.docs ?? []) {
    if (doc?.date) saida[doc.date] = doc;
  }
  return saida;
}

export function lerOverview(dados: DadosPlanilha): RevenueOverview | null {
  const resp = payloadDe<RevenueOverview>(dados, "getRevenueOverview");
  return resp && resp.ok ? resp : null;
}

export function lerRanking(dados: DadosPlanilha): { itens: BandRankingItem[]; calculadoEm: string | null } {
  const resp = payloadDe<BandRankingResp>(dados, "getBandRanking");
  return { itens: resp?.items ?? [], calculadoEm: resp?.calculadoEm ?? null };
}

/** lastNByDate: últimos n valores (ordem cronológica) de um mapa por data. */
export function ultimosPorData(porData: PorData, n: number): number[] {
  return Object.keys(porData).sort().slice(-n).map((data) => porData[data]);
}

/** Converte os envios em linhas achatadas (date, submittedBy…, campos de values e notes). */
export function linhasDeEnvios(docs: EntryDoc[]): Record<string, number | string | null>[] {
  return docs.map((doc) => {
    const linha: Record<string, number | string | null> = {
      date: doc.date,
      submittedByName: doc.submittedByName || "",
      submittedAt: doc.submittedAt || "",
    };
    for (const [chave, valor] of Object.entries(doc.values || {})) {
      if (typeof valor === "number" || typeof valor === "string") linha[chave] = valor;
      else if (Array.isArray(valor)) linha[chave === "mkOtherItems" ? "mkOtherCount" : `${chave}Count`] = valor.length;
    }
    for (const [chave, valor] of Object.entries(doc.notes || {})) {
      if (typeof valor === "string") linha[chave] = valor;
    }
    return linha;
  });
}
