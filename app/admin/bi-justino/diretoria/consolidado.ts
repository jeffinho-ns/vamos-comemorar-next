import type { DadosPlanilha } from "../usePlanilha";
import { payloadDe } from "../usePlanilha";
import { lerOverview, ultimoPorArea, valorDe, type AreaEnvio } from "../marketing/espelhoDados";
import type { EntryDoc, FreelancerRequestsResp, SalariesResp } from "../marketing/espelhoTipos";
import { hojeSp } from "../marketing/numeros";

/** Mesmas constantes do painel do Renato (BASE = DRE validada; HEALTHY = referências saudáveis). */
export const BASE = {
  revenue: 526000, cmvPct: 20.09, tax: 3.86, card: 2.11, fee: 7, incomeTax: 2.7, traffic: 4500, marketingOther: 6439,
  attractions: 48114, security: 7979, extras: 26447, rent: 51613, disposable: 7113, coreHr: 104744, adminFixed: 27671,
  financeOther: 3208, otherOps: 18577,
} as const;

export const HEALTHY = {
  trafficRate: 0.00855, marketingOther: 4500, attractionRate: 0.08, securityRate: 0.015, extrasRate: 0.04, coreHrRate: 0.15,
  adminFixed: 25000, financeOther: 3000, card: 2.1, lossRate: 0.006, disposableRate: 0.015, cmvPct: 22,
} as const;

export type Nivel = "g" | "y" | "r";
export type Selo = [Nivel, string];

export function statusCost(a: number, g: number, w: number): Selo {
  return a <= g ? ["g", "SAUDÁVEL"] : a <= w ? ["y", "ATENÇÃO"] : ["r", "CRÍTICO"];
}
export function statusHigh(a: number, g: number, w: number): Selo {
  return a >= g ? ["g", "SAUDÁVEL"] : a >= w ? ["y", "ATENÇÃO"] : ["r", "CRÍTICO"];
}

export function bonusGate(margem: number) {
  if (margem < 8) return 0;
  if (margem < 10) return 0.25;
  if (margem < 12) return 0.6;
  if (margem < 15) return 1;
  return 1.25;
}

function prorata(adm: string) {
  if (!adm) return 1;
  const y = new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);
  const a = new Date(`${adm}T00:00:00`);
  if (a <= start) return 1;
  if (a > end) return 0;
  return Math.max(0, (end.getTime() - a.getTime()) / (end.getTime() - start.getTime()));
}

export type Salario = { role: string; name: string; admissionDate: string; baseSalary: number };

/** employeeBonus do painel: Márcio/CMV não tem bônus (decisão do Renato, 23/09). */
export function bonusColaborador(role: string, margem: number, areaScore: number, salarios: Salario[]) {
  if (role === "cmv") return 0;
  const s = salarios.find((item) => item.role === role);
  if (!s || !s.baseSalary) return 0;
  const annualTarget = s.baseSalary * 1.25;
  const gate = bonusGate(margem);
  const houseScore = Math.min(1.25, Math.max(0, margem / 12));
  const score = 0.5 * areaScore + 0.3 * houseScore + 0.2 * 1;
  return annualTarget * prorata(s.admissionDate) * gate * Math.min(1.25, score);
}

export type ChaveCusto = "mk" | "fn" | "rh" | "op" | "cmv";
export const CHAVES_CUSTO: ChaveCusto[] = ["mk", "fn", "rh", "op", "cmv"];
export const AREA_DE_CUSTO: Record<ChaveCusto, AreaEnvio> = { mk: "marketing", fn: "financeiro", rh: "rh", op: "operacao", cmv: "cmv" };
export const LABEL_AREA: Record<AreaEnvio, string> = { marketing: "Marketing", financeiro: "Financeiro", rh: "RH", operacao: "Operação", cmv: "CMV" };

export interface Consolidado {
  r: number;
  margin: number;
  profit: number;
  cmvReal: number;
  cmvDev: number;
  mkSpend: number;
  financeAbs: number;
  rhCost: number;
  opCost: number;
  cmvCost: number;
  pctCosts: number;
  otherOps: number;
  healthy: Record<ChaveCusto, number>;
  actual: Record<ChaveCusto, number>;
  saving: number;
  util: number;
  controlado: number;
  estrutural: number;
  ultimo: Record<AreaEnvio, EntryDoc | null>;
  hoje: string;
  salarios: Salario[];
}

function freelancerAprovadoMes(dados: DadosPlanilha, mesKey: string) {
  const resp = payloadDe<FreelancerRequestsResp>(dados, "getFreelancerRequests");
  return (resp?.items ?? [])
    .filter((item) => item.status === "aprovado" && item.attendance !== "faltou" && String(item.date || "").slice(0, 7) === mesKey)
    .reduce((soma, item) => soma + (Number(item.totalCost) || 0), 0);
}

function v(doc: EntryDoc | null, chave: string, padrao: number) {
  return valorDe(doc, chave) ?? padrao;
}

/** computeMaster do painel do Renato, lendo tudo do espelho da planilha. */
export function consolidar(dados: DadosPlanilha): Consolidado {
  const hoje = hojeSp();
  const ultimo = ultimoPorArea(dados);
  const overview = lerOverview(dados);
  const fin = ultimo.financeiro;
  const mk = ultimo.marketing;
  const rh = ultimo.rh;
  const op = ultimo.operacao;
  const cmv = ultimo.cmv;
  const r = overview && overview.monthRevenue != null ? overview.monthRevenue : v(fin, "fnRevenueInput", BASE.revenue);
  const cmvFoodMix = v(cmv, "cmvFoodMix", 30);
  const cmvFoodTheo = v(cmv, "cmvFoodTheo", 25.14);
  const cmvFoodReal = v(cmv, "cmvFoodReal", 25.14);
  const cmvBevTheo = v(cmv, "cmvBevTheo", 21.24);
  const cmvBevReal = v(cmv, "cmvBevReal", 21.24);
  const cmvTheo = (cmvFoodTheo * cmvFoodMix) / 100 + (cmvBevTheo * (100 - cmvFoodMix)) / 100;
  const cmvReal = (cmvFoodReal * cmvFoodMix) / 100 + (cmvBevReal * (100 - cmvFoodMix)) / 100;
  const cmvDev = cmvReal - cmvTheo;
  const fnTax = v(fin, "fnTax", BASE.tax);
  const fnCard = v(fin, "fnCard", BASE.card);
  const fnFee = v(fin, "fnFee", BASE.fee);
  const fnIncomeTax = v(fin, "fnIncomeTax", BASE.incomeTax);
  const pctCosts = (r * (fnTax + fnCard + fnFee + fnIncomeTax)) / 100;
  const cmvCost = (r * cmvReal) / 100;
  const mkSpend = v(mk, "mkTraffic", BASE.traffic) + v(mk, "mkOther", BASE.marketingOther) + v(mk, "mkAttractions", BASE.attractions);
  const fnEnergy = v(fin, "fnEnergy", 10000);
  const fnWater = v(fin, "fnWater", 6000);
  const fnGas = v(fin, "fnGas", 3337);
  const fnRent = v(fin, "fnRent", BASE.rent);
  const financeAbs = fnRent + fnEnergy + fnWater + fnGas + v(fin, "fnDisposable", BASE.disposable) + v(fin, "fnSecurity", BASE.security) + v(fin, "fnAdminFixed", BASE.adminFixed) + v(fin, "fnFinanceOther", BASE.financeOther);
  const rhCost = v(rh, "rhCore", BASE.coreHr) + v(rh, "rhExtras", BASE.extras) + freelancerAprovadoMes(dados, hoje.slice(0, 7));
  const opMaintenance = v(op, "opMaintenance", 0);
  const opCost = v(op, "opLoss", 0) + opMaintenance;
  const otherOps = Math.max(BASE.otherOps, r * 0.027);
  const total = pctCosts + cmvCost + mkSpend + financeAbs + rhCost + opCost + otherOps;
  const profit = r - total;
  const margin = r ? (profit / r) * 100 : 0;
  const healthy: Record<ChaveCusto, number> = {
    mk: Math.max(4500, r * HEALTHY.trafficRate) + HEALTHY.marketingOther + r * HEALTHY.attractionRate,
    fn: fnRent + Math.max(18000, r * 0.03) + r * HEALTHY.disposableRate + r * HEALTHY.securityRate + HEALTHY.adminFixed + HEALTHY.financeOther,
    rh: r * (HEALTHY.coreHrRate + HEALTHY.extrasRate),
    op: r * HEALTHY.lossRate + Math.max(0, opMaintenance),
    cmv: (r * HEALTHY.cmvPct) / 100,
  };
  const actual: Record<ChaveCusto, number> = { mk: mkSpend, fn: financeAbs, rh: rhCost, op: opCost, cmv: cmvCost };
  const saving = CHAVES_CUSTO.reduce((soma, chave) => soma + (healthy[chave] - actual[chave]), 0);
  const salarios = payloadDe<SalariesResp>(dados, "getSalaries")?.rows ?? [];
  return {
    r, margin, profit, cmvReal, cmvDev, mkSpend, financeAbs, rhCost, opCost, cmvCost, pctCosts, otherOps, healthy, actual, saving,
    util: fnEnergy + fnWater + fnGas,
    controlado: mkSpend + financeAbs + rhCost + opCost + cmvCost,
    estrutural: pctCosts + otherOps,
    ultimo, hoje, salarios,
  };
}

/** scoreOf do painel: 1 + (meta − real) ÷ meta, entre 0 e 1,25. */
export function scoreArea(c: Consolidado, chave: ChaveCusto) {
  return Math.max(0, Math.min(1.25, 1 + (c.healthy[chave] - c.actual[chave]) / Math.max(1, c.healthy[chave])));
}

/**
 * O espelho já trouxe a visão geral de faturamento? Antes disso o painel mostra "Carregando…",
 * não a BASE (o Renato reportou a média de referência como "número fictício" quando aparecia antes do dado real).
 */
export function consolidadoPronto(dados: DadosPlanilha) {
  return Boolean(dados["getRevenueOverview"]);
}
