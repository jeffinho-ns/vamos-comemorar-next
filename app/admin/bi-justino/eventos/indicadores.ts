import type { Cotacao, Evento } from "./tipos";

/** MESMA conta de computeEventosIndicadores()/valorEventoClient() do painel do Renato. */

export function contratoAssinado(ev: Evento) {
  return /assinado/i.test(String(ev.statusContrato || ""));
}

export function pagamentoValidado(ev: Evento) {
  const txt = String(ev.statusPagamento || "").toLowerCase();
  if (!txt) return false;
  if (/n[ãa]o|pendente|aguardando|falta|parcial/.test(txt)) return false;
  return /pago|confirmado|quitado|recebid|liquidad|\bok\b/.test(txt);
}

export function pagamentoDuvidoso(ev: Evento) {
  if (contratoAssinado(ev)) return false;
  return /parcial/i.test(String(ev.statusPagamento || ""));
}

export function valorEventoBruto(ev: Evento) {
  const viaContrato = (Number(ev.valorContrato) || 0) + (Number(ev.valorExcedente) || 0);
  return viaContrato > 0 ? viaContrato : (Number(ev.valorTotal) || 0);
}

export function valorEventoSistema(ev: Evento) {
  if (!contratoAssinado(ev) && !pagamentoValidado(ev)) return 0;
  return valorEventoBruto(ev);
}

const soma = <T,>(lista: T[], fn: (item: T) => number) => lista.reduce((s, item) => s + fn(item), 0);

export interface IndicadoresEventos {
  emAndamentoCount: number;
  emAndamentoValor: number;
  realizadosMesCount: number;
  realizadosMesValor: number;
  fatMesAtual: number;
  fatMesAnoAnterior: number;
  fatAnoAtual: number;
  fatAnoAnterior: number;
  cotEnviadasAnoAtual: number;
  cotEnviadasAnoAnterior: number;
  duvidosos: Evento[];
  duvidososValor: number;
  mesAtualKey: string;
  anoAtual: number;
  anoAnterior: number;
}

export function calcularIndicadores(eventos: Evento[], cotacoes: Cotacao[], hojeIso: string): IndicadoresEventos {
  const anoAtual = Number(hojeIso.slice(0, 4));
  const mesAtualKey = hojeIso.slice(0, 7);
  const anoAnterior = anoAtual - 1;
  const mesAnoAnteriorKey = `${anoAnterior}-${hojeIso.slice(5, 7)}`;
  const cutoffAnoAnterior = `${anoAnterior}${hojeIso.slice(4)}`;
  const realizados = eventos.filter((ev) => ev.status === "realizado" && ev.data);
  const emAndamento = cotacoes.filter((c) => ["rascunho", "aguardando_aprovacao", "aprovado"].includes(c.status));
  const realizadosMes = realizados.filter((ev) => ev.data.slice(0, 7) === mesAtualKey);
  const duvidosos = realizados.filter(pagamentoDuvidoso);
  const fatMesAtual = soma(realizadosMes, valorEventoSistema);
  return {
    emAndamentoCount: emAndamento.length,
    emAndamentoValor: soma(emAndamento, (c) => Number(c.valorTotal) || 0),
    realizadosMesCount: realizadosMes.length,
    realizadosMesValor: fatMesAtual,
    fatMesAtual,
    fatMesAnoAnterior: soma(realizados.filter((ev) => ev.data.slice(0, 7) === mesAnoAnteriorKey), valorEventoSistema),
    fatAnoAtual: soma(realizados.filter((ev) => ev.data.slice(0, 4) === String(anoAtual) && ev.data <= hojeIso), valorEventoSistema),
    fatAnoAnterior: soma(realizados.filter((ev) => ev.data.slice(0, 4) === String(anoAnterior) && ev.data <= cutoffAnoAnterior), valorEventoSistema),
    cotEnviadasAnoAtual: cotacoes.filter((c) => c.status === "enviado" && c.dataEvento && String(c.dataEvento).slice(0, 4) === String(anoAtual)).length,
    cotEnviadasAnoAnterior: cotacoes.filter((c) => c.status === "enviado" && c.dataEvento && String(c.dataEvento).slice(0, 4) === String(anoAnterior)).length,
    duvidosos,
    duvidososValor: soma(duvidosos, valorEventoBruto),
    mesAtualKey,
    anoAtual,
    anoAnterior,
  };
}

/** Faturamento de eventos realizados por mês — 12 meses seguidos terminando no mês atual (0 onde não há). */
export function faturamentoPorMes(eventos: Evento[], hojeIso: string) {
  const somas: Record<string, number> = {};
  eventos.filter((ev) => ev.status === "realizado" && ev.data).forEach((ev) => {
    const mk = ev.data.slice(0, 7);
    somas[mk] = (somas[mk] || 0) + valorEventoSistema(ev);
  });
  const ano = Number(hojeIso.slice(0, 4));
  const mes = Number(hojeIso.slice(5, 7));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (11 - i), 1));
    const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { mes: mk, valor: somas[mk] || 0 };
  });
}

/** Pax de eventos por dia (todo evento agendado conta, menos cancelado) — quadro de reservas. */
export function eventosPaxPorData(eventos: Evento[]) {
  const out: Record<string, number> = {};
  eventos.filter((ev) => ev.status !== "cancelado" && ev.data).forEach((ev) => { out[ev.data] = (out[ev.data] || 0) + (Number(ev.pax) || 0); });
  return out;
}
