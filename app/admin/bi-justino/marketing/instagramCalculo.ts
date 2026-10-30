import type { IgPost, IgResumo, IgRetornoResp, InstagramResp } from "./espelhoTipos";
import { addDias, hojeSp, segundaDe } from "./numeros";

/** Contas da página Instagram do painel do Renato (igRenderPlacar, renderInstagramReal, igRenderRanking, renderInstagramAnual). */

export const IG_BASE_21_10 = { reelMediana: 6387, ctrLink: 6.31, salvosMilReel: 5.3, fotosSemana: 1.9 };
export const IG_ATIV_TIPO_LABEL: Record<string, string> = { reel: "Reel", story: "Story", carrossel: "Carrossel", foto: "Foto", promocao: "Promoção do dia", evento: "Evento", parceria: "Parceria", outro: "Outro" };
export const IG_ANUAL_METRICAS = [
  ["reach", "Alcance (contas)"], ["views", "Visualizações"], ["profileViews", "Visitas ao perfil"], ["websiteClicks", "Cliques no link da bio"],
  ["accountsEngaged", "Contas engajadas"], ["interactions", "Interações"], ["followers", "Seguidores (fim do mês)"],
] as const;
export const IG_MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function num(v: number | string | null | undefined): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function fmtInt(v: number | string | null | undefined) {
  const n = num(v);
  return n == null ? "—" : n.toLocaleString("pt-BR");
}

export function fmt1(v: number | null | undefined) {
  return v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function pctTexto(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

export function mediana(arr: number[]) {
  if (!arr.length) return null;
  const q = [...arr].sort((x, y) => x - y);
  const h = Math.floor(q.length / 2);
  return q.length % 2 ? q[h] : (q[h - 1] + q[h]) / 2;
}

export type SeloPlacar = { cls: "g" | "y" | "r"; texto: string };

export function seloAlvo(v: number | null, alvo: number): SeloPlacar {
  if (v == null) return { cls: "y", texto: "—" };
  if (v >= alvo) return { cls: "g", texto: "no alvo" };
  if (v >= alvo * 0.5) return { cls: "y", texto: "abaixo" };
  return { cls: "r", texto: "longe" };
}

export function seloVsBase(v: number | null, base: number, inverso?: boolean): SeloPlacar {
  if (v == null || !base) return { cls: "y", texto: "—" };
  const d = (v / base - 1) * 100;
  const bom = inverso ? d <= 0 : d >= 0;
  return { cls: Math.abs(d) < 3 ? "y" : bom ? "g" : "r", texto: `${d >= 0 ? "+" : ""}${d.toFixed(0)}% vs 21/10` };
}

export interface LinhaPlacar { indicador: string; sub: string; hoje: string; alvo: string; selo: SeloPlacar }

export function placarDoPlano(r: InstagramResp, retorno: IgRetornoResp | null): LinhaPlacar[] | null {
  if (!r.ok || !r.configurado || !r.atual) return null;
  const hoje = hojeSp();
  const seg = segundaDe(hoje);
  const posts = r.posts ?? [];
  const porSem: Record<string, { reel: number; car: number; foto: number }> = {};
  posts.forEach((p) => {
    const w = segundaDe(p.date);
    const o = porSem[w] || (porSem[w] = { reel: 0, car: 0, foto: 0 });
    if (p.tipo === "REEL") o.reel += 1;
    else if (p.tipo === "CARROSSEL") o.car += 1;
    else o.foto += 1;
  });
  const fechadas = [1, 2, 3, 4].map((i) => addDias(seg, -7 * i));
  const medSem = (k: "reel" | "car" | "foto") => fechadas.reduce((t, w) => t + ((porSem[w] || { reel: 0, car: 0, foto: 0 })[k] || 0), 0) / fechadas.length;
  const reels60 = posts.filter((p) => p.tipo === "REEL" && p.reach != null).map((p) => p.reach ?? 0);
  const medReel = mediana(reels60);
  const reelSaves = posts.filter((p) => p.tipo === "REEL" && (p.reach ?? 0) > 0 && p.saved != null);
  const salvosMil = reelSaves.length ? (reelSaves.reduce((t, p) => t + (p.saved ?? 0), 0) / reelSaves.reduce((t, p) => t + (p.reach ?? 0), 0)) * 1000 : null;
  const a = r.atual;
  const visitas = num(a.profileViews30);
  const cliques = num(a.websiteClicks30);
  const ctr = visitas && visitas > 0 && cliques != null ? (cliques / visitas) * 100 : null;
  const reelsSem = medSem("reel");
  const carSem = medSem("car");
  const fotoSem = medSem("foto");
  const sm = retorno?.semanas ?? [];
  const igSem = sm.slice(-5, -1);
  const igMedia = igSem.length ? igSem.reduce((t, x) => t + x.instagram, 0) / igSem.length : null;
  const cob = retorno?.cobertura30?.total ? Math.round((retorno.cobertura30.comOrigem / retorno.cobertura30.total) * 100) : null;
  return [
    { indicador: "Reels por semana", sub: "média das 4 últimas semanas fechadas", hoje: fmt1(reelsSem), alvo: "4", selo: seloAlvo(reelsSem, 4) },
    { indicador: "Carrosséis por semana", sub: "média das 4 últimas semanas fechadas", hoje: fmt1(carSem), alvo: "2", selo: seloAlvo(carSem, 2) },
    { indicador: "Fotos por semana", sub: "menos fotos de divulgação (base 21/10: ≈ 1,9)", hoje: fmt1(fotoSem), alvo: "a definir", selo: seloVsBase(fotoSem, IG_BASE_21_10.fotosSemana, true) },
    { indicador: "Mediana de alcance dos Reels", sub: "60 dias (a mediana não é puxada pelos virais)", hoje: fmt1(medReel), alvo: "a definir (base 6.387)", selo: seloVsBase(medReel, IG_BASE_21_10.reelMediana) },
    { indicador: "Salvamentos por 1.000 alcançados (Reels)", sub: "60 dias", hoje: fmt1(salvosMil), alvo: "a definir (base 5,3)", selo: seloVsBase(salvosMil, IG_BASE_21_10.salvosMilReel) },
    { indicador: "Cliques no link ÷ visitas ao perfil", sub: "30 dias", hoje: ctr == null ? "—" : `${fmt1(ctr)}%`, alvo: "a definir (base 6,3%)", selo: seloVsBase(ctr, IG_BASE_21_10.ctrLink) },
    { indicador: "Reservas com origem Instagram por semana", sub: "lançadas; média das 4 semanas fechadas", hoje: igMedia == null ? "—" : fmt1(igMedia), alvo: "a definir após 30 dias", selo: igMedia == null ? { cls: "y", texto: "sem dado" } : { cls: "y", texto: "coletando" } },
    { indicador: "Reservas com origem informada", sub: "últimos 30 dias — sem isso o retorno não se mede", hoje: cob == null ? "—" : `${cob}%`, alvo: "≥ 80%", selo: cob == null ? { cls: "y", texto: "—" } : cob >= 80 ? { cls: "g", texto: "ok" } : cob >= 40 ? { cls: "y", texto: "parcial" } : { cls: "r", texto: "baixa" } },
  ];
}

export interface SemanaCronograma { semana: string; atual: boolean; celulas: { icones: string; plano: string | null }[]; reel: number; car: number }

/** Grade "Cumprimento do cronograma (últimas 4 semanas)". */
export function cronograma(posts: IgPost[]): SemanaCronograma[] {
  const seg = segundaDe(hojeSp());
  const PLANO: Record<number, string> = { 1: "R", 3: "R", 4: "R", 6: "R", 0: "C", 2: "C" };
  const porSem: Record<string, { reel: number; car: number }> = {};
  posts.forEach((p) => {
    const w = segundaDe(p.date);
    const o = porSem[w] || (porSem[w] = { reel: 0, car: 0 });
    if (p.tipo === "REEL") o.reel += 1;
    else if (p.tipo === "CARROSSEL") o.car += 1;
  });
  return [3, 2, 1, 0].map((i) => addDias(seg, -7 * i)).map((w) => ({
    semana: w,
    atual: w === seg,
    celulas: [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = addDias(w, i);
      const icones = posts.filter((p) => p.date === d).map((p) => (p.tipo === "REEL" ? "🎬" : p.tipo === "CARROSSEL" ? "🗂️" : "🖼️")).join(" ");
      const pl = PLANO[i];
      return { icones, plano: pl ? (pl === "R" ? "plano: Reel" : "plano: carrossel") : null };
    }),
    reel: porSem[w]?.reel ?? 0,
    car: porSem[w]?.car ?? 0,
  }));
}

export interface LinhaFormato { formato: string; n: number; reach: number | null; reachMed: number | null; saved: number | null; shares: number | null; inter: number | null }

export function porFormato(posts: IgPost[]): LinhaFormato[] {
  const por: Record<string, { n: number; reach: number[]; saved: number[]; shares: number[]; inter: number[] }> = {};
  posts.forEach((p) => {
    const k = p.tipo || "FOTO";
    const o = por[k] || (por[k] = { n: 0, reach: [], saved: [], shares: [], inter: [] });
    o.n += 1;
    if (p.reach != null) o.reach.push(p.reach);
    if (p.saved != null) o.saved.push(p.saved);
    if (p.shares != null) o.shares.push(p.shares);
    if (p.interactions != null) o.inter.push(p.interactions);
  });
  const m = (arr: number[]) => (arr.length ? Math.round(arr.reduce((x, y) => x + y, 0) / arr.length) : null);
  const med = (arr: number[]) => {
    const v = mediana(arr);
    return v == null ? null : Math.round(v);
  };
  return Object.keys(por).map((k) => ({ formato: k, n: por[k].n, reach: m(por[k].reach), reachMed: med(por[k].reach), saved: m(por[k].saved), shares: m(por[k].shares), inter: m(por[k].inter) }));
}

export function rankingPosts(posts: IgPost[], formato: string, ordem: "top" | "pior") {
  return posts
    .filter((p) => p.reach != null && (!formato || p.tipo === formato))
    .sort((x, y) => (ordem === "pior" ? (x.reach ?? 0) - (y.reach ?? 0) : (y.reach ?? 0) - (x.reach ?? 0)))
    .slice(0, 8);
}

export function variacaoSeguidores(a: IgResumo, historico: { date: string; followers: number | null }[]) {
  const ant = historico.find((x) => x.date <= addDias(a.date, -28));
  const atual = num(a.followers);
  return ant && ant.followers != null && atual != null ? atual - ant.followers : null;
}

export interface SerieAnual { anoAtual: number; anoAnt: number; A: (number | null)[]; B: (number | null)[]; nA: number; nB: number }

export function serieAnual(r: InstagramResp, k: string): SerieAnual {
  const anoAtual = Number(hojeSp().slice(0, 4));
  const anoAnt = anoAtual - 1;
  const porMes: Record<string, NonNullable<InstagramResp["mensal"]>[number]> = {};
  (r.mensal ?? []).forEach((x) => { porMes[x.mes] = x; });
  const val = (ano: number, i: number): number | null => {
    const mk = `${ano}-${String(i + 1).padStart(2, "0")}`;
    if (k === "followers") {
      const v = (r.seguidoresMes ?? {})[mk];
      return v == null ? null : Number(v);
    }
    const x = porMes[mk];
    if (!x) return null;
    const v = x[k as keyof typeof x];
    return typeof v === "number" ? v : null;
  };
  const A = IG_MESES_CURTO.map((_, i) => val(anoAtual, i));
  const B = IG_MESES_CURTO.map((_, i) => val(anoAnt, i));
  return { anoAtual, anoAnt, A, B, nA: A.filter((v) => v != null).length, nB: B.filter((v) => v != null).length };
}

export function fmtK(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} mi`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} mil`;
  return String(Math.round(v));
}
