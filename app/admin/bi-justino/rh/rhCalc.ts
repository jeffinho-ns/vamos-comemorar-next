// Contas da página RH — iguais ao HTML do Renato: tabelas INSS/IRRF 2026, ordenação por setor/hierarquia,
// ficha por mês (empVisao), horas extras do mês, serviço do mês (ZigPay), KPIs/alertas de RH e sugestão de freelancer.
import {
  HEALTHY, alerta, brl, pct, statusCost, todayStr, type Alerta, type MapasZig,
} from "../financeiro/comum";
import type { MasterLite } from "../financeiro/master";
import {
  COLAB_SETOR_ORDEM, FUNCAO_CARGO_LABEL, FREELANCER_SECTOR_LABEL, HORARIO_FUNCIONAMENTO, SECTOR_BASE_FALLBACK, SECTOR_MAX_SIMULTANEO,
  type Employee, type FichaMes, type SetorBase,
} from "./rhTipos";

// ---- Tabelas federais 2026 (confirmadas 25/09/2026; conferir com o contador) ----
const INSS_TABLE_2026 = [{ ate: 1621.0, aliq: 0.075, deduz: 0 }, { ate: 2902.84, aliq: 0.09, deduz: 24.32 }, { ate: 4354.27, aliq: 0.12, deduz: 111.4 }, { ate: 8475.55, aliq: 0.14, deduz: 198.49 }];
const INSS_TETO_2026 = 988.09;
const IRRF_TABLE_2026 = [{ ate: 2428.8, aliq: 0, deduz: 0 }, { ate: 2826.65, aliq: 0.075, deduz: 182.16 }, { ate: 3751.05, aliq: 0.15, deduz: 394.16 }, { ate: 4664.68, aliq: 0.225, deduz: 675.49 }, { ate: Infinity, aliq: 0.275, deduz: 908.73 }];
export const SINTHORESP_PISO_NORMAL_2026 = 2511.5;

export function calcInss2026(salario: number) {
  const s = Number(salario) || 0;
  for (const f of INSS_TABLE_2026) if (s <= f.ate) return Math.max(0, Math.min(INSS_TETO_2026, s * f.aliq - f.deduz));
  return INSS_TETO_2026;
}
export function calcIrrf2026(baseCalculo: number) {
  const b = Number(baseCalculo) || 0;
  let imposto = 0;
  for (const f of IRRF_TABLE_2026) {
    if (b <= f.ate) {
      imposto = Math.max(0, b * f.aliq - f.deduz);
      break;
    }
  }
  if (b > 0 && b <= 7350) {
    const redutor = Math.max(0, 978.62 - 0.133145 * b);
    imposto = Math.max(0, imposto - redutor);
  }
  return imposto;
}

export function feriasAtivas(emp: { feriasInicio?: string; feriasFim?: string }, dateStr: string) {
  if (!emp.feriasInicio || !emp.feriasFim) return false;
  return dateStr >= emp.feriasInicio && dateStr <= emp.feriasFim;
}

export function employeeCargoLabel(e: Pick<Employee, "funcaoCargo" | "cargo" | "cargoOutro">) {
  if (e.funcaoCargo && FUNCAO_CARGO_LABEL[e.funcaoCargo]) return FUNCAO_CARGO_LABEL[e.funcaoCargo];
  return e.cargo === "outro" ? (e.cargoOutro || "Outro") : (FREELANCER_SECTOR_LABEL[e.cargo] || e.cargo);
}

function colabNorm(t: string | undefined) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
export function colabSetor(e: Pick<Employee, "funcaoCargo" | "cargo" | "cargoOutro">) {
  if (e.funcaoCargo === "gerente") return "gerencia";
  if (e.cargo && e.cargo !== "outro" && COLAB_SETOR_ORDEM.includes(e.cargo)) return e.cargo;
  const n = colabNorm(e.cargoOutro);
  if (/gerente|gerencia/.test(n)) return "gerencia";
  if (/manuten/.test(n)) return "manutencao";
  if (/estoq/.test(n)) return "estoquista";
  if (/seguran/.test(n)) return "seguranca";
  if (/limpez/.test(n)) return "limpeza";
  if (/cozinh/.test(n)) return "cozinha";
  if (/bar/.test(n)) return "bar";
  if (/runner|rp$/.test(n)) return "runner";
  if (/caixa|hostess/.test(n)) return "caixa";
  if (/cumim/.test(n)) return "cumim";
  if (/salao|garcom|maitre/.test(n)) return "salao";
  return "outros";
}
export function colabRank(e: Pick<Employee, "funcaoCargo" | "nivel">) {
  const f = e.funcaoCargo;
  if (f === "gerente") return 0;
  if (f === "chefeBar" || f === "chefeCozinha" || f === "chefeCaixa" || f === "maitre") return 1;
  if (f === "chefeFila" || f === "subchefeBar" || f === "subchefeCozinha") return 2;
  const nivel: Record<string, number> = { senior: 3, pleno: 4, junior: 5 };
  return nivel[e.nivel] ?? 4;
}

export type Fonte = "atual" | "historico" | "sem" | "";
export interface Visao { e: Employee; fonte: Fonte; idx: number; setor: string; rank: number }

/** empVisao: ficha do mês escolhido (foto), ficha atual quando o mês bate, ou "sem ficha". */
export function empVisao(e: Employee, mk: string, snaps: Record<string, FichaMes>): { e: Employee; fonte: Fonte } {
  if (!mk) return { e, fonte: "" };
  const snap = snaps[e.id];
  if (snap) return { e: { ...e, ...snap }, fonte: "historico" };
  if (String(e.mesReferencia || "").slice(0, 7) === mk) return { e, fonte: "atual" };
  return { e: { ...e, valorTotal: 0 }, fonte: "sem" };
}

export function employeesOrdenadosPorSetor(employees: Employee[], mk: string, snaps: Record<string, FichaMes>): Visao[] {
  const itens = employees.map((emp, idx) => {
    const v = empVisao(emp, mk, snaps);
    return { e: v.e, fonte: v.fonte, idx, setor: colabSetor(v.e), rank: colabRank(v.e) };
  });
  return [...itens].sort((a, b) => {
    const sa = COLAB_SETOR_ORDEM.indexOf(a.setor);
    const sb = COLAB_SETOR_ORDEM.indexOf(b.setor);
    if (sa !== sb) return sa - sb;
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (!!a.e.ativo !== !!b.e.ativo) return a.e.ativo ? -1 : 1;
    return String(a.e.nome || "").localeCompare(String(b.e.nome || ""), "pt-BR");
  });
}

/** applyEmployeesToRhCore: soma do Valor Total e contagem dos ativos. */
export function resumoAtivos(employees: Employee[]) {
  const ativos = employees.filter((e) => e.ativo);
  const n = (t: string) => ativos.filter((e) => e.contratacao === t).length;
  return {
    total: ativos.reduce((s, e) => s + (Number(e.valorTotal) || 0), 0),
    quantidade: ativos.length,
    detalhe: `${n("CLT")} CLT + ${n("INT")} INT + ${n("PJ")} PJ`,
  };
}

/** applyRhHorasExtrasNoturno: HE + adicional noturno das fichas do mês de referência. */
export function horasExtrasDoMes(employees: Employee[], mk: string) {
  const doMes = employees.filter((e) => String(e.mesReferencia || "").slice(0, 7) === mk);
  const semMes = employees.filter((e) => !e.mesReferencia).length;
  const he = doMes.reduce((t, e) => t + (Number(e.horasExtras) || 0), 0);
  const an = doMes.reduce((t, e) => t + (Number(e.adicionalNoturno) || 0), 0);
  return { he, an, quantidade: doMes.length, semMes };
}

/** renderServicoMes: taxa de serviço do mês (ZigPay), com fallback pro último mês capturado. */
export function servicoDoMes(zig: MapasZig, mkPedido: string, desconto: number) {
  let mk = mkPedido;
  let dias = Object.keys(zig.servico).filter((d) => d.slice(0, 7) === mk);
  let ref = false;
  if (!dias.length) {
    const meses = Array.from(new Set(Object.keys(zig.servico).map((d) => d.slice(0, 7)))).sort();
    const ult = meses.filter((m) => m <= mk).pop() || meses[meses.length - 1];
    if (ult) {
      mk = ult;
      dias = Object.keys(zig.servico).filter((d) => d.slice(0, 7) === mk);
      ref = true;
    }
  }
  const bruto = dias.reduce((s, d) => s + zig.servico[d], 0);
  const liquido = bruto - desconto;
  const ultimoDia = dias.length ? [...dias].sort().pop()!.slice(8) : "";
  return { mk, dias: dias.length, bruto, liquido, ref, ultimoDia };
}

/** servicoLiquidoDoMes: taxa de serviço do mês (sem fallback) menos o desconto retido pela casa. */
export function servicoLiquidoDoMes(zig: MapasZig, mk: string, desconto: number) {
  const bruto = Object.keys(zig.servico).reduce((s, d) => (d.slice(0, 7) === mk ? s + zig.servico[d] : s), 0);
  return Math.max(0, bruto - desconto);
}

export interface KpisRh {
  rhBase: number;
  rhCost: number;
  rhRate: number;
  rhTarget: number;
  rhImpact: number;
  rhScore: number;
  extrasTotal: number;
  alertas: Alerta[];
  cmoStatus: ReturnType<typeof statusCost>;
}

/** Bloco "RH" de calcAllDrafts. `servicoLiquido` = bruto − desconto do mês de referência do Financeiro (mês atual). */
export function kpisRh(m: MasterLite, rhCore: number, rhExtrasNow: number, freelancerCost: number, servicoLiquido: number): KpisRh {
  const rhBase = Math.max(0, m.r - servicoLiquido);
  const rhCost = rhCore + rhExtrasNow + freelancerCost;
  const rhRate = rhBase ? (rhCost / rhBase) * 100 : 0;
  const rhTarget = rhBase * (HEALTHY.coreHrRate + HEALTHY.extrasRate);
  const rhImpact = rhTarget - rhCost;
  const rhScore = Math.max(0, Math.min(1.25, 1 + rhImpact / Math.max(1, rhTarget)));
  const extrasTotal = rhExtrasNow + freelancerCost;
  const alertas = [
    alerta("RH estrutural", brl(rhCore), statusCost(rhCore, rhBase * 0.15, rhBase * 0.18)),
    alerta("Extras", brl(extrasTotal) + (freelancerCost ? ` (inclui ${brl(freelancerCost)} de freelancer aprovado)` : ""), statusCost(extrasTotal, rhBase * 0.04, rhBase * 0.05)),
  ];
  return { rhBase, rhCost, rhRate, rhTarget, rhImpact, rhScore, extrasTotal, alertas, cmoStatus: statusCost(rhRate, 19, 23) };
}
export function pctCmo(rhRate: number) {
  return pct(rhRate);
}

export interface SugestaoFreelancer { pax: number; necessario: number; minimo: number; cltPresente: number; sugestao: number; fechado: boolean; estimado: boolean }

/**
 * Sugestão do sistema na lista de aprovação — caminho de reserva de freelancerSuggestion (sem mapa de calor):
 * necessário = pax ÷ atendimento por pessoa; mínimo = maior entre necessário e brigada (limitado ao teto do setor);
 * sugestão = mínimo − equipe própria presente (CLT+INT+PJ − férias). O caminho hora a hora (mapa de calor) fica na Operação.
 */
export function sugestaoFreelancer(
  date: string,
  sector: string,
  sectorBase: Record<string, SetorBase>,
  employees: Employee[],
  zig: MapasZig,
  paxReservas: Record<string, number>,
): SugestaoFreelancer {
  const base = sectorBase[sector] || SECTOR_BASE_FALLBACK[sector] || { atendimentoPorPessoa: 1, clt: 0, brigadaPadrao: 0 };
  const wd = new Date(`${date}T12:00:00`).getDay();
  const fun = HORARIO_FUNCIONAMENTO[wd];
  const equipe = (base.clt || 0) + (base.int || 0) + (base.pj || 0);
  const ferias = employees.filter((e) => e.ativo && ["CLT", "INT", "PJ"].includes(e.contratacao) && e.cargo === sector && feriasAtivas(e, date)).length;
  const cltPresente = Math.max(0, equipe - ferias);
  const hoje = todayStr();
  let pax = 0;
  let estimado = false;
  if (date < hoje && zig.publico[date] != null) pax = zig.publico[date];
  else if (paxReservas[date]) pax = paxReservas[date];
  else if (zig.publico[date] != null) pax = zig.publico[date];
  else {
    const hist = Object.keys(zig.publico).filter((d) => new Date(`${d}T12:00:00`).getDay() === wd);
    pax = hist.length ? Math.round(hist.reduce((s, d) => s + zig.publico[d], 0) / hist.length) : 0;
    estimado = true;
  }
  if (!fun) return { pax, necessario: 0, minimo: 0, cltPresente, sugestao: 0, fechado: true, estimado };
  const necessario = Math.ceil(pax / (base.atendimentoPorPessoa || 1));
  const brigada = base.brigadaPadrao || 0;
  const lim = base.limiteBrigada && base.limiteBrigada > 0 ? base.limiteBrigada : null;
  const teto = SECTOR_MAX_SIMULTANEO[sector];
  const maxSimultaneo = lim != null ? (teto != null ? Math.min(teto, lim) : lim) : teto;
  let minimo = Math.max(necessario, brigada);
  if (maxSimultaneo != null) minimo = Math.min(minimo, maxSimultaneo);
  const sugestao = Math.max(0, Math.max(necessario, brigada) - cltPresente);
  return { pax, necessario, minimo, cltPresente, sugestao, fechado: false, estimado };
}

/** Pax reservado por data (getReservations já devolve um doc por dia com o pax somado). */
export function paxPorData(docs: { date: string; pax?: number | null }[] | undefined) {
  const saida: Record<string, number> = {};
  (docs || []).forEach((r) => {
    if (!r.date) return;
    saida[r.date] = Number(r.pax) || 0;
  });
  return saida;
}
