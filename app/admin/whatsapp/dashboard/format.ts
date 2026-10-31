const BRL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const BRL1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function fmtInt(valor: number | null | undefined) {
  return BRL.format(Number(valor) || 0);
}

export function fmt1(valor: number | null | undefined) {
  return BRL1.format(Number(valor) || 0);
}

export function fmtPct(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return `${fmt1(valor)}%`;
}

export function fmtHoras(valor: number | null | undefined) {
  if (valor == null) return "—";
  return `${fmt1(valor)}h`;
}

export function fmtVar(valor: number | null | undefined) {
  if (valor == null) return "sem base";
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${fmt1(valor)}% vs período anterior`;
}

export function hojeSp() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function acrescentarDias(iso: string, dias: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function ultimaJanela(dias: number) {
  const fim = hojeSp();
  return { inicio: acrescentarDias(fim, -(dias - 1)), fim };
}

export function dataCurta(iso: string) {
  const [, m, d] = (iso || "").split("-");
  if (!m || !d) return iso;
  return `${d}/${m}`;
}
