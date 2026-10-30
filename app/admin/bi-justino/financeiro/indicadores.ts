// Contas da página Financeiro — iguais ao HTML do Renato (calcAllDrafts, bloco "Financeiro", e applyDreValues).
import { HEALTHY, alerta, brl, pct, statusCost, type Alerta, type EntryDoc, type MapasZig } from "./comum";
import type { MasterLite } from "./master";

/** DRE_FIELD_CONFIG do HTML: campo da DRE → campo do formulário; os 4 primeiros são % do faturamento. */
export const CAMPOS_DRE = [
  { dre: "tax", campo: "fnTax", rotulo: "Total Impostos S/ Faturamento", pct: true },
  { dre: "card", campo: "fnCard", rotulo: "Taxas de Cartões", pct: true },
  { dre: "fee", campo: "fnFee", rotulo: "Administração/Gestão", pct: true },
  { dre: "incomeTax", campo: "fnIncomeTax", rotulo: "IRPJ + CSLL", pct: true },
  { dre: "rent", campo: "fnRent", rotulo: "Aluguel Bar + IPTU", pct: false },
  { dre: "energy", campo: "fnEnergy", rotulo: "Energia Elétrica", pct: false },
  { dre: "water", campo: "fnWater", rotulo: "Água / Esgoto", pct: false },
  { dre: "gas", campo: "fnGas", rotulo: "Gás", pct: false },
  { dre: "disposable", campo: "fnDisposable", rotulo: "Descartáveis", pct: false },
  { dre: "security", campo: "fnSecurity", rotulo: "Segurança Noturna e Diurna / Rádios", pct: false },
  { dre: "adminFixed", campo: "fnAdminFixed", rotulo: "Despesas Administrativas", pct: false },
  { dre: "financeOther", campo: "fnFinanceOther", rotulo: "Outras Despesas/Itens Extraordinários", pct: false },
] as const;

export type CampoFin = (typeof CAMPOS_DRE)[number]["campo"];
export const CAMPOS_FIN: CampoFin[] = CAMPOS_DRE.map((c) => c.campo);

export interface DrePayload {
  ok: boolean;
  mes?: string;
  values?: Record<string, number | string | null>;
  pctFallback?: Record<string, number | string | null>;
  /** getDreBase: mês gravado por campo. */
  mesPorCampo?: Record<string, string>;
  /** getDreParaMes: campos que vieram de outro mês e os que não foram achados. */
  fallbacks?: Record<string, string>;
  naoAchados?: string[];
}

export interface ValorDre {
  /** Valor que entra no formulário (R$ ou %, igual ao input do HTML). */
  valor: number;
  /** Valor em R$ na DRE (texto "Valor na DRE"). */
  valorDre: number;
  /** % do faturamento (só nos 4 campos de %). */
  pctFaturamento: number | null;
}

/** Faturamento bruto acumulado do mês selecionado (applyZigRevenueForSelectedDate). */
export function faturamentoDoMes(zig: MapasZig, mk: string) {
  return Object.keys(zig.revenue).reduce((s, d) => (d.slice(0, 7) === mk ? s + (zig.revenue[d] || 0) : s), 0);
}

/**
 * applyDreValues do HTML: converte os valores da DRE em valores de formulário. Campos de % dependem do
 * faturamento do mês (ou do pctFallback quando o mês não tem lançamento).
 */
export function valoresDaDre(dre: DrePayload | null, faturamento: number, salvo: EntryDoc | null): Record<CampoFin, ValorDre | null> {
  const saida = {} as Record<CampoFin, ValorDre | null>;
  const values = dre?.values || {};
  const pctFb = dre?.pctFallback || {};
  CAMPOS_DRE.forEach((cfg) => {
    const bruto = values[cfg.dre];
    if (bruto == null || bruto === "") {
      const guardado = salvo?.values?.[cfg.campo];
      saida[cfg.campo] = guardado == null ? null : { valor: Number(guardado) || 0, valorDre: Number(guardado) || 0, pctFaturamento: cfg.pct ? Number(guardado) || 0 : null };
      return;
    }
    const valorRS = Number(bruto) || 0;
    if (!cfg.pct) {
      saida[cfg.campo] = { valor: valorRS, valorDre: valorRS, pctFaturamento: null };
      return;
    }
    const fb = pctFb[cfg.dre];
    if (fb != null && fb !== "") {
      saida[cfg.campo] = { valor: Number(fb) || 0, valorDre: valorRS, pctFaturamento: Number(fb) || 0 };
      return;
    }
    if (!(faturamento > 0)) {
      saida[cfg.campo] = { valor: 0, valorDre: valorRS, pctFaturamento: null };
      return;
    }
    const p = (valorRS / faturamento) * 100;
    saida[cfg.campo] = { valor: p, valorDre: valorRS, pctFaturamento: p };
  });
  return saida;
}

export function numeroDoCampo(valores: Record<CampoFin, ValorDre | null>, campo: CampoFin) {
  return valores[campo]?.valor ?? 0;
}

/** Aviso de campos vindos de outro mês (avisoDreFallback) e campos não achados (loadDreForMonth). */
export function avisosDre(dre: DrePayload | null, mesLabel: string) {
  if (!dre) return { fallback: "", naoAchados: "" };
  let fb: Record<string, string> = dre.fallbacks || {};
  if (!dre.fallbacks && dre.mesPorCampo) {
    const cont: Record<string, number> = {};
    Object.values(dre.mesPorCampo).forEach((m) => { if (m) cont[m] = (cont[m] || 0) + 1; });
    const principal = Object.keys(cont).sort((a, b) => cont[b] - cont[a])[0] || "";
    fb = {};
    Object.entries(dre.mesPorCampo).forEach(([c, m]) => { if (m && principal && m !== principal) fb[c] = m; });
  }
  const rotulo = (c: string) => CAMPOS_DRE.find((x) => x.dre === c)?.rotulo || c;
  const campos = Object.keys(fb);
  const fallback = campos.length
    ? `⚠️ Sem lançamento na DRE de ${mesLabel} para: ${campos.map((c) => `${rotulo(c)} (usando ${fb[c]})`).join(", ")}. O valor mostrado é o do último mês que tem dado.`
    : "";
  const naoAchados = dre.naoAchados && dre.naoAchados.length
    ? `⚠️ Não achei na DRE de ${mesLabel}: ${dre.naoAchados.map(rotulo).join(", ")} — confira se essas linhas existem/têm valor nesse mês na planilha. Os demais campos foram atualizados normalmente.`
    : "";
  return { fallback, naoAchados };
}

export interface KpisFinanceiro {
  rFn: number;
  fnUtil: number;
  financeAbs: number;
  fnTarget: number;
  fnImpact: number;
  fnScore: number;
  fnCard: number;
  barras: { label: string; value: number }[];
  alertas: Alerta[];
}

/** Bloco "Financeiro" de calcAllDrafts. */
export function kpisFinanceiro(m: MasterLite, valores: Record<CampoFin, ValorDre | null>): KpisFinanceiro {
  const n = (campo: CampoFin) => numeroDoCampo(valores, campo);
  const rFn = m.r;
  const fnUtil = n("fnEnergy") + n("fnWater") + n("fnGas");
  const financeAbs = n("fnRent") + n("fnEnergy") + n("fnWater") + n("fnGas") + n("fnDisposable") + n("fnSecurity") + n("fnAdminFixed") + n("fnFinanceOther");
  const fnTarget = n("fnRent") + Math.max(18000, rFn * 0.03) + rFn * HEALTHY.disposableRate + rFn * HEALTHY.securityRate + HEALTHY.adminFixed + HEALTHY.financeOther;
  const fnImpact = fnTarget - financeAbs;
  const fnScore = Math.max(0, Math.min(1.25, 1 + fnImpact / Math.max(1, fnTarget)));
  const barras = [
    { label: "Aluguel Bar + IPTU", value: n("fnRent") },
    { label: "Energia Elétrica", value: n("fnEnergy") },
    { label: "Água / Esgoto", value: n("fnWater") },
    { label: "Gás", value: n("fnGas") },
    { label: "Descartáveis", value: n("fnDisposable") },
    { label: "Segurança Noturna e Diurna / Rádios", value: n("fnSecurity") },
    { label: "Despesas Administrativas", value: n("fnAdminFixed") },
    { label: "Outras Despesas/Itens Extraordinários", value: n("fnFinanceOther") },
  ];
  const alertas = [
    alerta("Cartões", pct(n("fnCard")), statusCost(n("fnCard"), 2.1, 2.4)),
    alerta("Utilidades", brl(fnUtil), statusCost(fnUtil, Math.max(18000, rFn * 0.03), Math.max(22000, rFn * 0.04))),
    alerta("Descartáveis", brl(n("fnDisposable")), statusCost(n("fnDisposable"), rFn * 0.015, rFn * 0.02)),
    alerta("Administrativo fixo", brl(n("fnAdminFixed")), statusCost(n("fnAdminFixed"), 25000, 30000)),
  ];
  return { rFn, fnUtil, financeAbs, fnTarget, fnImpact, fnScore, fnCard: n("fnCard"), barras, alertas };
}
