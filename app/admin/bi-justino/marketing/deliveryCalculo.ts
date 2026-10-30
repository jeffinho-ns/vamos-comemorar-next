import type { PorData } from "./espelhoDados";

/** deliRender do painel do Renato (Delivery por plataforma). */

export const DELI_NOMES: Record<string, string> = { IFOOD: "iFood", RAPPI: "Rappi", UBER: "Uber", "DELIVERY ONLINE": "Delivery Online", APP: "App ZigPay" };
export const PLATAFORMAS = Object.keys(DELI_NOMES);
export const PERIODOS = [14, 30, 60, 90, 150] as const;

export interface LinhaDelivery { date: string; plataforma: string; valor: number }

function isoMenos(iso: string, dias: number) {
  return new Date(new Date(`${iso}T12:00:00`).getTime() - dias * 86400000).toISOString().slice(0, 10);
}

export function resumoDelivery(rows: LinhaDelivery[], dias: number, zigRevenue: PorData) {
  if (!rows.length) return null;
  const datas = [...new Set(rows.map((r) => r.date))].sort();
  const fim = datas[datas.length - 1];
  const ini = isoMenos(fim, dias - 1);
  const iniAnt = isoMenos(ini, dias);
  const noPer = rows.filter((r) => r.date >= ini && r.date <= fim);
  const ant = rows.filter((r) => r.date >= iniAnt && r.date < ini);
  const soma = (rs: LinhaDelivery[], p: string) => rs.filter((r) => r.plataforma === p).reduce((s, r) => s + r.valor, 0);
  const diasPer = [...new Set(noPer.map((r) => r.date))];
  const fat = diasPer.reduce((s, d) => s + (zigRevenue[d] || 0), 0);
  const semApp = PLATAFORMAS.filter((p) => p !== "APP");
  const totDeli = semApp.reduce((s, p) => s + soma(noPer, p), 0);
  const totApp = soma(noPer, "APP");
  const totAntDeli = semApp.reduce((s, p) => s + soma(ant, p), 0);
  const totAntApp = soma(ant, "APP");
  const diasDeli = diasPer.filter((d) => semApp.some((p) => noPer.some((r) => r.date === d && r.plataforma === p && r.valor > 0))).length;
  const porPlataforma = PLATAFORMAS.map((p) => {
    const v = soma(noPer, p);
    const a = soma(ant, p);
    const melhor = noPer.filter((r) => r.plataforma === p && r.valor > 0).sort((x, y) => y.valor - x.valor)[0] ?? null;
    return { plataforma: p, nome: DELI_NOMES[p], valor: v, anterior: a, melhor };
  });
  const meses = [...new Set(rows.map((r) => r.date.slice(0, 7)))].sort().reverse().map((m) => {
    const rs = rows.filter((r) => r.date.startsWith(m));
    return { mes: m, valores: PLATAFORMAS.map((p) => soma(rs, p)), diasLidos: new Set(rs.map((r) => r.date)).size };
  });
  const comVenda = diasPer.filter((d) => PLATAFORMAS.some((p) => noPer.some((r) => r.date === d && r.plataforma === p && r.valor > 0))).sort().reverse().map((d) => ({
    dia: d,
    valores: PLATAFORMAS.map((p) => noPer.filter((r) => r.date === d && r.plataforma === p).reduce((s, r) => s + r.valor, 0)),
  }));
  return { ini, fim, fat, totDeli, totApp, totAntDeli, totAntApp, diasDeli, nDias: diasPer.length, porPlataforma, meses, comVenda };
}

export function pctDe(a: number, b: number) {
  return b > 0 ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "—";
}

export function variacao(a: number, b: number) {
  if (!(b > 0)) return "sem período anterior";
  const p = ((a - b) / b) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(0)}% vs período anterior`;
}

export function dBR(d: string) {
  return d.split("-").reverse().join("/");
}
