export interface ZigAoVivo {
  disponivel: boolean;
  motivo?: string | null;
  capturedAt?: string | null;
  mes?: string | null;
  faturamentoMes?: number | null;
  zigMes?: number | null;
  eventosMes?: number | null;
  projetadoMes?: number | null;
  mediaMensal?: number | null;
  mesmoMesAnoAnterior?: number | null;
  semanaFaturado?: number | null;
  semanaProjetado?: number | null;
  semanaAnoAnterior?: number | null;
  semanaInicio?: string | null;
  semanaFim?: string | null;
  semanaAnterior?: boolean;
  ticketSemana?: number | null;
  ticketMes?: number | null;
  ticketAno?: number | null;
}

export interface CampoZig {
  pronto: boolean;
  valor: number | null;
  detalhe: string | null;
}

const DIRETORIA = new Set([
  "Faturamento Projetado (Marketing)",
  "Faturamento do mês",
  "Mesmo mês, ano anterior",
  "Média mensal do ano",
  "Semana: projetado × faturado",
  "Semana atual vs ano anterior",
  "Ticket médio • semana",
  "Ticket médio • mês",
  "Ticket médio • ano",
]);

const FINANCEIRO = new Set([
  "Faturamento do mês",
  "Faturamento bruto (acumulado do mês)",
]);

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function campoUsaZig(paginaId: string, campo: string) {
  if (paginaId === "master") return DIRETORIA.has(campo);
  if (paginaId === "financeiro") return FINANCEIRO.has(campo);
  if (paginaId === "eventos") return campo === "Faturamento do mês";
  return false;
}

export function rotuloMes(mes: string | null | undefined) {
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return mes || "—";
  const [ano, ordem] = mes.split("-");
  return `${MESES[Number(ordem) - 1] || ordem}/${ano}`;
}

function reais(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function detalheDe(campo: string, zig: ZigAoVivo) {
  if (campo === "Faturamento do mês" || campo === "Faturamento bruto (acumulado do mês)") {
    return `ZigPay ${reais(zig.zigMes)} + Eventos ${reais(zig.eventosMes)}`;
  }
  if (campo === "Semana: projetado × faturado") {
    const projetado = zig.semanaProjetado == null
      ? "Marketing ainda não projetou esta semana"
      : `Projetado ${reais(zig.semanaProjetado)}`;
    return zig.semanaAnterior ? `${projetado} · semana anterior` : projetado;
  }
  if (campo === "Semana atual vs ano anterior") {
    if (zig.semanaAnoAnterior == null) return "Ainda sem a mesma semana no ano anterior";
    return `Ano anterior ${reais(zig.semanaAnoAnterior)}`;
  }
  return null;
}

function valorDe(paginaId: string, campo: string, zig: ZigAoVivo) {
  if (paginaId === "eventos" && campo === "Faturamento do mês") return zig.eventosMes ?? null;
  if (campo === "Faturamento Projetado (Marketing)") return zig.projetadoMes ?? null;
  if (campo === "Faturamento do mês" || campo === "Faturamento bruto (acumulado do mês)") return zig.faturamentoMes ?? null;
  if (campo === "Mesmo mês, ano anterior") return zig.mesmoMesAnoAnterior ?? null;
  if (campo === "Média mensal do ano") return zig.mediaMensal ?? null;
  if (campo === "Semana: projetado × faturado" || campo === "Semana atual vs ano anterior") return zig.semanaFaturado ?? null;
  if (campo === "Ticket médio • semana") return zig.ticketSemana ?? null;
  if (campo === "Ticket médio • mês") return zig.ticketMes ?? null;
  if (campo === "Ticket médio • ano") return zig.ticketAno ?? null;
  return null;
}

export function campoZig(paginaId: string, campo: string, zig: ZigAoVivo | null | undefined): CampoZig | null {
  if (!campoUsaZig(paginaId, campo)) return null;
  if (!zig?.disponivel) return { pronto: false, valor: null, detalhe: null };
  const detalhe = paginaId === "eventos" ? null : detalheDe(campo, zig);
  return { pronto: true, valor: valorDe(paginaId, campo, zig), detalhe };
}

export function avisoZig(zig: ZigAoVivo | null | undefined) {
  if (!zig || zig.disponivel) return null;
  if (zig.motivo === "credenciais_ausentes") return "Faturamento da Zig aguardando o login do painel no Render.";
  if (zig.motivo === "login_recusado") return "O painel recusou o login do robô.";
  if (zig.motivo === "forbidden") return "A conta do robô ainda não tem acesso ao financeiro.";
  return "Não consegui ler o faturamento da Zig agora.";
}
