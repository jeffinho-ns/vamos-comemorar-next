import type { PorData } from "./espelhoDados";

/** deliRender do painel do Renato (Delivery por plataforma). */

export const DELI_NOMES: Record<string, string> = { IFOOD: "iFood", RAPPI: "Rappi", UBER: "Uber", "DELIVERY ONLINE": "Delivery Online", APP: "App ZigPay" };
export const PLATAFORMAS = Object.keys(DELI_NOMES);
export const PERIODOS = [14, 30, 60, 90, 150] as const;

export interface LinhaDelivery { date: string; plataforma: string; valor: number }

function isoValido(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso);
}

function isoMenos(iso: string, dias: number) {
  const t = new Date(`${iso}T12:00:00`).getTime();
  if (!Number.isFinite(t)) return iso;
  return new Date(t - dias * 86400000).toISOString().slice(0, 10);
}

/** Aceita o formato da planilha (`[data, plataforma, valor]`) ou o objeto já normalizado. */
export function linhasDelivery(bruto: unknown): LinhaDelivery[] {
  const obj = bruto && typeof bruto === "object" ? (bruto as Record<string, unknown>) : null;
  const raw = obj && Array.isArray(obj.rows) ? obj.rows : Array.isArray(bruto) ? bruto : [];
  const saida: LinhaDelivery[] = [];
  for (const item of raw) {
    const date = Array.isArray(item) ? String(item[0] || "") : String((item as { date?: string })?.date || "");
    const plataforma = Array.isArray(item) ? String(item[1] || "") : String((item as { plataforma?: string })?.plataforma || "");
    const valor = Array.isArray(item) ? Number(item[2]) || 0 : Number((item as { valor?: number })?.valor) || 0;
    const dia = date.slice(0, 10);
    if (!isoValido(dia) || !plataforma) continue;
    saida.push({ date: dia, plataforma, valor });
  }
  return saida;
}

export function resumoDelivery(rows: LinhaDelivery[], dias: number, zigRevenue: PorData) {
  const validas = rows.filter((r) => isoValido(r.date));
  if (!validas.length) return null;
  const datas = [...new Set(validas.map((r) => r.date))].sort();
  const fim = datas[datas.length - 1];
  const ini = isoMenos(fim, dias - 1);
  const iniAnt = isoMenos(ini, dias);
  const noPer = validas.filter((r) => r.date >= ini && r.date <= fim);
  const ant = validas.filter((r) => r.date >= iniAnt && r.date < ini);
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
  const meses = [...new Set(validas.map((r) => r.date.slice(0, 7)))].sort().reverse().map((m) => {
    const rs = validas.filter((r) => r.date.startsWith(m));
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
