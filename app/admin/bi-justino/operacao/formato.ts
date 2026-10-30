/** Helpers de formatação iguais aos do painel do Renato (brl, fmtDate, fmtTime, monthKeyLabel…). */

export const DIA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const DIA_LONGO = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
export const MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function diaSemana(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function deslocarDias(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** fmtDate do HTML: "seg 30/10/2026". */
export function fmtData(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${DIA_CURTO[diaSemana(iso.slice(0, 10))]} ${d}/${m}/${y}`;
}

/** fmtDMA do HTML: "30/10/26". */
export function fmtDma(iso: string | null | undefined) {
  if (!iso || iso.length < 10) return "—";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
}

/** fmtTime do HTML: "30/10 18:04". */
export function fmtHora(iso: string | number | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function fmtDataHora(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

export function brl(valor: number | string | null | undefined) {
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return "R$ 0";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function brlCent(valor: number | null | undefined) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(valor: number | null | undefined, casas = 1) {
  if (valor == null || !Number.isFinite(valor)) return "—";
  return `${valor.toFixed(casas).replace(".", ",")}%`;
}

export function monthKeyLabel(mk: string) {
  if (!/^\d{4}-\d{2}/.test(mk)) return mk;
  const mes = Number(mk.slice(5, 7));
  return `${MES_LONGO[mes - 1] ?? mk.slice(5, 7)}/${mk.slice(0, 4)}`;
}

export function mesAnterior(hoje: string) {
  const [ano, mes] = hoje.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** parseBRL do HTML: aceita "1.234,56" ou "1234.56". */
export function parseBrl(texto: string) {
  const bruto = String(texto || "").trim();
  if (!bruto) return 0;
  let normal = bruto;
  if (bruto.includes(",")) normal = bruto.replace(/\./g, "").replace(",", ".");
  const n = Number(normal.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function segundaDe(iso: string) {
  const dow = diaSemana(iso);
  return deslocarDias(iso, dow === 0 ? -6 : 1 - dow);
}

export function datasDaSemana(segunda: string) {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => deslocarDias(segunda, i));
}
