// Mesma base do painel do Renato (BASE = DRE validada, decisão de 24/09/2026):
// custo fixo do mês rateado pelos dias abertos (sem segunda) e custo variável
// (impostos + cartão + fee + CMV real) aplicado sobre o faturamento projetado.
export const BASE_DRE = {
  cmvPct: 20.09,
  tax: 3.86,
  card: 2.11,
  fee: 7,
  rent: 51613,
  disposable: 7113,
  security: 7979,
  coreHr: 104744,
  adminFixed: 27671,
  financeOther: 3208,
  energia: 10000,
  agua: 6000,
  gas: 3337,
};

export type MargemDia = {
  diasNoMes: number;
  segundas: number;
  diasAbertos: number;
  custoFixoMensal: number;
  custoFixoDia: number;
  custoVarPct: number;
  custoVarEstimado: number;
  custoTotalDia: number;
  resultado: number;
  margemPct: number | null;
  nivel: "g" | "y" | "r";
  selo: string;
};

export function margemDoDia(dataIso: string, faturamento: number, gastoMarketing: number, cmvReal: number | null | undefined): MargemDia {
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(dataIso);
  const hoje = new Date();
  const ano = valida ? Number(dataIso.slice(0, 4)) : hoje.getFullYear();
  const mes = valida ? Number(dataIso.slice(5, 7)) : hoje.getMonth() + 1;
  const diasNoMes = new Date(ano, mes, 0).getDate();
  let segundas = 0;
  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    if (new Date(ano, mes - 1, dia).getDay() === 1) segundas += 1;
  }
  const diasAbertos = Math.max(1, diasNoMes - segundas);
  const b = BASE_DRE;
  const custoFixoMensal = b.rent + b.energia + b.agua + b.gas + b.disposable + b.security + b.adminFixed + b.financeOther + b.coreHr;
  const custoFixoDia = custoFixoMensal / diasAbertos;
  const custoVarPct = b.tax + b.card + b.fee + (cmvReal ?? b.cmvPct);
  const custoVarEstimado = (faturamento * custoVarPct) / 100;
  const custoTotalDia = custoFixoDia + custoVarEstimado + gastoMarketing;
  const resultado = faturamento - custoTotalDia;
  const margemPct = faturamento > 0 ? (resultado / faturamento) * 100 : null;
  const nivel = margemPct == null ? "y" : margemPct >= 10 ? "g" : margemPct >= 0 ? "y" : "r";
  const selo = margemPct == null ? "ATENÇÃO" : nivel === "g" ? "COMPENSA ABRIR" : nivel === "y" ? "NO LIMITE" : "NÃO COMPENSA";
  return { diasNoMes, segundas, diasAbertos, custoFixoMensal, custoFixoDia, custoVarPct, custoVarEstimado, custoTotalDia, resultado, margemPct, nivel, selo };
}
