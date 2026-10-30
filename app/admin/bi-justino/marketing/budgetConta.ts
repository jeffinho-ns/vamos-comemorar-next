import { porDiaDaSemana, rotuloMes, type ZigAoVivo } from "../zigValor";
import { addDias, diaSemanaUtc, diasNoMes, hojeSp, numeroDe, segundaDe } from "./numeros";

const NOMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;

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

function atracoes(indice: number) {
  if (indice === 4) return 2;
  if (indice === 5) return 3;
  return 1;
}

function ticketOito(zig: ZigAoVivo | null, seg: string) {
  const inicio = addDias(seg, -56);
  let publico = 0;
  let ponderado = 0;
  for (const semana of zig?.semanas || []) {
    if (semana.inicio < inicio || semana.inicio >= seg) continue;
    if (semana.ticket == null || !(semana.publico > 0)) continue;
    publico += semana.publico;
    ponderado += semana.ticket * semana.publico;
  }
  return publico > 0 ? ponderado / publico : null;
}

function participacao(zig: ZigAoVivo | null, inicio: string, fim: string) {
  const publico = new Map<string, number>();
  for (const dia of zig?.diasZig || []) {
    if (dia.publico != null && dia.publico > 0) publico.set(dia.date, dia.publico);
  }
  if (!publico.size || !zig?.reservas?.length) return null;
  let pax = 0;
  let pessoas = 0;
  for (const reserva of zig.reservas) {
    if (reserva.date < inicio || reserva.date > fim) continue;
    const pub = publico.get(reserva.date);
    if (!(reserva.pax > 0) || pub == null) continue;
    pax += reserva.pax;
    pessoas += pub;
  }
  if (pessoas <= 0) return null;
  return Math.min(100, Math.max(5, (pax / pessoas) * 100));
}

function paxEntre(zig: ZigAoVivo | null, inicio: string, fim: string) {
  if (!zig?.reservas) return null;
  return zig.reservas.reduce((total, reserva) => (
    reserva.date >= inicio && reserva.date <= fim ? total + reserva.pax : total
  ), 0);
}

function pesosOito(zig: ZigAoVivo | null, seg: string) {
  if (!zig?.diasZig?.length) return null;
  const inicio = addDias(seg, -56);
  const fim = addDias(seg, -1);
  const soma = [0, 0, 0, 0, 0, 0, 0];
  const n = [0, 0, 0, 0, 0, 0, 0];
  for (const dia of zig.diasZig) {
    if (dia.date < inicio || dia.date > fim || !(dia.receita > 0)) continue;
    const indice = (diaSemanaUtc(dia.date) + 6) % 7;
    soma[indice] += dia.receita;
    n[indice] += 1;
  }
  if (!n.some((item) => item > 0)) return null;
  return soma.map((valor, indice) => (n[indice] ? valor / n[indice] : null));
}

function pesosPadrao(zig: ZigAoVivo | null) {
  const porNome = new Map(porDiaDaSemana(zig).map((dia) => [dia.nome, dia.faturamentoMedio]));
  return NOMES.map((nome) => {
    const valor = porNome.get(nome);
    return valor != null && valor > 0 ? valor : null;
  });
}

function somaAtracoes(zig: ZigAoVivo | null, inicio: string, fim: string) {
  return (zig?.lancamentos?.marketing || []).reduce((total, linha) => {
    const data = typeof linha.date === "string" ? linha.date.slice(0, 10) : "";
    if (data < inicio || data > fim) return total;
    return total + (numeroDe(linha.mkAttractions) ?? 0);
  }, 0);
}

function fatMes(zig: ZigAoVivo | null, mk: string, hoje: string) {
  return (zig?.serieMes || []).reduce((total, ponto) => {
    if (!ponto.dia.startsWith(mk) || ponto.dia > hoje) return total;
    return total + (ponto.zig || 0);
  }, 0);
}

export function montarBudget(zig: ZigAoVivo | null, form: BudgetForm) {
  const hoje = hojeSp();
  const tetoNum = numeroDe(form.teto);
  const teto = (tetoNum == null || tetoNum === 0 ? 8 : tetoNum) / 100;
  const crescNum = numeroDe(form.cresc);
  const cresc = (crescNum == null ? 0 : crescNum) / 100;
  const mes = /^\d{4}-\d{2}$/.test(form.mes) ? form.mes : hoje.slice(0, 7);
  const manual = numeroDe(form.baseManual);
  const base = manual != null && manual > 0 ? manual : null;
  const baseAjustada = base == null ? null : base * (1 + cresc);
  const budgetMes = baseAjustada == null ? null : baseAjustada * teto;
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(form.semana) ? form.semana : hoje;
  const seg = segundaDe(ref);
  const dom = addDias(seg, 6);
  const baseSemana = seg.slice(0, 7) === mes ? base : null;
  const fatA = baseSemana == null ? null : (baseSemana * (1 + cresc) / diasNoMes(seg.slice(0, 7))) * 7;
  const budA = fatA == null ? null : fatA * teto;
  const ticketAuto = ticketOito(zig, seg);
  const ticketManual = numeroDe(form.ticket);
  const ticketUsado = ticketManual != null && ticketManual > 0 ? ticketManual : ticketAuto;
  const paxAuto = paxEntre(zig, seg, dom);
  const paxManual = numeroDe(form.pax);
  const paxSem = paxManual != null ? paxManual : paxAuto;
  const partAuto = participacao(zig, addDias(seg, -56), addDias(seg, -1));
  const partManual = numeroDe(form.part);
  const part = partManual != null && partManual > 0 ? partManual : partAuto;
  const fatB = ticketUsado != null && part != null && paxSem != null && paxSem > 0
    ? (paxSem / (part / 100)) * ticketUsado
    : null;
  const budB = fatB == null ? null : fatB * teto;
  const candidatos = [budA, budB].filter((valor): valor is number => valor != null);
  const recomendado = candidatos.length ? Math.min(...candidatos) : null;
  const pesosDiretos = pesosOito(zig, seg);
  const pesos = pesosDiretos ?? pesosPadrao(zig);
  const origemPeso = pesosDiretos ? "8semanas" as const : pesos.some((valor) => valor != null) ? "padrao" as const : "nenhum" as const;
  const totalPeso = pesos.reduce<number>((total, valor) => total + (valor || 0), 0);
  const dias = recomendado == null || !totalPeso ? [] : [0, 1, 2, 3, 4, 5, 6].flatMap((indice) => {
    const medio = pesos[indice];
    if (!medio) return [];
    const data = addDias(seg, indice);
    const peso = medio / totalPeso;
    const n = atracoes(indice);
    const budget = recomendado * peso;
    const pax = Array.isArray(zig?.reservas)
      ? zig.reservas.reduce((total, reserva) => (reserva.date === data ? total + reserva.pax : total), 0)
      : null;
    return [{ nome: NOMES[indice], data, pesoPct: peso * 100, budget, pax, atracoes: n, maximo: budget / n }];
  });
  return {
    mes,
    mesAnterior: rotuloMes(`${Number(mes.slice(0, 4)) - 1}-${mes.slice(5)}`),
    baseAjustada,
    fonteBase: base == null ? null : "informado",
    budgetMes,
    realizadoMes: somaAtracoes(zig, `${mes}-01`, `${mes}-31`),
    fatRealMes: fatMes(zig, mes, hoje),
    teto,
    cresc,
    seg,
    dom,
    budA,
    fatA,
    budB,
    fatB,
    recomendado,
    realizadoSem: somaAtracoes(zig, seg, dom),
    paxSem,
    part,
    ticketUsado,
    ticketAuto,
    partAuto,
    reservasNoPainel: Array.isArray(zig?.reservas),
    divergencia: budA != null && budB != null && Math.abs(budA - budB) / Math.max(budA, budB) > 0.3,
    dias,
    origemPeso,
    bases: candidatos.length,
  };
}

export type BudgetVista = ReturnType<typeof montarBudget>;
