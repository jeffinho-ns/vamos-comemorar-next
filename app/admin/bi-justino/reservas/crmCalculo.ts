import { CRM_META, type CrmFunil, type CrmLinha } from "./tipos";

/** MESMA conta de crmRender() do painel do Renato (Conversão e perdas • Dionísio CRM). */

export type Grupo = "ok" | "noshow" | "cancel" | "aberta";

export function crmGrupo(st: string | undefined): Grupo {
  const s = String(st || "").toLowerCase();
  if (s.indexOf("conclu") >= 0) return "ok";
  if (s.indexOf("compare") >= 0 && s.indexOf("n") === 0) return "noshow";
  if (s.indexOf("cancel") >= 0) return "cancel";
  return "aberta";
}

export function crmPct(a: number, b: number): number | null {
  return b > 0 ? (a / b) * 100 : null;
}

export function crmFmt(v: number | null, d = 1) {
  return v == null ? "—" : `${v.toFixed(d).replace(".", ",")}%`;
}

/** Cor do KPI: 'r' ruim, 'y' quase, 'g' ok. */
export function crmCor(v: number | null, meta: number, menorMelhor: boolean): "r" | "y" | "g" | "" {
  if (v == null) return "";
  const ruim = menorMelhor ? v > meta : v < meta;
  const quase = menorMelhor ? v > meta * 0.85 : v < meta * 1.05;
  return ruim ? "r" : quase ? "y" : "g";
}

export function crmMediana(a: number[]): number | null {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function dow(d: string) {
  return new Date(`${d}T12:00:00`).getDay();
}

/** Converte a resposta compacta (cols + rows em array) ou a lista de objetos. */
export function linhasCrm(payload: { cols?: string[]; rows?: unknown[] } | null): CrmLinha[] {
  if (!payload || !Array.isArray(payload.rows)) return [];
  const rows = payload.rows;
  if (payload.cols && rows.length && Array.isArray(rows[0])) {
    const cols = payload.cols;
    return (rows as unknown[][]).map((r) => {
      const o: Record<string, string | number | null | undefined> = {};
      cols.forEach((c, i) => { o[c] = r[i] as string | number | null | undefined; });
      return o as unknown as CrmLinha;
    });
  }
  return rows as CrmLinha[];
}

export interface LinhaCrmCalc extends CrmLinha { g: Grupo; lead: number | null; pes: number }

export interface Contagem { n: number; ok: number; ns: number; ca: number }

export interface ResultadoCrm {
  n: number;
  dias: number;
  c: Record<Grupo, number>;
  cancelPct: number | null;
  nsPct: number | null;
  compPct: number | null;
  iaPct: number | null;
  atIAPct: number | null;
  medLead: number | null;
  medPes: number | null;
  alertas: ["r" | "y", string][];
  porOrigem: { origem: string; x: Contagem }[];
  porDia: { dia: string; vis: number; cri: number }[];
  porLead: { faixa: string; n: number; cancel: number | null; noshow: number | null }[];
  porMes: { mes: string; n: number; ia: number | null; cancel: number | null; noshow: number | null }[];
  porHora: { faixa: string; n: number }[];
}

export function calcularCrm(rows: CrmLinha[], funil: CrmFunil | undefined, dias: number, atualizadoEm: string, agora = Date.now()): ResultadoCrm | null {
  const corte = new Date(agora - dias * 86400000).toISOString().slice(0, 10);
  const R: LinhaCrmCalc[] = rows.filter((r) => r.criadoData && String(r.criadoData) >= corte).map((r) => {
    const lead = r.data && r.criadoData ? Math.round((new Date(`${r.data}T12:00:00`).getTime() - new Date(`${r.criadoData}T12:00:00`).getTime()) / 86400000) : null;
    return { ...r, g: crmGrupo(r.status), lead, pes: Number(r.pessoas) || 0 };
  });
  const n = R.length;
  if (!n) return null;
  const c: Record<Grupo, number> = { ok: 0, noshow: 0, cancel: 0, aberta: 0 };
  R.forEach((r) => { c[r.g] += 1; });
  const cancelPct = crmPct(c.cancel, n);
  const nsPct = crmPct(c.noshow, n);
  const compPct = crmPct(c.ok, c.ok + c.noshow);
  const iaPct = crmPct(R.filter((r) => Number(r.criadoIA) === 1).length, n);
  const atIAPct = crmPct(R.filter((r) => Number(r.atendidoIA) === 1).length, n);
  const medLead = crmMediana(R.filter((r) => r.lead != null && r.lead >= 0).map((r) => r.lead as number));
  const medPes = crmMediana(R.map((r) => r.pes));
  const horasAtras = atualizadoEm ? (agora - new Date(atualizadoEm).getTime()) / 3600000 : null;

  const alertas: ["r" | "y", string][] = [];
  if (horasAtras != null && horasAtras > 9) alertas.push(["r", `Dados desatualizados: o robô do Dionísio não atualiza há ${Math.round(horasAtras)} h (PC desligado ou sessão do CRM vencida — veja o arquivo na Área de Trabalho).`]);
  if (nsPct != null && nsPct > CRM_META.noshow) alertas.push(["y", `No-show de ${crmFmt(nsPct)} (meta ${CRM_META.noshow}%): reforçar reconfirmação 48 h antes.`]);
  if (cancelPct != null && cancelPct > CRM_META.cancel) alertas.push(["y", `Cancelamento de ${crmFmt(cancelPct)} (meta ${CRM_META.cancel}%).`]);
  const porOrig: Record<string, Contagem> = {};
  R.forEach((r) => {
    const o = r.origem || "—";
    const x = porOrig[o] || (porOrig[o] = { n: 0, ok: 0, ns: 0, ca: 0 });
    x.n += 1; if (r.g === "ok") x.ok += 1; if (r.g === "noshow") x.ns += 1; if (r.g === "cancel") x.ca += 1;
  });
  Object.keys(porOrig).forEach((o) => {
    const x = porOrig[o];
    if (x.n >= 15 && (crmPct(x.ns, x.n) ?? 0) > 12) alertas.push(["y", `${o}: no-show de ${crmFmt(crmPct(x.ns, x.n))} em ${x.n} reservas.`]);
    if (x.n >= 15 && (crmPct(x.ca, x.n) ?? 0) > 22) alertas.push(["y", `${o}: cancelamento de ${crmFmt(crmPct(x.ca, x.n))} em ${x.n} reservas.`]);
  });
  const lg = R.filter((r) => r.lead != null && r.lead >= 8 && r.lead <= 30);
  if (lg.length >= 15 && (crmPct(lg.filter((r) => r.g === "cancel").length, lg.length) ?? 0) > 20) alertas.push(["y", `Reservas feitas com 8–30 dias de antecedência cancelam ${crmFmt(crmPct(lg.filter((r) => r.g === "cancel").length, lg.length))}: reconfirmar 48 h antes.`]);
  if (funil && Number(funil.sessoesVar) > 15 && Number(funil.reservasVar) < 0) alertas.push(["y", `Sessões ${Number(funil.sessoesVar) > 0 ? "+" : ""}${crmFmt(Number(funil.sessoesVar), 0)} e reservas ${crmFmt(Number(funil.reservasVar), 0)} no período: tráfego novo sem intenção de reservar (anúncios/disparos) — a conversão cai mesmo sem erro da IA.`]);
  const mesIA: Record<string, { n: number; ia: number }> = {};
  R.forEach((r) => { const m = String(r.criadoData).slice(0, 7); const x = mesIA[m] || (mesIA[m] = { n: 0, ia: 0 }); x.n += 1; if (Number(r.criadoIA) === 1) x.ia += 1; });
  Object.keys(mesIA).forEach((m) => { if (mesIA[m].n >= 30 && mesIA[m].ia === 0) alertas.push(["y", `Em ${m.slice(5)}/${m.slice(0, 4)} a IA não criou nenhuma das ${mesIA[m].n} reservas: conferir a integração.`]); });

  const dn = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const vis = [0, 0, 0, 0, 0, 0, 0];
  const cri = [0, 0, 0, 0, 0, 0, 0];
  R.forEach((r) => { if (r.data) vis[dow(r.data)] += 1; cri[dow(r.criadoData)] += 1; });
  const bk: [string, number, number][] = [["0–1 dia", 0, 1], ["2–7 dias", 2, 7], ["8–30 dias", 8, 30], ["31+ dias", 31, 9999]];
  const hr: Record<number, number> = {};
  R.forEach((r) => { if (r.criadoHora != null && r.criadoHora !== "") { const b = Math.floor(Number(r.criadoHora) / 3) * 3; hr[b] = (hr[b] || 0) + 1; } });

  return {
    n, dias, c, cancelPct, nsPct, compPct, iaPct, atIAPct, medLead, medPes, alertas,
    porOrigem: Object.keys(porOrig).sort((a, b) => porOrig[b].n - porOrig[a].n).map((origem) => ({ origem, x: porOrig[origem] })),
    porDia: dn.map((dia, i) => ({ dia, vis: vis[i], cri: cri[i] })),
    porLead: bk.map(([faixa, a, b]) => { const g = R.filter((r) => r.lead != null && r.lead >= a && r.lead <= b); return { faixa, n: g.length, cancel: crmPct(g.filter((r) => r.g === "cancel").length, g.length), noshow: crmPct(g.filter((r) => r.g === "noshow").length, g.length) }; }),
    porMes: Object.keys(mesIA).sort().map((m) => { const g = R.filter((r) => String(r.criadoData).slice(0, 7) === m); return { mes: `${m.slice(5)}/${m.slice(0, 4)}`, n: g.length, ia: crmPct(g.filter((r) => Number(r.criadoIA) === 1).length, g.length), cancel: crmPct(g.filter((r) => r.g === "cancel").length, g.length), noshow: crmPct(g.filter((r) => r.g === "noshow").length, g.length) }; }),
    porHora: Object.keys(hr).map(Number).sort((a, b) => a - b).map((b) => ({ faixa: `${String(b).padStart(2, "0")}h–${String(b + 2).padStart(2, "0")}h59`, n: hr[b] })),
  };
}
