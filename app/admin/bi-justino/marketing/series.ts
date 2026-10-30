import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { MkAtual, ZigPorData } from "./espelhoDados";
import type { DreHistoricoResp, ZigHourlyDetailResp, ZigHourlyResp } from "./espelhoTipos";
import { addDias, hojeSp, segundaDe } from "./numeros";

/** Séries derivadas do espelho, nas mesmas contas do painel do Renato. */

export type PontoGasto = { rotulo: string; gasto: number; receita: number };

/** mkTrendChartWrap: últimos 30 envios do Marketing — receita atribuída = (comparecimento + passantes) × ticket. */
export function pontosGastoReceita(mkAtual: Record<string, MkAtual>): PontoGasto[] {
  return Object.keys(mkAtual).sort().slice(-30).map((data) => ({
    rotulo: `${data.slice(8, 10)}/${data.slice(5, 7)}`,
    gasto: mkAtual[data].spend || 0,
    receita: mkAtual[data].revenue || 0,
  }));
}

export interface SemanaZig { inicio: string; rev: number; revComPub: number; pub: number }

/** renderSemanalTrends: 26 semanas fechadas (segunda a domingo) antes da semana corrente. */
export function semanasSeisMeses(zig: ZigPorData): SemanaZig[] {
  const segAtual = segundaDe(hojeSp());
  const inicio = addDias(segAtual, -26 * 7);
  const porSem: Record<string, SemanaZig> = {};
  for (const data of Object.keys(zig.revenue)) {
    const wk = segundaDe(data);
    if (wk >= segAtual || wk < inicio) continue;
    const o = porSem[wk] || (porSem[wk] = { inicio: wk, rev: 0, revComPub: 0, pub: 0 });
    const rev = Number(zig.revenue[data]) || 0;
    o.rev += rev;
    const pub = zig.publico[data];
    if (pub != null && Number(pub) > 0 && rev > 0) {
      o.pub += Number(pub);
      o.revComPub += rev;
    }
  }
  return Object.keys(porSem).filter((chave) => porSem[chave].rev > 0).sort().map((chave) => porSem[chave]);
}

/** Histórico da DRE: só meses até o corrente (a DRE já tem colunas futuras preenchidas). */
export function pontosDre(dados: DadosPlanilha) {
  const resp = payloadDe<DreHistoricoResp>(dados, "getDreFaturamentoHistorico");
  const mesAtual = hojeSp().slice(0, 7);
  return { resp, serie: (resp?.serie ?? []).filter((item) => item.mes <= mesAtual) };
}

export const PADRAO_SEMANAL_DESDE = "2026-07-01";
export const DIAS_SEMANA_ORDEM = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_LABEL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export interface LinhaPadrao { wd: number; label: string; nDias: number; fatMedio: number; pubMedio: number | null; ticketMedio: number | null }

/** renderPadraoSemanalBase: média por dia da semana desde 01/07/2026, dia fechado (zero) fica de fora. */
export function padraoSemanal(zig: ZigPorData): LinhaPadrao[] | null {
  const datas = Object.keys(zig.revenue).filter((data) => data >= PADRAO_SEMANAL_DESDE).sort();
  if (!datas.length) return null;
  const porDia: Record<number, { somaRev: number; somaPub: number; nDias: number; nComPublico: number }> = {};
  DIAS_SEMANA_ORDEM.forEach((wd) => {
    porDia[wd] = { somaRev: 0, somaPub: 0, nDias: 0, nComPublico: 0 };
  });
  for (const data of datas) {
    const rev = zig.revenue[data] || 0;
    if (rev <= 0) continue;
    const wd = new Date(`${data}T12:00:00`).getDay();
    const pub = zig.publico[data];
    porDia[wd].somaRev += rev;
    porDia[wd].nDias += 1;
    if (pub != null && pub > 0) {
      porDia[wd].somaPub += pub;
      porDia[wd].nComPublico += 1;
    }
  }
  return DIAS_SEMANA_ORDEM.map((wd) => {
    const d = porDia[wd];
    return {
      wd,
      label: WEEKDAY_LABEL[wd].slice(0, 3),
      nDias: d.nDias,
      fatMedio: d.nDias ? d.somaRev / d.nDias : 0,
      pubMedio: d.nComPublico ? d.somaPub / d.nComPublico : null,
      ticketMedio: d.somaPub > 0 ? d.somaRev / d.somaPub : null,
    };
  });
}

export interface Bucket { date: string; start: string; value: number }

/** zigUtcToLocalIso: a ZigPay manda o horário em UTC; o painel converte para Brasília (UTC-3). */
export function utcParaLocal(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return s;
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - 3 * 3600000);
  return `${t.toISOString().slice(0, 16)}:00.000`;
}

export function bucketsHorario(dados: DadosPlanilha): Bucket[] {
  const resp = payloadDe<ZigHourlyResp>(dados, "getZigHourly");
  return (resp?.items ?? []).map((item) => ({ date: item.date, start: utcParaLocal(item.start), value: Number(item.value) || 0 }));
}

export interface BucketDetalhe { date: string; start: string; entradas: number }

export function bucketsDetalhe(dados: DadosPlanilha): BucketDetalhe[] {
  const resp = payloadDe<ZigHourlyDetailResp>(dados, "getZigHourlyDetail");
  return (resp?.items ?? []).map((item) => ({ date: item.date, start: utcParaLocal(item.start), entradas: Number(item.entries) || 0 }));
}

export const VENDA_HORARIO_CORES: Record<string, string> = {
  "1": "#3987e5", "2": "#d95926", "3": "#199e70", "4": "#c98500", "5": "#d55181", "6": "#008300", "0": "#9085e9", geral: "#e66767",
};

export interface SerieHorario { key: string; label: string; cor: string; valores: number[] }

/** renderVendaPorHorarioBase: média por bloco de 30 min por dia da semana (só dias com faturamento > 0), em reais. */
export function vendaPorHorario(buckets: Bucket[], zig: ZigPorData): { clocks: string[]; series: SerieHorario[] } | null {
  if (!buckets.length) return null;
  const porClockPorDia: Record<string, Record<number, { soma: number; n: number }>> = {};
  const clocksSet = new Set<string>();
  for (const b of buckets) {
    if ((zig.revenue[b.date] || 0) <= 0) continue;
    const wd = new Date(`${b.date}T12:00:00`).getDay();
    const clock = b.start.slice(11, 16);
    clocksSet.add(clock);
    const porDia = porClockPorDia[clock] || (porClockPorDia[clock] = {});
    const x = porDia[wd] || (porDia[wd] = { soma: 0, n: 0 });
    x.soma += b.value / 100;
    x.n += 1;
  }
  const clocks = [...clocksSet].sort();
  if (!clocks.length) return { clocks: [], series: [] };
  const series: SerieHorario[] = DIAS_SEMANA_ORDEM.map((wd) => ({
    key: String(wd),
    label: WEEKDAY_LABEL[wd],
    cor: VENDA_HORARIO_CORES[String(wd)],
    valores: clocks.map((c) => {
      const x = porClockPorDia[c]?.[wd];
      return x && x.n ? x.soma / x.n : 0;
    }),
  }));
  const geral = clocks.map((c) => {
    let soma = 0;
    let n = 0;
    DIAS_SEMANA_ORDEM.forEach((wd) => {
      const x = porClockPorDia[c]?.[wd];
      if (x && x.n) {
        soma += x.soma;
        n += x.n;
      }
    });
    return n ? soma / n : 0;
  });
  series.push({ key: "geral", label: "Geral", cor: VENDA_HORARIO_CORES.geral, valores: geral });
  return { clocks, series };
}
