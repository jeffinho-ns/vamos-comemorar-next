import type { MkAtual, ZigPorData } from "./espelhoDados";
import type { BandRankingItem } from "./espelhoTipos";
import { addDias, hojeSp, reais, segundaDe } from "./numeros";
import { WEEKDAY_LABEL, type Bucket } from "./series";

/** Insights de Marketing (insCalcula / insDicasDia do painel do Renato): 8 semanas fechadas, regras fixas sobre os dados. */

export const INS_ORDEM = [1, 2, 3, 4, 5, 6, 0] as const;

function svcMin(c: string) {
  const [h, m] = c.split(":").map(Number);
  return ((h < 8 ? h + 24 : h) * 60) + (m || 0);
}

type Bloco = [string, number, number];
interface Manual { aberto: boolean; linhas: string[]; janela: [number, number, string] | null; blocos?: Bloco[] }

export const INS_MANUAL: Record<number, Manual> = {
  1: { aberto: false, linhas: ["Casa FECHADA (só manutenção e entregas programadas)."], janela: null },
  2: { aberto: true, linhas: ["Abre 18h, fecha 1h.", "Som ambiente — noite de conversa, sem banda.", "Promoção: chope pela metade do preço até 1h.", "Couvert artístico R$ 20 por pessoa a noite toda."], janela: null },
  3: { aberto: true, linhas: ["Abre 18h, fecha 1h.", "Música ao vivo: roda de samba e pagode.", "Promoção: open de chope Heineken e Amstel por R$ 69,90 até 23h.", "Couvert artístico R$ 20 por pessoa."], janela: null },
  4: { aberto: true, linhas: ["Abre 18h, fecha 1h.", "Música ao vivo: roda de samba.", "Promoção: chope Amstel e Heineken pela metade até 0h.", "Couvert artístico R$ 20 por pessoa."], janela: null },
  5: {
    aberto: true,
    linhas: ["Abre 18h, fecha 3h — noite longa, casa cheia.", "Banda completa 20h–23h e 23h–2h; DJs até 3h; palco 360º (quintal e interno) com pagode e TBT do Justa.", "Couvert R$ 25 até 20h; depois, entrada por faixa de público do dia: até 250 pessoas R$ 30 (ou consumação R$ 160) • 251–500 R$ 40 (R$ 180) • acima de 500 R$ 50 (R$ 200)."],
    janela: [1200, 1560, "20h–2h (bandas)"],
    blocos: [["18h–20h (casa enchendo, couvert)", 1080, 1200], ["20h–23h (1ª banda)", 1200, 1380], ["23h–2h (2ª banda)", 1380, 1560], ["2h–3h (DJ)", 1560, 1620]],
  },
  6: {
    aberto: true,
    linhas: ["Abre 14h, fecha 5h — o dia mais longo, em blocos (\"jornada do Seu Sânceti\"): 14–16h som ambiente • 16–19h pagode • 19–22h sertanejo • 22–00h DJ • 00–03h pagode • 03–05h DJ.", "Palco 360º (quintal e interno).", "Couvert R$ 25 até 15h; depois, entrada por faixa de público: até 250 R$ 30 (consumação R$ 160) • 251–500 R$ 40 (R$ 180) • acima de 500 R$ 50 (R$ 200)."],
    janela: null,
    blocos: [["14h–16h (som ambiente)", 840, 960], ["16h–19h (pagode)", 960, 1140], ["19h–22h (sertanejo)", 1140, 1320], ["22h–0h (DJ)", 1320, 1440], ["0h–3h (pagode)", 1440, 1620], ["3h–5h (DJ)", 1620, 1740]],
  },
  0: {
    aberto: true,
    linhas: ["Abre 12h, fecha 21h.", "Feijoada em buffet livre R$ 89,90 por pessoa até 17h (criança até 5 anos isenta; 6–10 anos paga 50%); bebida à parte.", "Roda de samba 360º no quintal, das 15h às 18h, com a banda no meio da casa.", "Couvert artístico R$ 30 por pessoa."],
    janela: [900, 1080, "15h–18h (roda de samba)"],
    blocos: [["12h–15h (feijoada)", 720, 900], ["15h–18h (roda de samba 360º)", 900, 1080], ["18h–21h (encerramento)", 1080, 1260]],
  },
};

const MKT2022 = {
  aniversario: "Aniversários são pilar da casa (Manual de Marketing 2022): aniversariante com reserva ganha mesa decorada e entrada VIP; a partir de 20 convidados ganha balde de cerveja ou cachaça, a partir de 30 uma garrafa de gin — use como isca de reserva nos dias fracos (confirmar se o benefício segue o mesmo).",
  jogo: "Dia de jogo + open/double de chope é uma alavanca citada no Manual de Marketing 2022 (cliente procura transmissão ao vivo) — pode-se casar com patrocinadores Ambev/Heineken.",
  feijoada: "Domingo: o Manual de Marketing 2022 posiciona a feijoada + música ao vivo como diferencial para fidelizar família, casais e grupos de amigos.",
};
const DICAS_FLUXO = [
  "Reserva com benefício: drink de boas-vindas ou couvert reduzido pra quem reservar até a véspera — transforma intenção em fluxo garantido.",
  "Parcerias de fluxo pro dia: empresas e escritórios do entorno, grupos de aniversário e confraternizações, com condição especial só neste dia.",
  "Concentrar a mídia paga nos 3 dias antes (D-3 a D-1) com oferta clara pra este dia, em vez de diluir na semana.",
  "Atração que traga público próprio (artista com base de seguidores), divulgada com antecedência pelo perfil do artista também.",
];
const DICAS_TICKET = [
  "Combo/menu do dia com drink assinatura + petisco, pra subir o gasto por pessoa sem depender de mais gente.",
  "Venda sugestiva da equipe: segunda rodada, drinks premium, sobremesa — com meta de ticket do dia combinada no briefing.",
  "Acompanhar o ticket do dia durante o serviço (não só no fechamento) pra corrigir enquanto ainda dá tempo.",
];
const DICAS_MODELO = [
  "Registrar o que roda neste dia (atração, promoção, mídia, equipe) e replicar nos dias mais fracos.",
  "Proteger o dia: abrir reservas antecipadas e não cortar a mídia que já está funcionando.",
  "Testar aqui as ideias novas de ativação (é o dia com mais margem de erro pra aprender rápido).",
];
const DICAS_EQUIL = [
  "Dia equilibrado: manter a rotina e testar 1 ativação nova por mês (A/B contra as semanas sem a ação).",
  "Olhar o horário de pico pra ver se dá pra esticar a janela de maior venda.",
];

export type Classe = "forte" | "fraco" | "médio";
export type Diag = "fluxo" | "ticket" | "ambos" | "modelo" | "equilibrado";

export interface Hora {
  blocos: { label: string; v: number }[] | null;
  pico: string;
  picoV: number;
  jan: string;
  janFim: string;
  janPct: number;
  rampa: string | null;
  ate20: number;
}

export interface LinhaDia {
  wd: number;
  n: number;
  fat: number;
  pub: number | null;
  tk: number | null;
  trend: { pct: number; h: number } | null;
  spend: number | null;
  hora: Hora | null;
  datas: string[];
  ratio: number | null;
  classe: Classe | null;
  pr: number | null;
  tr: number | null;
  diag: Diag | null;
}

export interface Contexto {
  segAtual: string;
  ini: string;
  fim: string;
  lista: LinhaDia[];
  mFat: number;
  mPub: number;
  mTk: number;
  temHora: boolean;
  bandas: BandRankingItem[];
  bandNota: string;
}

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}
function sinal(v: number) {
  return `${v >= 0 ? "+" : ""}${pct(v)}`;
}
function media(a: number[]) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

export function calcularInsights(zig: ZigPorData, mkAtual: Record<string, MkAtual>, buckets: Bucket[], bandas: BandRankingItem[], bandNota: string): Contexto {
  const segAtual = segundaDe(hojeSp());
  const ini = addDias(segAtual, -56);
  const fim = addDias(segAtual, -1);
  type Acc = { wd: number; datas: string[]; rev: number[]; pubRev: number; pub: number; pubDias: number; spend: number[]; clocks: { c: string; v: number }[] };
  const dias: Record<number, Acc> = {};
  INS_ORDEM.forEach((wd) => { dias[wd] = { wd, datas: [], rev: [], pubRev: 0, pub: 0, pubDias: 0, spend: [], clocks: [] }; });
  Object.keys(zig.revenue).filter((d) => d >= ini && d <= fim).sort().forEach((d) => {
    const rev = Number(zig.revenue[d]) || 0;
    if (rev <= 0) return;
    const o = dias[new Date(`${d}T12:00:00`).getDay()];
    o.datas.push(d);
    o.rev.push(rev);
    const p = Number(zig.publico[d]);
    if (p > 0) {
      o.pub += p;
      o.pubRev += rev;
      o.pubDias += 1;
    }
    const mk = mkAtual[d];
    if (mk) o.spend.push(mk.spend || 0);
  });
  let temHora = false;
  const aberto: Record<string, number> = {};
  INS_ORDEM.forEach((wd) => dias[wd].datas.forEach((d) => { aberto[d] = wd; }));
  const acc: Record<number, Record<string, { s: number; n: number }>> = {};
  buckets.forEach((b) => {
    if (!(b.date in aberto)) return;
    const wd = aberto[b.date];
    const c = b.start.slice(11, 16);
    const k = acc[wd] || (acc[wd] = {});
    const x = k[c] || (k[c] = { s: 0, n: 0 });
    x.s += b.value / 100;
    x.n += 1;
  });
  INS_ORDEM.forEach((wd) => {
    const k = acc[wd];
    if (!k) return;
    const cl = Object.keys(k).sort((a, b) => svcMin(a) - svcMin(b));
    if (cl.length < 4) return;
    const nd = Math.max(1, dias[wd].datas.length);
    dias[wd].clocks = cl.map((c) => ({ c, v: k[c].s / nd }));
    temHora = true;
  });
  const lista: LinhaDia[] = INS_ORDEM.map((wd) => {
    const o = dias[wd];
    const n = o.rev.length;
    const fat = n ? o.rev.reduce((a, b) => a + b, 0) / n : 0;
    const pub = o.pubDias ? o.pub / o.pubDias : null;
    const tk = o.pub > 0 ? o.pubRev / o.pub : null;
    let trend: LinhaDia["trend"] = null;
    if (n >= 4) {
      const h = Math.floor(n / 2);
      const ma = media(o.rev.slice(0, h));
      const mb = media(o.rev.slice(-h));
      trend = { pct: ma ? ((mb - ma) / ma) * 100 : 0, h };
    }
    const spend = o.spend.length ? media(o.spend) : null;
    let hora: Hora | null = null;
    if (o.clocks.length) {
      const v = o.clocks.map((x) => x.v);
      const tot = v.reduce((a, b) => a + b, 0) || 1;
      let ip = 0;
      v.forEach((x, i) => { if (x > v[ip]) ip = i; });
      let bi = 0;
      let bs = -1;
      for (let i = 0; i + 3 < v.length; i += 1) {
        const s2 = v[i] + v[i + 1] + v[i + 2] + v[i + 3];
        if (s2 > bs) { bs = s2; bi = i; }
      }
      const rampa = o.clocks.find((x) => x.v >= 0.4 * v[ip]);
      const ate20 = (o.clocks.reduce((s, x) => s + (svcMin(x.c) < 1200 ? x.v : 0), 0) / tot) * 100;
      const defB = INS_MANUAL[wd]?.blocos;
      const blocos = defB ? defB.map((b) => ({ label: b[0], v: (o.clocks.reduce((s2, x) => s2 + (svcMin(x.c) >= b[1] && svcMin(x.c) < b[2] ? x.v : 0), 0) / tot) * 100 })) : null;
      hora = { blocos, pico: o.clocks[ip].c, picoV: v[ip], jan: o.clocks[bi].c, janFim: (o.clocks[bi + 3] || o.clocks[o.clocks.length - 1]).c, janPct: (bs / tot) * 100, rampa: rampa ? rampa.c : null, ate20 };
    }
    return { wd, n, fat, pub, tk, trend, spend, hora, datas: o.datas, ratio: null, classe: null, pr: null, tr: null, diag: null };
  });
  const abertos = lista.filter((l) => l.n >= 3);
  const mFat = abertos.length ? media(abertos.map((l) => l.fat)) : 0;
  const comPub = abertos.filter((l) => l.pub != null);
  const mPub = comPub.length ? media(comPub.map((l) => l.pub ?? 0)) : 0;
  const comTk = abertos.filter((l) => l.tk != null);
  const mTk = comTk.length ? media(comTk.map((l) => l.tk ?? 0)) : 0;
  const classificada = lista.map((l) => {
    const ratio = l.n >= 3 && mFat ? l.fat / mFat : null;
    const classe: Classe | null = ratio == null ? null : ratio >= 1.15 ? "forte" : ratio <= 0.85 ? "fraco" : "médio";
    const pr = l.pub != null && mPub ? l.pub / mPub : null;
    const tr = l.tk != null && mTk ? l.tk / mTk : null;
    const diag: Diag | null = pr == null || tr == null ? null : pr < 0.9 && tr < 0.9 ? "ambos" : pr < 0.9 ? "fluxo" : tr < 0.9 ? "ticket" : pr >= 1.05 && tr >= 1.05 ? "modelo" : "equilibrado";
    return { ...l, ratio, classe, pr, tr, diag };
  });
  return { segAtual, ini, fim, lista: classificada, mFat, mPub, mTk, temHora, bandas, bandNota };
}

export interface DicasDia { manual: string[]; dado: string[]; cruz: string[]; sug: string[] }

export function dicasDoDia(l: LinhaDia, ctx: Contexto): DicasDia {
  const dado: string[] = [];
  const sug: string[] = [];
  const cruz: string[] = [];
  const M = INS_MANUAL[l.wd];
  const manual = M ? [...M.linhas] : [];
  if (l.n === 0) {
    return { manual, dado: [M && !M.aberto ? "Sem faturamento nas últimas 8 semanas — coerente com o Manual (casa fechada neste dia)." : "Sem faturamento nas últimas 8 semanas fechadas — casa fechada neste dia? Sem leitura possível."], cruz: [], sug: [] };
  }
  dado.push(`Faturamento médio ${reais(l.fat)} (${l.n} dia${l.n > 1 ? "s" : ""} aberto${l.n > 1 ? "s" : ""} nas últimas 8 semanas)${l.ratio != null ? `, ${Math.round(l.ratio * 100)}% da média dos dias abertos (${reais(ctx.mFat)}) — dia ${l.classe}.` : "."}`);
  if (l.pub != null) dado.push(`Público médio ${Math.round(l.pub)} pessoas${l.pr != null ? ` (${Math.round(l.pr * 100)}% da média)` : ""}${l.tk != null ? ` • ticket médio ${reais(l.tk)}${l.tr != null ? ` (${Math.round(l.tr * 100)}% da média)` : ""}` : ""}.`);
  if (l.trend) dado.push(`Tendência: média das últimas ${l.trend.h} ocorrências ${sinal(l.trend.pct)} vs as ${l.trend.h} primeiras da janela.`);
  if (l.hora) dado.push(`Horário: pico às ${l.hora.pico}; janela de 2h mais forte ${l.hora.jan}–${l.hora.janFim} (≈ ${pct(l.hora.janPct)} da venda do dia); só ${pct(l.hora.ate20)} da venda acontece até 20:00.`);
  if (l.spend != null) dado.push(`Gasto de marketing registrado nesse dia: média de ${reais(l.spend)} por envio (${l.fat ? pct((l.spend / l.fat) * 100) : "—"} do faturamento médio).`);
  if (l.n < 4) dado.push(`⚠️ Amostra pequena (${l.n} dias): trate como indício, não como regra.`);

  if (l.diag === "fluxo") sug.push("Diagnóstico: o problema é FLUXO. O ticket está bem, falta gente — foco em trazer público.", ...DICAS_FLUXO);
  else if (l.diag === "ticket") sug.push("Diagnóstico: o problema é TICKET. O público está bom, mas gasta menos por pessoa — foco em conversão por cliente.", ...DICAS_TICKET);
  else if (l.diag === "ambos") sug.push("Diagnóstico: público E ticket abaixo da média. Priorize fluxo primeiro (é onde mais se ganha) e só depois ticket.", ...DICAS_FLUXO.slice(0, 3), ...DICAS_TICKET.slice(0, 1));
  else if (l.diag === "modelo") sug.push("Dia modelo: público e ticket acima da média.", ...DICAS_MODELO);
  else if (l.diag === "equilibrado") sug.push(...DICAS_EQUIL);
  else sug.push("Sem público capturado suficiente nesse dia pra separar fluxo de ticket — priorize garantir a captura do público na ZigPay.");
  if (l.hora && l.hora.ate20 < 20 && svcMin(l.hora.pico) >= 1320) sug.push(`A casa enche tarde (pico ${l.hora.pico}, só ${pct(l.hora.ate20)} da venda até 20h): teste uma ativação pra antecipar a chegada — happy hour/early bird, atração começando mais cedo ou drink em dobro até um horário.`);
  if (l.hora) sug.push(`Comunicação e atração principal devem mirar a janela ${l.hora.jan}–${l.hora.janFim} (é onde está a venda).`);
  if (l.trend && l.trend.pct <= -10) sug.push(`⚠️ Dia em queda (${pct(l.trend.pct)}). Levante o que mudou nas últimas semanas: atração, mídia, cardápio, clima ou concorrência, antes de mexer em preço.`);
  if (l.trend && l.trend.pct >= 10) sug.push(`↗ Dia em crescimento (${sinal(l.trend.pct)}). Identifique o que mudou (atração, promoção, mídia) e consolide.`);
  if (l.classe === "fraco" && (l.spend == null || l.spend === 0)) {
    const fortes = ctx.lista.filter((x) => x.classe === "forte" && x.spend != null && x.fat > 0);
    const ref = fortes.length ? (fortes.reduce((s, x) => s + (x.spend ?? 0), 0) / fortes.reduce((s, x) => s + x.fat, 0)) * 100 : null;
    sug.push(`Dia fraco sem gasto de marketing registrado: vale um teste controlado de investimento${ref != null ? ` (referência: os dias fortes gastam ${pct(ref)} do faturamento)` : ""}, medindo o efeito nas 3–4 semanas seguintes.`);
  }
  if (l.classe === "fraco" || l.diag === "fluxo" || l.diag === "ambos") {
    const b = [...ctx.bandas].sort((x, y) => y.faturamentoMedio - x.faturamentoMedio).slice(0, 3);
    if (b.length) sug.push(`Atrações com melhor retorno no ranking (${ctx.bandNota || "snapshot"}): ${b.map((x) => `${x.banda} — ${reais(x.faturamentoMedio)}/dia (${x.diasComDadoReal} dia${x.diasComDadoReal > 1 ? "s" : ""}${x.diasComDadoReal < 3 ? ", amostra pequena" : ""})`).join("; ")}. O ranking mistura dias da semana: use como ponto de partida e valide no seu dia.`);
  }

  if (M?.janela && l.hora) {
    const pm = svcMin(l.hora.pico);
    if (pm < M.janela[0] || pm >= M.janela[1]) cruz.push(`Pico fora da atração principal: a venda atinge o pico às ${l.hora.pico}, fora da janela da atração principal do manual (${M.janela[2]}). Avalie ajustar o horário da atração ou reforçar a comunicação nesse horário.`);
    else cruz.push(`O pico de venda (${l.hora.pico}) cai dentro da atração principal do manual (${M.janela[2]}) — a programação está alinhada com o fluxo; proteja esse horário.`);
  }
  if (l.hora?.blocos) {
    const bs = l.hora.blocos;
    const top = [...bs].sort((a, b) => b.v - a.v)[0];
    const low = [...bs].sort((a, b) => a.v - b.v)[0];
    cruz.push(`Venda por bloco da programação (média dos dias abertos): ${bs.map((b) => `${b.label} ${pct(b.v)}`).join(" • ")}.`);
    if (top && low && top !== low) cruz.push(`Bloco mais forte: ${top.label} (${pct(top.v)}) — concentre a atração/comunicação de maior apelo aqui. Bloco mais fraco: ${low.label} (${pct(low.v)}) — candidato a trocar atração, antecipar promoção ou reforçar divulgação.`);
  }
  if ((l.wd === 5 || l.wd === 6) && l.pub != null) {
    const faixas: [number, string, string][] = [[250, "R$ 30 (consumação R$ 160)", "R$ 40 (consumação R$ 180)"], [500, "R$ 40 (consumação R$ 180)", "R$ 50 (consumação R$ 200)"]];
    const pub = l.pub;
    const f = faixas.find((x) => pub <= x[0]);
    if (f) {
      const falta = Math.round(f[0] + 1 - pub);
      cruz.push(`Público médio de ${Math.round(pub)} fica na faixa de entrada ${f[1]}. Faltam ≈ ${falta} pessoas pra a casa passar a cobrar ${f[2]} — ${falta <= f[0] * 0.15 ? "está perto: vale uma ação de fluxo pra destravar a faixa seguinte." : "a faixa seguinte ainda está distante."}`);
    } else cruz.push(`Público médio de ${Math.round(pub)} já está na faixa mais alta de entrada (acima de 500).`);
  }
  if (l.wd === 2) {
    const q = ctx.lista.filter((x) => (x.wd === 3 || x.wd === 4) && x.n >= 3);
    if (q.length && l.n >= 3) {
      const mq = media(q.map((x) => x.fat));
      cruz.push(`Programação × resultado: Quarta/Quinta (música ao vivo) faturam em média ${reais(mq)} contra ${reais(l.fat)} da Terça (som ambiente) — ${sinal(((mq - l.fat) / l.fat) * 100)}. A atração musical é a principal diferença de programação no manual: é uma hipótese a testar, não prova de causa.`);
      if (mq > l.fat * 1.15) sug.push("Testar na Terça uma atração leve (voz e violão ou DJ de baixo custo) por 3–4 semanas e comparar com as semanas sem — o manual descreve a Terça como \"sem banda\".");
    }
  }
  if (l.wd === 3 && l.tk != null) cruz.push(`Ticket médio ${reais(l.tk)} x open de chope de R$ 69,90 (manual): ${l.tk < 69.9 * 1.3 ? "o ticket está colado no valor do open — o cliente tende a ficar só nele; ofereça petisco e drinks fora do open pra subir o ticket." : "o ticket já passa bem do valor do open (há consumo além dele)."}`);
  if (l.wd === 0 && l.tk != null) cruz.push(`Ticket médio ${reais(l.tk)} x feijoada R$ 89,90 + couvert R$ 30 (manual) = R$ 119,90 só de comida e couvert: ${l.tk < 119.9 * 1.15 ? "o ticket está perto do mínimo da feijoada — pouca bebida acompanhando; trabalhe caipirinha/chope junto com o buffet." : "o ticket já mostra consumo relevante de bebida além do buffet."}`);
  if (l.wd === 0) sug.push(MKT2022.feijoada);
  if ((l.wd === 3 || l.wd === 4) && (l.classe === "fraco" || l.diag === "fluxo")) sug.push(MKT2022.jogo);
  if (l.classe === "fraco" || l.diag === "fluxo" || l.diag === "ambos") sug.push(MKT2022.aniversario);
  return { manual, dado, cruz, sug };
}

export function nomeDia(wd: number) {
  return WEEKDAY_LABEL[wd];
}
