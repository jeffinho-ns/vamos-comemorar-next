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
  serieMes?: { dia: string; rotulo?: string; zig: number; eventos: number }[];
  serieAno?: { mes: string; rotulo?: string; zig: number; eventos: number }[];
  custos?: { label: string; valor: number }[];
  servicoMes?: number | null;
  bilheteria?: { mes: string; receita: number; entradasQtd: number; publicoMes: number; pctClientesEntradas: number | null }[];
  cmvZig?: { date?: string; cmvComida: number | null; cmvBebida: number | null; cobertura: number | null }[];
  ranking?: {
    bebida?: { nome: string; quantidade?: number; valorTotal?: number }[];
    comida?: { nome: string; quantidade?: number; valorTotal?: number }[];
  } | null;
  zigCarregando?: boolean;
}

export interface CampoZig {
  pronto: boolean;
  valor: number | null;
  detalhe: string | null;
  tipo?: "money" | "pct";
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

const CMV = new Set([
  "CMV teórico (parcial) • comida",
  "Comida • CMV s/ cobertura",
  "CMV teórico (parcial) • bebida",
  "Bebida • CMV s/ cobertura",
  "Cobertura ficha técnica",
  "Comida • cobertura",
  "Bebida • cobertura",
]);

export function campoUsaZig(paginaId: string, campo: string) {
  if (paginaId === "master") return DIRETORIA.has(campo);
  if (paginaId === "financeiro") return FINANCEIRO.has(campo);
  if (paginaId === "eventos") return campo === "Faturamento do mês";
  if (paginaId === "cmv") return CMV.has(campo);
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

function ultimoCmv(zig: ZigAoVivo) {
  return Array.isArray(zig.cmvZig) && zig.cmvZig.length ? zig.cmvZig[0] : null;
}

function valorCmv(campo: string, zig: ZigAoVivo) {
  const doc = ultimoCmv(zig);
  if (!doc) return null;
  const nome = campo.toLowerCase();
  if (nome.includes("bebida") && nome.includes("cmv")) return doc.cmvBebida;
  if (nome.includes("comida") && nome.includes("cmv")) return doc.cmvComida;
  if (nome.includes("cobertura")) return doc.cobertura;
  return null;
}

function valorDe(paginaId: string, campo: string, zig: ZigAoVivo) {
  if (paginaId === "cmv") return valorCmv(campo, zig);
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
  const detalhe = paginaId === "eventos" || paginaId === "cmv" ? null : detalheDe(campo, zig);
  return { pronto: true, valor: valorDe(paginaId, campo, zig), detalhe, tipo: paginaId === "cmv" ? "pct" : "money" };
}

export function avisoZig(zig: ZigAoVivo | null | undefined) {
  if (!zig || zig.disponivel) return null;
  if (zig.motivo === "credenciais_ausentes") return "Falta no Render o login do painel: BI_APPS_SCRIPT_EMAIL e BI_APPS_SCRIPT_PASSWORD. Sem esses dois o servidor não entra nas planilhas.";
  if (zig.motivo === "aguardando_coleta") return "A primeira cópia da ZigPay ainda está sendo gravada no banco.";
  if (zig.motivo === "login_recusado") return "O painel recusou o login do robô.";
  if (zig.motivo === "forbidden") return "A conta do robô ainda não tem acesso ao financeiro.";
  return "Não consegui ler o faturamento da Zig agora.";
}
