// Contas da aba CMV — iguais ao HTML do Renato (revisão do CMV de 19/10: dia válido/suspeito, auditoria, KPIs e alertas).
import { alerta, brl, fmtDate, pct, statusCost, statusHigh, todayStr, type Alerta, type MapasZig, type Nivel } from "../financeiro/comum";
import { addDias } from "../marketing/numeros";

export interface CmvDoc {
  date: string;
  custoFoodTeorico: number;
  valorCobertoFood: number;
  valorTotalFood: number;
  custoBevTeorico: number;
  valorCobertoBev: number;
  valorTotalBev: number;
  valorTotalMisto: number;
  itensComFicha: number;
  itensSemFicha: number;
  cmvFoodPctSobreCobertura: number | null;
  cmvBevPctSobreCobertura: number | null;
  coberturaFoodPct: number | null;
  coberturaBevPct: number | null;
  coberturaTotalPct: number | null;
  suspeito?: boolean;
}
export interface CmvPayload { ok: boolean; docs?: CmvDoc[]; latest?: CmvDoc | null }

export interface ItemRanking { nome: string; categoria: string; tipo: string; quantidade: number; valorTotal: number; cmvPct: number | null }
export interface ItemAbc { nome: string; valorTotal: number; pctAcumulado: number; classe: string }
export interface RankingPayload {
  ok: boolean;
  days?: number;
  top6BebidaVenda?: ItemRanking[];
  top6ComidaVenda?: ItemRanking[];
  top6BebidaCmv?: ItemRanking[];
  top6ComidaCmv?: ItemRanking[];
  curvaAbc?: ItemAbc[];
  totalGeral?: number;
  semFicha?: ItemRanking[];
}

export function cmvDocTotal(d: CmvDoc) {
  return (Number(d.valorTotalFood) || 0) + (Number(d.valorTotalBev) || 0);
}
export function cmvDocCoberto(d: CmvDoc) {
  return (Number(d.valorCobertoFood) || 0) + (Number(d.valorCobertoBev) || 0);
}
/** Venda por item ÷ faturamento do dia acima de 2× (ou venda relevante sem faturamento) = dia não confiável. */
export function cmvDocSuspeito(d: CmvDoc, revenue: Record<string, number>) {
  if (d.suspeito) return true;
  const rev = Number(revenue[d.date]) || 0;
  const t = cmvDocTotal(d);
  if (rev > 0) return t / rev > 2;
  return t > 1000;
}
export function cmvDocValido(d: CmvDoc, revenue: Record<string, number>) {
  return cmvDocCoberto(d) > 0 && cmvDocTotal(d) >= 1000 && !cmvDocSuspeito(d, revenue);
}
export function cmvDocsValidos(docs: CmvDoc[], revenue: Record<string, number>) {
  return docs.filter((d) => cmvDocValido(d, revenue));
}

/** renderCmvAuditoria: dias suspeitos, dias de volume baixo e dias com faturamento sem CMV (últimos 21 dias). */
export function auditoriaCmv(docs: CmvDoc[], zig: MapasZig): string[] {
  const linhas: string[] = [];
  const suspeitos = docs.filter((d) => cmvDocTotal(d) > 0 && cmvDocSuspeito(d, zig.revenue));
  if (suspeitos.length) {
    linhas.push(`⚠️ Dados suspeitos (fora dos cálculos): ${suspeitos.map((d) => `${fmtDate(d.date)} — venda por item ${brl(cmvDocTotal(d))} × faturamento ${brl(zig.revenue[d.date] || 0)}`).join(" • ")}`);
  }
  const pequenos = docs.filter((d) => cmvDocTotal(d) > 0 && cmvDocTotal(d) < 1000 && !cmvDocSuspeito(d, zig.revenue));
  if (pequenos.length) linhas.push(`ℹ️ Dias de volume muito baixo (< R$ 1.000 de venda por item, não usados nos KPIs): ${pequenos.map((d) => fmtDate(d.date)).join(", ")}`);
  const hoje = todayStr();
  const temDoc: Record<string, CmvDoc> = {};
  docs.forEach((d) => { temDoc[d.date] = d; });
  const faltam: string[] = [];
  for (let i = 1; i <= 21; i += 1) {
    const dt = addDias(hoje, -i);
    const rev = Number(zig.revenue[dt]) || 0;
    if (rev >= 1000 && (!temDoc[dt] || cmvDocTotal(temDoc[dt]) === 0)) faltam.push(`${fmtDate(dt)} (${brl(rev)})`);
  }
  if (faltam.length) linhas.push(`❌ Dias com faturamento e sem CMV capturado (últimos 21 dias): ${faltam.join(" • ")}. Dá pra reprocessar com o robô (-BackfillFrom/-BackfillTo).`);
  return linhas.length ? linhas : ["✅ Nenhuma inconsistência encontrada nos últimos dias capturados."];
}

export function fmtPctOuTraco(p: number | null | undefined) {
  return p == null ? "—" : pct(p);
}

/** Cor da badge de cobertura: verde ≥50%, amarelo 20–50%, vermelho <20%. */
export function nivelCobertura(cob: number | null | undefined): Nivel | "" {
  if (cob == null) return "";
  return cob >= 50 ? "g" : cob >= 20 ? "y" : "r";
}

export interface KpisCmv {
  foodPct: number | null;
  bevPct: number | null;
  coberturaPct: number | null;
  blend: number | null;
  alertasComida: Alerta[];
  alertasBebida: Alerta[];
}

/** Bloco "Márcio / CMV" de calcAllDrafts (cmvParcialLatest = dia válido mais recente). */
export function kpisCmv(cp: CmvDoc | null): KpisCmv {
  const foodPct = cp && cp.cmvFoodPctSobreCobertura != null ? cp.cmvFoodPctSobreCobertura : null;
  const bevPct = cp && cp.cmvBevPctSobreCobertura != null ? cp.cmvBevPctSobreCobertura : null;
  const coberturaPct = cp && cp.coberturaTotalPct != null ? cp.coberturaTotalPct : null;
  const blend = cp && cp.valorCobertoFood + cp.valorCobertoBev > 0
    ? ((cp.custoFoodTeorico + cp.custoBevTeorico) / (cp.valorCobertoFood + cp.valorCobertoBev)) * 100
    : null;
  const semDado = alerta("Sem dado do robô ainda", "—", ["y", "ATENÇÃO"], "Nenhum CMV teórico parcial capturado.");
  const cfPct = cp ? cp.coberturaFoodPct : null;
  const cbPct = cp ? cp.coberturaBevPct : null;
  const alertasComida = !cp ? [semDado] : [
    alerta("CMV teórico (sobre o coberto)", fmtPctOuTraco(foodPct), foodPct != null ? statusCost(foodPct, 25.1, 28) : ["y", "SEM COBERTURA"]),
    alerta("Cobertura de ficha técnica", fmtPctOuTraco(cfPct), cfPct != null ? statusHigh(cfPct, 50, 20) : ["r", "SEM DADO"]),
  ];
  const alertasBebida = !cp ? [semDado] : [
    alerta("CMV teórico (sobre o coberto)", fmtPctOuTraco(bevPct), bevPct != null ? statusCost(bevPct, 21.2, 24) : ["y", "SEM COBERTURA"]),
    alerta("Cobertura de ficha técnica", fmtPctOuTraco(cbPct), cbPct != null ? statusHigh(cbPct, 50, 20) : ["r", "SEM DADO"]),
  ];
  return { foodPct, bevPct, coberturaPct, blend, alertasComida, alertasBebida };
}
