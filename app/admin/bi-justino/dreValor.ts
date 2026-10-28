export interface DreAoVivo {
  disponivel: boolean;
  motivo?: string | null;
  capturedAt?: string | null;
  mes?: string | null;
  mesKey?: string | null;
  valores?: Record<string, number>;
  fallbacks?: Record<string, string>;
  naoAchados?: string[];
}

export interface CampoDre {
  pronto: boolean;
  valor: number | null;
  tipo: "money" | "pct" | "texto";
  texto: string | null;
  detalhe: string | null;
}

const FORMULARIO: Record<string, string> = {
  "Total Impostos S/ Faturamento": "tax",
  "Taxas de Cartões": "card",
  "Administração/Gestão": "fee",
  "IRPJ + CSLL": "incomeTax",
  "Aluguel Bar + IPTU": "rent",
  "Energia Elétrica": "energy",
  "Água / Esgoto": "water",
  "Gás": "gas",
  Descartáveis: "disposable",
  "Segurança Noturna e Diurna / Rádios": "security",
  "Despesas Administrativas": "adminFixed",
  "Outras Despesas/Itens Extraordinários": "financeOther",
};

const CUSTOS = ["rent", "energy", "water", "gas", "disposable", "security", "adminFixed", "financeOther"];
const UTILIDADES = ["energy", "water", "gas"];

const CATEGORIAS: { chave: string; label: string }[] = [
  { chave: "rent", label: "Aluguel Bar + IPTU" },
  { chave: "energy", label: "Energia Elétrica" },
  { chave: "water", label: "Água / Esgoto" },
  { chave: "gas", label: "Gás" },
  { chave: "disposable", label: "Descartáveis" },
  { chave: "security", label: "Segurança Noturna e Diurna / Rádios" },
  { chave: "adminFixed", label: "Despesas Administrativas" },
  { chave: "financeOther", label: "Outras Despesas/Itens Extraordinários" },
];

export function campoUsaDre(paginaId: string, campo: string) {
  if (paginaId !== "financeiro") return false;
  return campo === "Mês de referência"
    || campo === "Custos Financeiro"
    || campo === "Economia vs meta"
    || campo === "Utilidades"
    || campo === "Cartões"
    || Boolean(FORMULARIO[campo]);
}

function numero(dre: DreAoVivo, chave: string) {
  const valor = dre.valores?.[chave];
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function soma(dre: DreAoVivo, chaves: string[]) {
  let total = 0;
  let achou = false;
  for (const chave of chaves) {
    const valor = numero(dre, chave);
    if (valor == null) continue;
    achou = true;
    total += valor;
  }
  return achou ? total : null;
}

function faturamentoDe(dre: DreAoVivo, faturamento: number | null | undefined) {
  if (typeof faturamento === "number" && faturamento > 0) return faturamento;
  const receita = numero(dre, "revenue");
  return receita && receita > 0 ? receita : null;
}

function economia(dre: DreAoVivo, faturamento: number | null) {
  const custos = soma(dre, CUSTOS);
  const aluguel = numero(dre, "rent") || 0;
  if (custos == null || faturamento == null) return null;
  const meta = aluguel
    + Math.max(18000, faturamento * 0.03)
    + faturamento * 0.015
    + faturamento * 0.015
    + 25000
    + 3000;
  return meta - custos;
}

export function campoDre(
  paginaId: string,
  campo: string,
  dre: DreAoVivo | null | undefined,
  faturamento: number | null | undefined,
): CampoDre | null {
  if (!campoUsaDre(paginaId, campo)) return null;
  if (!dre?.disponivel) return { pronto: false, valor: null, tipo: "money", texto: null, detalhe: null };
  const base = faturamentoDe(dre, faturamento);
  if (campo === "Mês de referência") {
    return { pronto: true, valor: null, tipo: "texto", texto: dre.mes || "—", detalhe: null };
  }
  if (campo === "Custos Financeiro") {
    return { pronto: true, valor: soma(dre, CUSTOS), tipo: "money", texto: null, detalhe: dre.mes || null };
  }
  if (campo === "Utilidades") {
    return { pronto: true, valor: soma(dre, UTILIDADES), tipo: "money", texto: null, detalhe: "Energia, água e gás" };
  }
  if (campo === "Economia vs meta") {
    return { pronto: true, valor: economia(dre, base), tipo: "money", texto: null, detalhe: "Meta de custo menos o custo do mês" };
  }
  if (campo === "Cartões") {
    const valor = numero(dre, "card");
    if (valor == null || base == null) {
      return { pronto: true, valor, tipo: "money", texto: null, detalhe: dre.fallbacks?.card ? `Usando ${dre.fallbacks.card}` : null };
    }
    return {
      pronto: true,
      valor: Math.round((valor / base) * 10000) / 100,
      tipo: "pct",
      texto: null,
      detalhe: dre.fallbacks?.card ? `Usando ${dre.fallbacks.card}` : null,
    };
  }
  const chave = FORMULARIO[campo];
  return {
    pronto: true,
    valor: numero(dre, chave),
    tipo: "money",
    texto: null,
    detalhe: dre.fallbacks?.[chave] ? `Usando ${dre.fallbacks[chave]}` : null,
  };
}

export function linhasCusto(dre: DreAoVivo | null | undefined) {
  if (!dre?.disponivel) return [];
  const valores = CATEGORIAS.map((item) => ({ ...item, valor: numero(dre, item.chave) || 0 }));
  const total = valores.reduce((somaAtual, item) => somaAtual + item.valor, 0);
  return valores.map((item) => ({
    label: item.label,
    valor: item.valor,
    participacao: total > 0 ? (item.valor / total) * 100 : 0,
  }));
}

export function linhasAlerta(dre: DreAoVivo | null | undefined, faturamento: number | null | undefined) {
  if (!dre?.disponivel) return [];
  const base = faturamentoDe(dre, faturamento) || 0;
  const cartoes = base > 0 && numero(dre, "card") != null ? (numero(dre, "card") as number) / base * 100 : null;
  const utilidades = soma(dre, UTILIDADES);
  const descartaveis = numero(dre, "disposable");
  const admin = numero(dre, "adminFixed");
  return [
    faixa("Cartões", cartoes, 2.1, 2.4, true),
    faixa("Utilidades", utilidades, Math.max(18000, base * 0.03), Math.max(22000, base * 0.04), false),
    faixa("Descartáveis", descartaveis, base * 0.015, base * 0.02, false),
    faixa("Administrativo fixo", admin, 25000, 30000, false),
  ];
}

function faixa(categoria: string, valor: number | null, saudavel: number, atencao: number, percentual: boolean) {
  if (valor == null) return { nivel: "—", categoria, alerta: "Sem valor na DRE" };
  const nivel = valor <= saudavel ? "Saudável" : valor <= atencao ? "Atenção" : "Crítico";
  const texto = percentual
    ? `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
    : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return { nivel, categoria, alerta: texto };
}

export function avisoDre(dre: DreAoVivo | null | undefined) {
  if (!dre || dre.disponivel) return null;
  if (dre.motivo === "credenciais_ausentes") return "A DRE aguarda as variáveis da Microsoft no Render.";
  if (dre.motivo === "login_recusado") return "A Microsoft recusou o acesso à planilha da DRE.";
  if (dre.motivo === "mes_nao_achado") return "A planilha da DRE não tem a coluna do mês anterior.";
  return "Não consegui ler a DRE agora.";
}
