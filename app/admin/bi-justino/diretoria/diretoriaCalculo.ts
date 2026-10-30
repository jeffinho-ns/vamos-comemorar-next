import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { AuditoriaOpItem, AuditoriaOpResp, EventoItem, EventosResp } from "../marketing/espelhoTipos";
import { hojeSp, reais } from "../marketing/numeros";
import { AREA_DE_CUSTO, CHAVES_CUSTO, LABEL_AREA, type Consolidado, type Selo } from "./consolidado";

function mesesChave(qtd: number) {
  const [ano, mes] = hojeSp().slice(0, 7).split("-").map(Number);
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Chaves do espelho que a página Diretoria lê (catálogo + 3 meses de DRE). */
export const CHAVES_DIRETORIA = [
  "getDreBase",
  "getDreFaturamentoHistorico",
  "getRevenueOverview",
  "getZigRevenue",
  "getZigBilheteria",
  "getZigHourly",
  "getZigHourlyDetail",
  "getZigItemSalesRanking",
  "getFaturamentoSemanas",
  "getEntries:marketing",
  "getEntries:financeiro",
  "getEntries:rh",
  "getEntries:operacao",
  "getEntries:cmv",
  "getFreelancerRequests",
  "getEventos",
  "getAuditoriaOpItens",
  "getSalaries",
  "getUsersList",
  "getDeletionsLog",
  "getDuvidas",
  ...mesesChave(3).map((mk) => `getDreParaMes:${mk}`),
];

export function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

export interface AlertaDiretoria { nivel: Selo[0]; titulo: string; valor: string; selo: string; detalhe?: string; abrirAuditoria?: boolean }

function alerta(titulo: string, valor: string, selo: Selo, detalhe?: string): AlertaDiretoria {
  return { nivel: selo[0], titulo, valor, selo: selo[1], detalhe };
}

const DIAS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
export function fmtDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${DIAS[new Date(`${iso}T12:00:00`).getDay()]} ${dia}/${mes}/${ano}`;
}

/** masterAlerts do computeMaster. */
export function alertasDiretoria(c: Consolidado, pendentesAuditoria: AuditoriaOpItem[]): AlertaDiretoria[] {
  const lista: AlertaDiretoria[] = [];
  for (const chave of CHAVES_CUSTO) {
    const area = AREA_DE_CUSTO[chave];
    const e = c.ultimo[area];
    if (!e) lista.push(alerta(`${LABEL_AREA[area]} nunca enviou um registro`, "—", ["y", "ATENÇÃO"]));
    else if (e.date !== c.hoje) lista.push(alerta(`${LABEL_AREA[area]} sem envio hoje`, `Último envio: ${fmtDate(e.date)}`, ["y", "ATENÇÃO"]));
  }
  if (c.margin < 8) lista.push(alerta("Margem abaixo do gatilho de bônus", pct(c.margin), ["r", "REVISAR"], "Nenhum bônus é destravado abaixo de 8%."));
  if (c.cmvDev >= 2) lista.push(alerta("Desvio CMV teórico × real", pct(c.cmvDev), ["r", "CRÍTICO"], "Revisar estoque, ficha, porcionamento e perdas."));
  if (c.util > c.r * 0.04) lista.push(alerta("Utilidades acima da referência", reais(c.util), ["y", "ATENÇÃO"], "Acima de 4% da receita."));
  if (pendentesAuditoria.length) {
    const exemplos = pendentesAuditoria.slice(0, 3).map((x) => x.descricaoProblema).join(" • ");
    lista.push({ ...alerta(`${pendentesAuditoria.length} item(ns) de Auditoria Operacional aguardando aprovação`, "Clique pra abrir Auditoria Operacional", ["y", "ATENÇÃO"], exemplos), abrirAuditoria: true });
  }
  if (!lista.length) lista.push(alerta("Consolidado dentro das faixas principais", "Sem alerta crítico", ["g", "SAUDÁVEL"]));
  return lista;
}

export function pendentesAuditoria(dados: DadosPlanilha): AuditoriaOpItem[] {
  return (payloadDe<AuditoriaOpResp>(dados, "getAuditoriaOpItens")?.items ?? []).filter((x) => x.status === "aguardandoAprovacao");
}

/** Regras do painel pra contar faturamento de evento realizado: contrato assinado ou pagamento validado. */
function valorEvento(ev: EventoItem) {
  const assinado = /assinado/i.test(ev.statusContrato || "");
  const pag = String(ev.statusPagamento || "").toLowerCase();
  const validado = Boolean(pag) && !/n[ãa]o|pendente|aguardando|falta|parcial/.test(pag) && /pago|confirmado|quitado|recebid|liquidad|\bok\b/.test(pag);
  if (!assinado && !validado) return 0;
  const viaContrato = (Number(ev.valorContrato) || 0) + (Number(ev.valorExcedente) || 0);
  return viaContrato > 0 ? viaContrato : Number(ev.valorTotal) || 0;
}

export function eventosRealizados(dados: DadosPlanilha) {
  const itens = (payloadDe<EventosResp>(dados, "getEventos")?.items ?? []).filter((ev) => ev.status === "realizado" && ev.data);
  const porDia: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  itens.forEach((ev) => {
    const v = valorEvento(ev);
    porDia[ev.data] = (porDia[ev.data] || 0) + v;
    const mk = ev.data.slice(0, 7);
    porMes[mk] = (porMes[mk] || 0) + v;
  });
  return { porDia, porMes };
}

export function fmtDMA(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
}
export function periodoLabel(d1: string, d2: string) {
  return `(${fmtDMA(d1)} até ${fmtDMA(d2)})`;
}
export function ultimoDiaDoMes(mk: string) {
  const y = Number(mk.slice(0, 4));
  const m = Number(mk.slice(5, 7));
  return `${mk}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
}
