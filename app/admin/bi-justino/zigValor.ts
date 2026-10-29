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
    bebida?: { nome: string; quantidade?: number; valorTotal?: number; cmvPct?: number | null }[];
    comida?: { nome: string; quantidade?: number; valorTotal?: number; cmvPct?: number | null }[];
    bebidaCmv?: { nome: string; quantidade?: number; valorTotal?: number; cmvPct?: number | null }[];
    comidaCmv?: { nome: string; quantidade?: number; valorTotal?: number; cmvPct?: number | null }[];
    curvaAbc?: { nome: string; valorTotal?: number; pctAcumulado?: number; classe?: string }[];
    semFicha?: { nome: string; categoria?: string; tipo?: string; quantidade?: number; valorTotal?: number }[];
  } | null;
  horario?: { dias: number; pontos: { hora: string; valor: number }[]; porDia?: Record<string, { hora: string; valor: number }[]> } | null;
  publicoMes?: number | null;
  porDiaSemana?: {
    nome: string;
    dias: number;
    faturamento: number;
    publico: number;
    faturamentoMedio: number | null;
    publicoMedio: number | null;
    ticketMedio: number | null;
  }[];
  semanas?: { inicio: string; fim: string; faturamento: number; publico: number; ticket: number | null }[];
  eventosResumo?: {
    cotacoesAndamento: number;
    cotacoesFechadas: number;
    realizados: number;
    faturamentoMes: number;
    faturamentoAno: number;
    lista?: { data: string; cliente: string; tipo: string; pax: number; contrato: number; sinal: number; status: string }[];
  } | null;
  lancamentos?: Record<string, Record<string, number | string | null>[] > | null;
  projecao?: {
    faturamentoBruto: number | null;
    cmvReal: number | null;
    controlaveis: number | null;
    estruturais: number | null;
    margem: number | null;
    economia: number | null;
    bonusDestravado: number | null;
    envios?: {
      financeiro?: string | null;
      marketing?: string | null;
      rh?: string | null;
      operacao?: string | null;
      cmv?: string | null;
    };
  } | null;
  zigCarregando?: boolean;
}

export interface CampoZig {
  pronto: boolean;
  valor: number | null;
  detalhe: string | null;
  tipo?: "money" | "pct" | "int";
}

const PROJECAO = new Set([
  "Faturamento bruto mensal",
  "CMV real consolidado",
  "Custos controláveis acumulados",
  "Custos estruturais + variáveis",
  "Margem líquida",
  "Economia vs. meta",
  "Economia vs meta",
  "CMV real",
  "Bônus destravado",
  "Bônus projetado",
  "Bônus RH",
]);

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

function dataCurta(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function detalheEnvio(data: string | null | undefined, comEnvio: string, semEnvio: string) {
  const curta = dataCurta(data);
  return curta ? `${comEnvio} ${curta}.` : semEnvio;
}

const EXTRA_ZIG = new Set([
  "Faturamento projetado",
  "Público mês",
  "Público total do mês",
  "Serviço do mês",
  "CMO / receita (sem taxa de serviço)",
  "Cotações em andamento",
  "Cotações fechadas",
  "Eventos realizados",
  "Faturamento do ano (até hoje)",
  "ticket médio",
  "Ticket médio (R$) — vazio = últimas 8 semanas",
  "faturamento do mesmo mês do ano anterior",
  "CMV teórico (parcial)",
  "Cobertura ficha técnica",
]);

export function campoUsaZig(paginaId: string, campo: string) {
  if (PROJECAO.has(campo) || DIRETORIA.has(campo) || FINANCEIRO.has(campo) || CMV.has(campo) || EXTRA_ZIG.has(campo)) {
    return true;
  }
  if (paginaId === "eventos") {
    return campo === "Faturamento do mês" || campo === "Faturamento do ano (até hoje)";
  }
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

function valorProjecao(campo: string, zig: ZigAoVivo): CampoZig | null {
  const projecao = zig.projecao;
  if (campo === "Faturamento bruto mensal") {
    const valor = projecao?.faturamentoBruto ?? zig.faturamentoMes ?? null;
    if (valor == null) return null;
    return {
      pronto: true,
      valor,
      tipo: "money",
      detalhe: detalheEnvio(projecao?.envios?.financeiro, "Faturamento do mês. Último envio do Financeiro em", "Faturamento do mês, ZigPay mais eventos."),
    };
  }
  if (!projecao) return null;
  if (campo === "CMV real consolidado") {
    return {
      pronto: projecao.cmvReal != null,
      valor: projecao.cmvReal,
      tipo: "pct",
      detalhe: detalheEnvio(projecao.envios?.cmv, "Último envio de CMV em", "CMV ainda sem envio. O número é a referência do painel."),
    };
  }
  if (campo === "Custos controláveis acumulados") {
    return {
      pronto: projecao.controlaveis != null,
      valor: projecao.controlaveis,
      tipo: "money",
      detalhe: "Soma do último envio de Marketing, Financeiro, RH, Operação e CMV, sem impostos nem fee.",
    };
  }
  if (campo === "Margem líquida") {
    return {
      pronto: projecao.margem != null,
      valor: projecao.margem,
      tipo: "pct",
      detalhe: "Lucro do mês dividido pelo faturamento, com os últimos envios de cada área.",
    };
  }
  if (campo === "Economia vs. meta" || campo === "Economia vs meta") {
    return {
      pronto: projecao.economia != null,
      valor: projecao.economia,
      tipo: "money",
      detalhe: "Meta saudável de cada área menos o custo do último envio.",
    };
  }
  if (campo === "CMV real") {
    return {
      pronto: projecao.cmvReal != null,
      valor: projecao.cmvReal,
      tipo: "pct",
      detalhe: detalheEnvio(projecao.envios?.cmv, "Último envio de CMV em", "CMV ainda sem envio. O número é a referência do painel."),
    };
  }
  if (campo === "Bônus destravado" || campo === "Bônus projetado" || campo === "Bônus RH") {
    return {
      pronto: projecao.bonusDestravado != null,
      valor: projecao.bonusDestravado,
      tipo: "pct",
      detalhe: "Percentual do bônus liberado pela margem. Abaixo de 8% não destrava.",
    };
  }
  if (campo === "Custos estruturais + variáveis") {
    return {
      pronto: projecao.estruturais != null,
      valor: projecao.estruturais,
      tipo: "money",
      detalhe: detalheEnvio(projecao.envios?.financeiro, "Impostos e fee do Financeiro em", "Impostos e fee ainda na referência do painel."),
    };
  }
  return null;
}

function custoArea(zig: ZigAoVivo, label: string) {
  return (zig.custos || []).find((item) => item.label === label)?.valor ?? null;
}

function tipoDeCampo(paginaId: string, campo: string): CampoZig["tipo"] {
  if (paginaId === "cmv" || /cobertura|cmv|cmo \/|bônus|bonus|margem/i.test(campo)) return "pct";
  if (/cotações|eventos realizados|público|reservas da semana/i.test(campo)) return "int";
  return "money";
}

function valorDe(paginaId: string, campo: string, zig: ZigAoVivo) {
  if (paginaId === "cmv" || CMV.has(campo) || campo === "CMV teórico (parcial)" || campo === "Cobertura ficha técnica") {
    if (campo === "CMV teórico (parcial)") {
      const doc = ultimoCmv(zig);
      if (!doc) return null;
      if (doc.cmvComida != null && doc.cmvBebida != null) return (doc.cmvComida + doc.cmvBebida) / 2;
      return doc.cmvComida ?? doc.cmvBebida;
    }
    return valorCmv(campo, zig);
  }
  if (paginaId === "eventos" && campo === "Faturamento do mês") {
    return zig.eventosResumo?.faturamentoMes ?? zig.eventosMes ?? null;
  }
  if (campo === "Faturamento Projetado (Marketing)" || campo === "Faturamento projetado") return zig.projetadoMes ?? null;
  if (campo === "Faturamento do mês" || campo === "Faturamento bruto (acumulado do mês)") return zig.faturamentoMes ?? null;
  if (campo === "Mesmo mês, ano anterior" || campo === "faturamento do mesmo mês do ano anterior") return zig.mesmoMesAnoAnterior ?? null;
  if (campo === "Média mensal do ano") return zig.mediaMensal ?? null;
  if (campo === "Semana: projetado × faturado" || campo === "Semana atual vs ano anterior") return zig.semanaFaturado ?? null;
  if (campo === "Ticket médio • semana" || campo === "ticket médio" || campo === "Ticket médio (R$) — vazio = últimas 8 semanas") {
    return zig.ticketSemana ?? zig.ticketMes ?? null;
  }
  if (campo === "Ticket médio • mês") return zig.ticketMes ?? null;
  if (campo === "Ticket médio • ano") return zig.ticketAno ?? null;
  if (campo === "Público mês" || campo === "Público total do mês") return zig.publicoMes ?? null;
  if (campo === "Serviço do mês") return zig.servicoMes ?? null;
  if (campo === "Cotações em andamento") return zig.eventosResumo?.cotacoesAndamento ?? null;
  if (campo === "Cotações fechadas") return zig.eventosResumo?.cotacoesFechadas ?? null;
  if (campo === "Eventos realizados") return zig.eventosResumo?.realizados ?? null;
  if (campo === "Faturamento do ano (até hoje)") return zig.eventosResumo?.faturamentoAno ?? null;
  if (campo === "CMO / receita (sem taxa de serviço)") {
    const rh = custoArea(zig, "RH");
    if (rh == null || !zig.faturamentoMes) return null;
    return Math.round((rh / zig.faturamentoMes) * 10000) / 100;
  }
  return null;
}

export function campoZig(paginaId: string, campo: string, zig: ZigAoVivo | null | undefined): CampoZig | null {
  if (!campoUsaZig(paginaId, campo)) return null;
  if (!zig?.disponivel) return { pronto: false, valor: null, detalhe: null };
  if (PROJECAO.has(campo)) return valorProjecao(campo, zig);
  const detalhe = paginaId === "eventos" || paginaId === "cmv" ? null : detalheDe(campo, zig);
  const valor = valorDe(paginaId, campo, zig);
  return { pronto: valor != null, valor, detalhe, tipo: tipoDeCampo(paginaId, campo) };
}

const DIAS_UTEIS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function porDiaDaSemana(zig: ZigAoVivo | null | undefined) {
  if (zig?.porDiaSemana?.length) return zig.porDiaSemana;
  const acc: Record<string, { dias: number; faturamento: number }> = {};
  DIAS_UTEIS.forEach((nome) => {
    acc[nome] = { dias: 0, faturamento: 0 };
  });
  for (const ponto of zig?.serieMes || []) {
    const dia = ponto.dia;
    if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;
    const [ano, mes, d] = dia.split("-").map(Number);
    const nome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date(Date.UTC(ano, mes - 1, d)).getUTCDay()];
    if (!nome || !acc[nome]) continue;
    acc[nome].dias += 1;
    acc[nome].faturamento += (ponto.zig || 0) + (ponto.eventos || 0);
  }
  return DIAS_UTEIS.map((nome) => ({
    nome,
    dias: acc[nome].dias,
    faturamento: acc[nome].faturamento,
    publico: 0,
    faturamentoMedio: acc[nome].dias ? acc[nome].faturamento / acc[nome].dias : null,
    publicoMedio: null,
    ticketMedio: null,
  }));
}

export function avisoZig(zig: ZigAoVivo | null | undefined) {
  if (!zig || zig.disponivel) return null;
  if (zig.motivo === "credenciais_ausentes") return "Nada da planilha entra porque faltam, no serviço da API no Render, BI_APPS_SCRIPT_EMAIL e BI_APPS_SCRIPT_PASSWORD. Instagram, Microsoft e ZigPay não abrem essa planilha.";
  if (zig.motivo === "aguardando_coleta") return "A cópia da planilha ainda não está no banco. O servidor está gravando agora.";
  if (zig.motivo === "login_recusado") return "O painel do Renato recusou o e-mail ou a senha. No Render, confira BI_APPS_SCRIPT_EMAIL e BI_APPS_SCRIPT_PASSWORD. ROBOT_EMAIL e ROBOT_PASSWORD também servem.";
  if (zig.motivo === "forbidden") return "A conta do robô ainda não tem acesso ao financeiro.";
  return "Não consegui ler o faturamento da Zig agora.";
}
