import { rotuloMes } from "../zigValor";
import type { EntryDoc, MkPlanDoc } from "./espelhoTipos";
import type { ZigPorData } from "./espelhoDados";
import { addDias, diasNoMes, hojeSp, numeroDe, segundaDe } from "./numeros";
import { BANDA_SUGESTOES_POR_DIA } from "./sugestaoAtracao";

const NOMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export type BudgetForm = {
  teto: string;
  cresc: string;
  mes: string;
  semana: string;
  baseManual: string;
  ticket: string;
  pax: string;
  part: string;
};

export const BUDGET_FORM_PADRAO: BudgetForm = { teto: "8", cresc: "0", mes: "", semana: "", baseManual: "", ticket: "", pax: "", part: "" };

export interface EntradaBudget {
  zig: ZigPorData;
  serieDre: { mes: string; valor: number }[];
  paxPorData: Record<string, number>;
  temPax: boolean;
  mkDocs: EntryDoc[];
  planos: Record<string, MkPlanDoc>;
}

function mesLongo(mk: string) {
  return `${MESES[Number(mk.slice(5, 7)) - 1]}/${mk.slice(0, 4)}`;
}

function baseMes(entrada: EntradaBudget, mk: string, manual: number | null) {
  if (manual != null && manual > 0) return { base: manual, fonte: "informado" };
  const ant = `${Number(mk.slice(0, 4)) - 1}-${mk.slice(5)}`;
  const x = entrada.serieDre.find((item) => item.mes === ant);
  if (x && x.valor > 0) return { base: x.valor, fonte: `DRE de ${mesLongo(ant)}` };
  return { base: null, fonte: null };
}

function somaAtracoes(docs: EntryDoc[], ini: string, fim: string) {
  return docs.filter((doc) => doc.date >= ini && doc.date <= fim).reduce((total, doc) => total + (numeroDe(doc.values?.mkAttractions as number | string | null | undefined) ?? 0), 0);
}

function somaPlano(planos: Record<string, MkPlanDoc>, ini: string, fim: string) {
  return Object.keys(planos).filter((d) => d >= ini && d <= fim).reduce((total, d) => total + (Number(planos[d].attractionsPlan) || 0), 0);
}

function paraDias(ini: string, fim: string, fn: (d: string) => void) {
  for (let d = ini; d <= fim; d = addDias(d, 1)) fn(d);
}

/** baRender do painel do Renato (Budget de atrações): mês, semana (bases A e B) e divisão por dia. */
export function montarBudget(entrada: EntradaBudget, form: BudgetForm) {
  const hoje = hojeSp();
  const tetoNum = numeroDe(form.teto);
  const teto = (tetoNum == null || tetoNum === 0 ? 8 : tetoNum) / 100;
  const cresc = (numeroDe(form.cresc) ?? 0) / 100;
  const mk = /^\d{4}-\d{2}$/.test(form.mes) ? form.mes : hoje.slice(0, 7);
  const manual = numeroDe(form.baseManual);
  const B = baseMes(entrada, mk, manual);
  const ini = `${mk}-01`;
  const fim = `${mk}-31`;
  const realMes = somaAtracoes(entrada.mkDocs, ini, fim);
  const planMes = somaPlano(entrada.planos, ini, fim);
  const fatMesReal = Object.keys(entrada.zig.revenue).filter((d) => d >= ini && d <= fim && d <= hoje).reduce((t, d) => t + (entrada.zig.revenue[d] || 0), 0);
  const baseAjustada = B.base == null ? null : B.base * (1 + cresc);
  const budgetMes = baseAjustada == null ? null : baseAjustada * teto;

  // semana
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(form.semana) ? form.semana : hoje;
  const seg = segundaDe(ref);
  const dom = addDias(seg, 6);
  const dias = [0, 1, 2, 3, 4, 5, 6].map((i) => addDias(seg, i));
  const mkSem = seg.slice(0, 7);
  const BS = baseMes(entrada, mkSem, mkSem === mk ? manual : null);
  const iniH = addDias(seg, -56);
  const fimH = addDias(seg, -1);
  let rev = 0;
  let pub = 0;
  paraDias(iniH, fimH, (d) => {
    const r = entrada.zig.revenue[d] || 0;
    const p = entrada.zig.publico[d] || 0;
    if (r > 0 && p > 0) {
      rev += r;
      pub += p;
    }
  });
  const ticketAuto = pub > 0 ? rev / pub : null;
  const ticketManual = numeroDe(form.ticket);
  const ticketUsado = ticketManual != null && ticketManual > 0 ? ticketManual : ticketAuto;
  let paxAuto = 0;
  paraDias(seg, dom, (d) => { paxAuto += entrada.paxPorData[d] || 0; });
  const paxManual = numeroDe(form.pax);
  const paxSem = paxManual != null ? paxManual : paxAuto;
  let pxH = 0;
  let pbH = 0;
  paraDias(iniH, fimH, (d) => {
    const x = entrada.paxPorData[d] || 0;
    const p = entrada.zig.publico[d] || 0;
    if (x > 0 && p > 0) {
      pxH += x;
      pbH += p;
    }
  });
  const partAuto = pbH > 0 ? Math.min(100, Math.max(5, (pxH / pbH) * 100)) : null;
  const partManual = numeroDe(form.part);
  const part = partManual != null && partManual > 0 ? partManual : partAuto;
  const fatA = BS.base == null ? null : ((BS.base * (1 + cresc)) / diasNoMes(mkSem)) * 7;
  const fatB = ticketUsado && part && paxSem > 0 ? (paxSem / (part / 100)) * ticketUsado : null;
  const budA = fatA == null ? null : fatA * teto;
  const budB = fatB == null ? null : fatB * teto;
  const candidatos = [budA, budB].filter((v): v is number => v != null);
  const recomendado = candidatos.length ? Math.min(...candidatos) : null;
  const realizadoSem = somaAtracoes(entrada.mkDocs, seg, dom);
  const planSem = somaPlano(entrada.planos, seg, dom);

  // dia a dia: peso = faturamento médio de cada dia da semana nas 8 semanas anteriores
  const peso: Record<number, number> = {};
  const cnt: Record<number, number> = {};
  paraDias(iniH, fimH, (d) => {
    const r = entrada.zig.revenue[d] || 0;
    if (r <= 0) return;
    const wd = (new Date(`${d}T12:00:00`).getDay() + 6) % 7;
    peso[wd] = (peso[wd] || 0) + r;
    cnt[wd] = (cnt[wd] || 0) + 1;
  });
  const med: Record<number, number> = {};
  let tot = 0;
  Object.keys(peso).map(Number).forEach((k) => {
    med[k] = peso[k] / cnt[k];
    tot += med[k];
  });
  const linhasDia = recomendado == null || !tot ? [] : dias.flatMap((d, i) => {
    if (!med[i]) return [];
    const w = med[i] / tot;
    const bd = recomendado * w;
    const jsDay = new Date(`${d}T12:00:00`).getDay();
    const n = BANDA_SUGESTOES_POR_DIA[jsDay] || 1;
    return [{ nome: NOMES[i], data: d, pesoPct: w * 100, budget: bd, pax: entrada.paxPorData[d] || 0, atracoes: n, maximo: bd / n }];
  });

  return {
    mes: mk,
    mesAnteriorLabel: mesLongo(`${Number(mk.slice(0, 4)) - 1}-${mk.slice(5)}`),
    mesLabel: rotuloMes(mk),
    base: B.base,
    fonteBase: B.fonte,
    baseAjustada,
    budgetMes,
    realizadoMes: realMes,
    planMes,
    fatRealMes: fatMesReal,
    teto,
    cresc,
    seg,
    dom,
    budA,
    fatA,
    budB,
    fatB,
    recomendado,
    realizadoSem,
    planSem,
    paxSem,
    part,
    ticketUsado,
    ticketAuto,
    partAuto,
    temPax: entrada.temPax,
    divergencia: budA != null && budB != null && Math.abs(budA - budB) / Math.max(budA, budB) > 0.3,
    dias: linhasDia,
    bases: candidatos.length,
  };
}

export type BudgetVista = ReturnType<typeof montarBudget>;
