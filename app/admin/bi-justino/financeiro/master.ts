// Resumo da Diretoria (computeMaster do HTML) reduzido ao que Financeiro/RH/CMV precisam:
// faturamento do mês (r) e margem da casa (margin) — base do "Economia vs meta" e do bônus.
import { BASE, HEALTHY, freelancerMonthlyApprovedCost, numero, todayStr, type EntryDoc, type FreelancerRequest, type RevenueOverviewPayload } from "./comum";

export interface MasterLite {
  r: number;
  margin: number;
  cmvReal: number;
  healthy: { mk: number; fn: number; rh: number; op: number; cmv: number };
  actual: { mk: number; fn: number; rh: number; op: number; cmv: number };
}

export interface EntradasPorArea {
  financeiro?: EntryDoc[] | null;
  marketing?: EntryDoc[] | null;
  rh?: EntryDoc[] | null;
  operacao?: EntryDoc[] | null;
  cmv?: EntryDoc[] | null;
}

function ultimo(docs: EntryDoc[] | null | undefined) {
  return docs && docs.length ? docs[0].values || {} : {};
}

/** `v ?? padrão` com o mesmo comportamento do HTML (null/undefined caem no padrão; 0 fica 0). */
function ou(v: number | string | null | undefined, padrao: number) {
  return v == null || v === "" ? padrao : numero(v);
}

export function calcularMaster(
  overview: RevenueOverviewPayload | null,
  entradas: EntradasPorArea,
  freelancers: FreelancerRequest[] | null,
): MasterLite {
  const finV = ultimo(entradas.financeiro);
  const mkV = ultimo(entradas.marketing);
  const rhV = ultimo(entradas.rh);
  const opV = ultimo(entradas.operacao);
  const cmvV = ultimo(entradas.cmv);

  const r = overview && overview.monthRevenue != null
    ? numero(overview.monthRevenue)
    : ou(finV.fnRevenueInput, BASE.revenue);
  const cmvFoodMix = ou(cmvV.cmvFoodMix, 30);
  const cmvFoodReal = ou(cmvV.cmvFoodReal, 25.14);
  const cmvBevReal = ou(cmvV.cmvBevReal, 21.24);
  const cmvReal = (cmvFoodReal * cmvFoodMix) / 100 + (cmvBevReal * (100 - cmvFoodMix)) / 100;

  const fnTax = ou(finV.fnTax, BASE.tax);
  const fnCard = ou(finV.fnCard, BASE.card);
  const fnFee = ou(finV.fnFee, BASE.fee);
  const fnIncomeTax = ou(finV.fnIncomeTax, BASE.incomeTax);
  const pctCosts = (r * (fnTax + fnCard + fnFee + fnIncomeTax)) / 100;
  const cmvCost = (r * cmvReal) / 100;
  const mkSpend = ou(mkV.mkTraffic, BASE.traffic) + ou(mkV.mkOther, BASE.marketingOther) + ou(mkV.mkAttractions, BASE.attractions);
  const financeAbs = ou(finV.fnRent, BASE.rent) + ou(finV.fnEnergy, 10000) + ou(finV.fnWater, 6000) + ou(finV.fnGas, 3337)
    + ou(finV.fnDisposable, BASE.disposable) + ou(finV.fnSecurity, BASE.security) + ou(finV.fnAdminFixed, BASE.adminFixed) + ou(finV.fnFinanceOther, BASE.financeOther);
  const rhCost = ou(rhV.rhCore, BASE.coreHr) + ou(rhV.rhExtras, BASE.extras) + freelancerMonthlyApprovedCost(freelancers, todayStr().slice(0, 7));
  const opCost = ou(opV.opLoss, 0) + ou(opV.opMaintenance, 0);
  const otherOps = Math.max(BASE.otherOps, r * 0.027);
  const total = pctCosts + cmvCost + mkSpend + financeAbs + rhCost + opCost + otherOps;
  const profit = r - total;
  const margin = r ? (profit / r) * 100 : 0;

  const healthy = {
    mk: Math.max(4500, r * HEALTHY.trafficRate) + HEALTHY.marketingOther + r * HEALTHY.attractionRate,
    fn: ou(finV.fnRent, BASE.rent) + Math.max(18000, r * 0.03) + r * HEALTHY.disposableRate + r * HEALTHY.securityRate + HEALTHY.adminFixed + HEALTHY.financeOther,
    rh: r * (HEALTHY.coreHrRate + HEALTHY.extrasRate),
    op: r * HEALTHY.lossRate + Math.max(0, ou(opV.opMaintenance, 0)),
    cmv: (r * HEALTHY.cmvPct) / 100,
  };
  const actual = { mk: mkSpend, fn: financeAbs, rh: rhCost, op: opCost, cmv: cmvCost };
  return { r, margin, cmvReal, healthy, actual };
}
