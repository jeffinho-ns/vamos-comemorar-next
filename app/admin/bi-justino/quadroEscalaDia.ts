import type { ZigAoVivo } from "./zigValor";

type Colaborador = NonNullable<ZigAoVivo["colaboradores"]>[number];
type Bloco = { clock: string; fracao: number };
type Pedido = NonNullable<ZigAoVivo["freelancers"]>[number];

const CURTO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CHEIO = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const ORDEM = ["gerencia", "salao", "caixa", "cumim", "runner", "bar", "cozinha", "limpeza", "seguranca", "estoquista", "manutencao", "outros"];
const SETOR: Record<string, string> = {
  salao: "Garçom", cumim: "Cumim", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza",
  seguranca: "Segurança", caixa: "Caixa/Hostess", runner: "Runner/RP", manutencao: "Manutenção", estoquista: "Estoquista",
};
const LIDER = ["chefeBar", "chefeCozinha", "chefeCaixa", "maitre"];
const SUB = ["chefeFila", "subchefeBar", "subchefeCozinha"];
const NIVEL: Record<string, number> = { senior: 3, pleno: 4, junior: 5 };

export type CelulaCalor = { clock: string; t: number; semDado: boolean; pico: boolean; horaCheia: boolean };
export type LinhaDia = {
  id: string;
  nome: string;
  setor: string;
  tipo: string;
  folga: boolean;
  ferias: boolean;
  entrada: string;
  saida: string;
  pausa: string | null;
  almoco: string;
  jantar: string;
  barras: CelulaCalor[];
  freelancer: boolean;
};

export type QuadroDia = {
  paxTexto: string;
  estimado: boolean;
  nota: string;
  linhas: LinhaDia[];
};

function dow(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

function minutos(hhmm: string) {
  const [hora, minuto] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(hora) || !Number.isFinite(minuto)) return null;
  return hora * 60 + minuto;
}

function relogio(total: number) {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function feriasAtivas(pessoa: Colaborador, date: string) {
  return Boolean(pessoa.feriasInicio && pessoa.feriasFim && date >= pessoa.feriasInicio && date <= pessoa.feriasFim);
}

function setorDe(pessoa: Colaborador) {
  if (pessoa.funcaoCargo === "gerente") return "gerencia";
  return ORDEM.includes(pessoa.cargo) ? pessoa.cargo : "outros";
}

function rankDe(pessoa: Colaborador) {
  const funcao = pessoa.funcaoCargo || "";
  if (funcao === "gerente") return 0;
  if (LIDER.includes(funcao)) return 1;
  if (SUB.includes(funcao)) return 2;
  return NIVEL[pessoa.nivel || ""] ?? 4;
}

function pausaSugerida(entrada: string, saida: string, blocos: Bloco[]) {
  const ini = minutos(entrada);
  let fim = minutos(saida);
  if (ini == null || fim == null) return null;
  if (fim <= ini) fim += 1440;
  const ordenados = [...blocos].sort((a, b) => a.clock.localeCompare(b.clock));
  let melhor: string | null = null;
  let menor = Infinity;
  for (let i = 0; i < ordenados.length - 1; i += 1) {
    const a = minutos(ordenados[i].clock);
    const b = minutos(ordenados[i + 1].clock);
    if (a == null || b == null || b !== a + 30) continue;
    let aa = a;
    let bb = b;
    if (fim > 1440 && aa < ini) aa += 1440;
    if (fim > 1440 && bb < ini) bb += 1440;
    if (aa < ini || bb >= fim) continue;
    const soma = ordenados[i].fracao + ordenados[i + 1].fracao;
    if (soma < menor) {
      menor = soma;
      melhor = `${ordenados[i].clock} – ${relogio(b + 30)}`;
    }
  }
  return melhor;
}

function barrasDoTurno(entrada: string, saida: string, blocos: Bloco[]): CelulaCalor[] {
  const ini = minutos(entrada);
  let fim = minutos(saida);
  if (ini == null || fim == null || !blocos.length) return [];
  if (fim <= ini) fim += 1440;
  const valores = blocos.map((bloco) => bloco.fracao);
  const minV = Math.min(...valores);
  const maxV = Math.max(...valores);
  const faixa = Math.max(1e-9, maxV - minV);
  const n = Math.max(1, Math.round((fim - ini) / 30));
  const info = Array.from({ length: n }, (_, i) => {
    const m = (ini + i * 30) % 1440;
    const clock = relogio(m);
    const achado = blocos.find((bloco) => bloco.clock === clock);
    return { clock, m, v: achado ? achado.fracao : null };
  });
  let pico = -1;
  let picoV = -Infinity;
  info.forEach((bloco, i) => {
    if (bloco.v != null && bloco.v > picoV) {
      picoV = bloco.v;
      pico = i;
    }
  });
  return info.map((bloco, i) => ({
    clock: bloco.clock,
    t: bloco.v == null ? 0 : Math.max(0, Math.min(1, (bloco.v - minV) / faixa)),
    semDado: bloco.v == null,
    pico: i === pico && bloco.v != null,
    horaCheia: bloco.m % 60 === 0,
  }));
}

function reais(valor: number, casas: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function publicoEsperado(date: string, zig: ZigAoVivo, hoje: string) {
  const indice = dow(date);
  const nome = CHEIO[indice];
  const curto = CURTO[indice];
  const reserva = (zig.reservas || []).find((item) => item.date === date);
  const diaZig = (zig.diasZig || []).find((item) => item.date === date);
  const historico = (zig.diasZig || []).filter((item) => item.date < hoje && dow(item.date) === indice && (item.publico || 0) > 0);
  if (date < hoje && diaZig && diaZig.publico != null) {
    return { pax: diaZig.publico, fonte: "público real do ZigPay", reservado: reserva?.pax || 0, nome };
  }
  if (reserva && reserva.pax > 0) {
    const fator = (zig.reservaFator || []).find((item) => item.nome === curto);
    if (fator && fator.fator && fator.fator > 1) {
      return {
        pax: Math.round(reserva.pax * fator.fator),
        fonte: `${reserva.pax} pax em reserva × ${fator.fator.toFixed(2)} (histórico: público real ÷ reservado em ${fator.n} ${nome.toLowerCase()}(s))`,
        reservado: reserva.pax,
        nome,
      };
    }
    return { pax: reserva.pax, fonte: `${reserva.pax} pax em reserva lançados pro dia`, reservado: reserva.pax, nome };
  }
  if (diaZig && diaZig.publico != null) return { pax: diaZig.publico, fonte: "público real do ZigPay", reservado: 0, nome };
  const media = historico.length ? Math.round(historico.reduce((soma, item) => soma + (item.publico || 0), 0) / historico.length) : 0;
  return { pax: media, fonte: historico.length ? `média histórica de ${nome}` : "média histórica", reservado: 0, nome };
}

function notaEstimada(date: string, zig: ZigAoVivo, pax: number, nome: string, nDias: number) {
  const indice = dow(date);
  const base = (zig.calor?.datas || []).filter((dia) => dia !== date && dow(dia) === indice);
  const dias = (zig.diasZig || []).filter((item) => base.includes(item.date));
  let somaRevPub = 0;
  let somaPub = 0;
  let nComPub = 0;
  let somaRev = 0;
  let nComRev = 0;
  dias.forEach((item) => {
    if (!(item.receita > 0)) return;
    nComRev += 1;
    somaRev += item.receita;
    if ((item.publico || 0) > 0) {
      somaRevPub += item.receita;
      somaPub += item.publico || 0;
      nComPub += 1;
    }
  });
  const cabeca = `Calor estimado, não é captura real desse dia. Esse dia ainda não tem captura própria (dia futuro, ou o robô ainda não passou por ele) — a cobertura abaixo e a sugestão de horário usam a média de ${nDias} ${nome.toLowerCase()}(s) anterior(es) já capturado(s), ponderada pelo formato real de cada um.`;
  if (nComPub > 0) {
    const ticket = somaRevPub / somaPub;
    return `${cabeca} Faturamento provisionado: ${reais(pax * ticket, 0)} — ticket médio histórico de ${nome.toLowerCase()} (${reais(ticket, 2)}, ${nComPub} dia(s) com público registrado) × público esperado deste dia (${pax.toLocaleString("pt-BR")}).`;
  }
  if (nComRev > 0) {
    return `${cabeca} Faturamento provisionado: ${reais(somaRev / nComRev, 0)} — média de faturamento de ${nComRev} ${nome.toLowerCase()}(s) anterior(es).`;
  }
  return cabeca;
}

function linhaColaborador(pessoa: Colaborador, date: string, blocos: Bloco[]): LinhaDia {
  const indice = dow(date);
  const dia = pessoa.horarioSemanal?.[indice] || { trabalha: false, entrada: "", saida: "", almoco: "", jantar: "" };
  const ferias = feriasAtivas(pessoa, date);
  const folga = ferias || !dia.trabalha;
  const pausa = !folga && dia.entrada && dia.saida && !dia.almoco && !dia.jantar ? pausaSugerida(dia.entrada, dia.saida, blocos) : null;
  return {
    id: pessoa.id,
    nome: pessoa.nome,
    setor: SETOR[pessoa.cargo] || pessoa.cargo,
    tipo: pessoa.contratacao || "CLT",
    folga,
    ferias,
    entrada: folga ? "" : dia.entrada,
    saida: folga ? "" : dia.saida,
    pausa,
    almoco: dia.almoco || "",
    jantar: dia.jantar || "",
    barras: folga || !dia.entrada || !dia.saida ? [] : barrasDoTurno(dia.entrada, dia.saida, blocos),
    freelancer: false,
  };
}

function linhaFreelancer(pedido: Pedido, blocos: Bloco[]): LinhaDia {
  const entrada = pedido.horaEntrada || "";
  const saida = pedido.horaSaida || "";
  return {
    id: pedido.id || `${pedido.date}-${pedido.sector}`,
    nome: pedido.freelancerNames || "Freelancer aprovado",
    setor: SETOR[pedido.sector] || pedido.sector,
    tipo: `Freelancer${pedido.qty > 1 ? ` (${pedido.qty}×)` : ""} • ${pedido.shiftHours || 8}h`,
    folga: false,
    ferias: false,
    entrada,
    saida,
    pausa: pedido.horaPausa || null,
    almoco: "",
    jantar: "",
    barras: entrada && saida ? barrasDoTurno(entrada, saida, blocos) : [],
    freelancer: true,
  };
}

export function quadroDoDia(zig: ZigAoVivo | null, date: string, hoje: string): QuadroDia {
  if (!zig || !date) return { paxTexto: "", estimado: false, nota: "", linhas: [] };
  const esperado = publicoEsperado(date, zig, hoje);
  const pax = Math.min(380, esperado.pax);
  const paxTexto = `Público esperado do dia (${esperado.nome}): ${pax.toLocaleString("pt-BR")} pessoa(s) — fonte: ${esperado.fonte}${esperado.reservado ? ` • ${esperado.reservado.toLocaleString("pt-BR")} pax em reserva` : ""}`;
  const propria = (zig.calor?.recentes || []).find((item) => item.date === date);
  const curva = (zig.calor?.porDia || []).find((item) => item.nome === CURTO[dow(date)]);
  const blocos = propria?.blocos?.length ? propria.blocos : (curva?.blocos || []);
  const estimado = !propria && blocos.length > 0;
  const pessoas = (zig.colaboradores || []).map((pessoa) => {
    const linha = linhaColaborador(pessoa, date, blocos);
    const entrada = minutos(pessoa.horarioSemanal?.[dow(date)]?.entrada || "");
    return {
      ordem: [ORDEM.indexOf(setorDe(pessoa)) < 0 ? 99 : ORDEM.indexOf(setorDe(pessoa)), linha.folga || entrada == null ? 99999 : entrada, rankDe(pessoa)],
      nome: pessoa.nome,
      linha,
    };
  });
  const extras = (zig.freelancers || [])
    .filter((pedido) => pedido.date === date && pedido.status === "aprovado" && pedido.attendance !== "faltou")
    .map((pedido) => ({
      ordem: [ORDEM.indexOf(pedido.sector) < 0 ? 99 : ORDEM.indexOf(pedido.sector), minutos(pedido.horaEntrada || "") ?? 99999, 6],
      nome: pedido.freelancerNames || "",
      linha: linhaFreelancer(pedido, blocos),
    }));
  const linhas = [...pessoas, ...extras].sort((a, b) => {
    for (let i = 0; i < 3; i += 1) if (a.ordem[i] !== b.ordem[i]) return a.ordem[i] - b.ordem[i];
    return a.nome.localeCompare(b.nome, "pt-BR");
  }).map((item) => item.linha);
  return {
    paxTexto,
    estimado,
    nota: estimado ? notaEstimada(date, zig, pax, esperado.nome, curva?.nDias || 0) : "",
    linhas,
  };
}

export function corCalor(t: number, semDado: boolean) {
  if (semDado) return "rgb(90, 100, 120)";
  const verde = [56, 217, 138];
  const vermelho = [255, 102, 114];
  const rgb = verde.map((canal, i) => Math.round(canal + t * (vermelho[i] - canal)));
  return `rgb(${rgb.join(",")})`;
}
