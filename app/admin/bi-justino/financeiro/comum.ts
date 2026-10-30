// Constantes, formatação e regras compartilhadas pelas páginas Financeiro, RH e CMV.
// Tudo copiado do painel do Renato (BI_Gerencial_Seu_Justino_v2.html): BASE/HEALTHY (linhas ~2173–2174),
// statusCost/statusHigh, bônus (bonusGate/prorata/employeeBonus) e formatadores (brl/pct/fmtDate/monthKeyLabel).

export type Nivel = "g" | "y" | "r";
export type Status = [Nivel, string];

/** DRE validada (decisão de 24/09/2026) — mesmo objeto BASE do HTML. */
export const BASE = {
  revenue: 526000,
  cmvPct: 20.09,
  tax: 3.86,
  card: 2.11,
  fee: 7,
  incomeTax: 2.7,
  traffic: 4500,
  marketingOther: 6439,
  attractions: 48114,
  security: 7979,
  extras: 26447,
  rent: 51613,
  disposable: 7113,
  coreHr: 104744,
  adminFixed: 27671,
  financeOther: 3208,
  otherOps: 18577,
} as const;

/** Faixas saudáveis — mesmo objeto HEALTHY do HTML. */
export const HEALTHY = {
  trafficRate: 0.00855,
  marketingOther: 4500,
  attractionRate: 0.08,
  securityRate: 0.015,
  extrasRate: 0.04,
  coreHrRate: 0.15,
  adminFixed: 25000,
  financeOther: 3000,
  card: 2.1,
  lossRate: 0.006,
  disposableRate: 0.015,
  cmvPct: 22,
} as const;

export const MONTH_LABEL_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const WEEKDAY_SHORT_PT = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
export const WEEKDAY_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Resposta de getEntries (um envio por área+data). */
export interface EntryDoc {
  area: string;
  date: string;
  values: Record<string, number | string | null | undefined>;
  notes?: Record<string, string | undefined>;
  submittedByName?: string;
  submittedAt?: string;
}
export interface EntriesPayload { ok: boolean; docs?: EntryDoc[] }

export interface ZigRevenueDoc { date: string; revenue: number; publico: number | null; servico: number | null }
export interface ZigRevenuePayload { ok: boolean; docs?: ZigRevenueDoc[] }

export interface RevenueOverviewPayload {
  ok: boolean;
  monthRevenue?: number | null;
  monthRevenueZig?: number | null;
  monthRevenueEventos?: number | null;
}

export interface MonthClosure { id: string; area: string; monthKey: string; closedByEmail: string; closedAt: string }
export interface MonthClosuresPayload { ok: boolean; items?: MonthClosure[] }

export interface SalaryRow { role: string; name: string; admissionDate: string; baseSalary: number }
export interface SalariesPayload { ok: boolean; rows?: SalaryRow[] }

export interface FreelancerRequest {
  id: string;
  date: string;
  sector: string;
  reason: string;
  shiftHours: number;
  qty: number;
  payPerPerson: number;
  totalCost: number;
  note: string;
  requestedByEmail: string;
  requestedAt: string;
  status: string;
  decidedByEmail: string;
  decidedAt: string;
  decisionNote: string;
  attendance: string;
  freelancerNames: string;
}
export interface FreelancerPayload { ok: boolean; items?: FreelancerRequest[] }

// ---- formatação (iguais ao HTML) ----
export function brl(n: number | null | undefined) {
  return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
export function brl2(n: number | null | undefined) {
  return (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function pct(n: number | null | undefined) {
  return `${(Number(n) || 0).toFixed(1)}%`;
}
export function pct2(n: number) {
  return `${n.toFixed(2).replace(".", ",")}%`;
}
export function fmtDate(s: string | null | undefined) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
  const [y, m, d] = s.split("-");
  return `${WEEKDAY_SHORT_PT[new Date(`${s}T12:00:00`).getDay()]} ${d}/${m}/${y}`;
}
export function fmtTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
export function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function monthKeyLabel(mk: string | null | undefined) {
  if (!mk) return "—";
  const [y, m] = mk.split("-");
  return `${MONTH_LABEL_PT[Number(m) - 1] || m}/${y}`;
}
export function monthKeyAdd(mk: string, delta: number) {
  const d = new Date(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function mesAnterior(mk: string) {
  return monthKeyAdd(mk, -1);
}
/** Últimos N meses `AAAA-MM` a partir de hoje (espelho: getDreParaMes / getEmployeesMonth). */
export function mesesIso(qtd: number, aPartirDe = todayStr().slice(0, 7)) {
  return Array.from({ length: qtd }, (_, i) => monthKeyAdd(aPartirDe, -i));
}

/** Mesmo parseBRL do HTML: aceita "1.234,56", "1234.56" e número. */
export function parseBRL(raw: string | number | null | undefined) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const texto = String(raw ?? "").trim().replace(/[R$\s]/g, "");
  if (!texto) return 0;
  const normal = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const n = Number(normal);
  return Number.isFinite(n) ? n : 0;
}
export function numero(valor: number | string | null | undefined) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === "string" && valor.trim()) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// ---- status / bônus ----
export function statusCost(a: number, g: number, w: number): Status {
  return a <= g ? ["g", "SAUDÁVEL"] : a <= w ? ["y", "ATENÇÃO"] : ["r", "CRÍTICO"];
}
export function statusHigh(a: number, g: number, w: number): Status {
  return a >= g ? ["g", "SAUDÁVEL"] : a >= w ? ["y", "ATENÇÃO"] : ["r", "CRÍTICO"];
}
export function bonusGate(m: number) {
  if (m < 8) return 0;
  if (m < 10) return 0.25;
  if (m < 12) return 0.6;
  if (m < 15) return 1;
  return 1.25;
}
export function prorata(adm: string | null | undefined) {
  if (!adm) return 1;
  const y = new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);
  const a = new Date(`${adm}T00:00:00`);
  if (a <= start) return 1;
  if (a > end) return 0;
  return Math.max(0, (end.getTime() - a.getTime()) / (end.getTime() - start.getTime()));
}
/** employeeBonus do HTML — CMV não tem bônus (decisão do Renato, 23/09/2026). */
export function employeeBonus(role: string, margin: number, areaScore: number, salaries: SalaryRow[] | null) {
  if (role === "cmv") return 0;
  const s = (salaries || []).find((row) => row.role === role);
  if (!s || !s.baseSalary) return 0;
  const annualTarget = s.baseSalary * 1.25;
  const gate = bonusGate(margin);
  const houseScore = Math.min(1.25, Math.max(0, margin / 12));
  const discipline = 1;
  const score = 0.5 * areaScore + 0.3 * houseScore + 0.2 * discipline;
  return annualTarget * prorata(s.admissionDate) * gate * Math.min(1.25, score);
}

/** Alerta no formato do quadro `AlertasFlow` (DiretoriaQuadros.tsx). */
export interface Alerta {
  titulo: string;
  valor: string;
  nivel: Nivel;
  selo: string;
  detalhe?: string;
}
export function alerta(titulo: string, valor: string, status: Status, detalhe?: string): Alerta {
  return { titulo, valor, nivel: status[0], selo: status[1], detalhe };
}

// ---- mapas da ZigPay (refreshZigRevenue) ----
export interface MapasZig {
  revenue: Record<string, number>;
  publico: Record<string, number>;
  servico: Record<string, number>;
}
export function mapasZig(payload: ZigRevenuePayload | null): MapasZig {
  const revenue: Record<string, number> = {};
  const publico: Record<string, number> = {};
  const servico: Record<string, number> = {};
  (payload?.docs || []).forEach((d) => {
    revenue[d.date] = d.revenue;
    if (d.publico != null) publico[d.date] = d.publico;
    if (d.servico != null) servico[d.date] = d.servico;
  });
  return { revenue, publico, servico };
}

/** Valores de um mapa por data, cronológicos, últimos N (lastNByDate). */
export function lastNByDate(byDate: Record<string, number>, n: number): (number | null)[] {
  return Object.keys(byDate).sort().slice(-n).map((d) => (Number.isFinite(byDate[d]) ? byDate[d] : null));
}
/** Série de um campo (ou soma de campos) dos envios, do mais antigo pro mais novo (entriesFieldSeries). */
export function entriesFieldSeries(docs: EntryDoc[] | null | undefined, fields: string | string[]): (number | null)[] {
  if (!docs || !docs.length) return [];
  const list = Array.isArray(fields) ? fields : [fields];
  return [...docs].reverse().map((d) => {
    const v = d.values || {};
    let sum = 0;
    let any = false;
    list.forEach((f) => {
      const n = Number(v[f]);
      if (v[f] != null && Number.isFinite(n)) {
        sum += n;
        any = true;
      }
    });
    return any ? sum : null;
  });
}
export function isMonthClosedFor(closures: MonthClosure[] | null | undefined, area: string, mk: string) {
  return (closures || []).some((c) => c.area === area && c.monthKey === mk.slice(0, 7));
}
/** Custo de freelancers aprovados (e que não faltaram) no mês — freelancerMonthlyApprovedCost. */
export function freelancerMonthlyApprovedCost(items: FreelancerRequest[] | null | undefined, monthKey: string) {
  return (items || [])
    .filter((it) => it.status === "aprovado" && it.attendance !== "faltou" && it.date.slice(0, 7) === monthKey)
    .reduce((s, it) => s + (Number(it.totalCost) || 0), 0);
}
