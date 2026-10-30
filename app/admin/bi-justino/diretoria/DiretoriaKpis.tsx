"use client";

import type { ReactNode } from "react";
import { Sparkline } from "../MarketingSparks";
import { ultimosPorData, type ZigPorData } from "../marketing/espelhoDados";
import type { RevenueOverview } from "../marketing/espelhoTipos";
import { BadgeDiff, difAlerta, Ticket } from "../marketing/MarketingRodape";
import { hojeSp, reais } from "../marketing/numeros";
import { bonusGate, statusCost, statusHigh, type Consolidado, type Selo } from "./consolidado";
import { pct, periodoLabel, ultimoDiaDoMes } from "./diretoriaCalculo";

function Badge({ selo }: { selo: Selo }) {
  const classe = selo[0] === "g" ? "sjBadgeG" : selo[0] === "y" ? "sjBadgeY" : "sjBadgeR";
  return <span className={classe}>{selo[1]}</span>;
}

function Kpi({ titulo, children, dica, periodo, pontos, cor }: { titulo: string; children: ReactNode; dica?: string; periodo?: string; pontos?: number[]; cor?: string }) {
  return (
    <article className="sjCard" title={dica}>
      <small>{titulo}</small>
      {children}
      {periodo ? <p className="sjMini">{periodo}</p> : null}
      {dica ? <p className="sjMini">{dica}</p> : null}
      {pontos && pontos.length >= 2 ? <Sparkline pontos={pontos} cor={cor} /> : null}
    </article>
  );
}

/** Os 12 KPIs do topo da Diretoria (renderRevenueOverview + computeMaster + renderPeriodLabels). */
export function DiretoriaKpis({ o, c, zig, carregando }: { o: RevenueOverview | null; c: Consolidado | null; zig: ZigPorData; carregando: boolean }) {
  const hoje = hojeSp();
  const monthKey = o?.monthKey || hoje.slice(0, 7);
  const periodoMes = periodoLabel(`${monthKey}-01`, hoje);
  const yearKey = monthKey.slice(0, 4);
  const lastYearMonthKey = `${Number(yearKey) - 1}-${monthKey.slice(5, 7)}`;
  const todayDay = hoje.slice(8, 10);
  const lastYearLastDay = ultimoDiaDoMes(lastYearMonthKey).slice(8, 10);
  const corte = todayDay < lastYearLastDay ? todayDay : lastYearLastDay;
  const hojeD = new Date(`${hoje}T12:00:00`);
  const lastClosed = new Date(hojeD.getFullYear(), hojeD.getMonth(), 0);
  const isoLastClosed = `${lastClosed.getFullYear()}-${String(lastClosed.getMonth() + 1).padStart(2, "0")}-${String(lastClosed.getDate()).padStart(2, "0")}`;
  const dow = hojeD.getDay();
  const monday = new Date(hojeD);
  monday.setDate(hojeD.getDate() - ((dow + 6) % 7));
  const isoMonday = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const periodoSemana = o?.weekStart && o.weekEnd ? `${periodoLabel(o.weekStart, o.weekEnd)}${o.weekIsPrevious ? " • semana anterior (a atual ainda não tem faturamento)" : ""}` : periodoLabel(isoMonday, hoje);
  const carregandoTxt = carregando ? "Carregando…" : "—";
  const ticketSerie = Object.keys(zig.revenue).sort().slice(-30).map((d) => {
    const pub = zig.publico[d];
    return pub && pub > 0 ? zig.revenue[d] / pub : NaN;
  }).filter((v) => Number.isFinite(v));

  return (
    <div className="sjGrid">
      <Kpi titulo="Faturamento Projetado (Marketing)" dica="soma das projeções do mês" periodo={periodoMes}>
        <div className="v">{o?.monthProjected ? reais(o.monthProjected) : "—"}</div>
      </Kpi>
      <Kpi titulo="Faturamento do mês" periodo={periodoMes} pontos={ultimosPorData(zig.revenue, 30)} cor="#c96736">
        <div className="v">{c ? reais(c.r) : carregandoTxt}</div>
        {c ? <Badge selo={statusHigh(c.r, 600000, 500000)} /> : null}
        {o ? <p className="sjMini">ZigPay {reais(o.monthRevenueZig)} + Eventos {reais(o.monthRevenueEventos)} = {reais(o.monthRevenue)}</p> : null}
      </Kpi>
      <Kpi titulo="Mesmo mês, ano anterior" periodo={periodoLabel(`${lastYearMonthKey}-01`, `${lastYearMonthKey}-${corte}`)}>
        {o && o.lastYearSameMonth != null ? <><div className="v">{reais(o.lastYearSameMonth)}</div><BadgeDiff diff={o.monthRevenue - o.lastYearSameMonth} pctValor={o.lastYearSameMonth ? ((o.monthRevenue - o.lastYearSameMonth) / o.lastYearSameMonth) * 100 : 0} /></> : <div className="v">{o ? "Sem histórico" : "—"}</div>}
      </Kpi>
      <Kpi titulo="Média mensal do ano">
        <div className="v">{o ? (o.yearAvgMonthly != null ? reais(o.yearAvgMonthly) : "Dados insuficientes") : "—"}</div>
        <p className="sjMini">{o ? (o.monthsInAverage ? `${o.monthsInAverage} mês(es) completo(s) ${periodoLabel(`${yearKey}-01-01`, isoLastClosed)}` : "ainda sem mês fechado no ano") : ""}</p>
      </Kpi>
      <Kpi titulo="Semana: projetado × faturado">
        {!o ? <><div className="v">—</div><p className="sjMini">Marketing projetou × ZigPay capturou, semana atual</p></>
          : o.weekDiff == null ? <><div className="v">Sem projeção</div><p className="sjMini">Realizado {reais(o.weekActual || 0)} (Marketing ainda não projetou a semana) {periodoSemana}</p></>
            : <><div className="v">{o.weekDiff >= 0 ? "+" : ""}{reais(o.weekDiff)}</div><p className="sjMini">{difAlerta(o.weekActual, o.weekProjected)}<br />Projetado {reais(o.weekProjected ?? 0)} • Realizado {reais(o.weekActual)} {periodoSemana}</p></>}
      </Kpi>
      <Kpi titulo="Semana atual vs ano anterior">
        <div className="v">{o ? reais(o.weekActual || 0) : "—"}</div>
        {o && o.weekActualLastYear != null ? (
          <>
            <BadgeDiff diff={o.weekActual - o.weekActualLastYear} pctValor={o.weekActualLastYear ? ((o.weekActual - o.weekActualLastYear) / o.weekActualLastYear) * 100 : 0} />
            <p className="sjMini">{o.weekActual - o.weekActualLastYear >= 0 ? "+" : ""}{reais(o.weekActual - o.weekActualLastYear)} vs {reais(o.weekActualLastYear)} no ano anterior {periodoSemana}</p>
          </>
        ) : o ? <p className="sjMini">Sem histórico do ano anterior pra comparar. {periodoSemana}</p> : null}
      </Kpi>
      <Kpi titulo="Ticket médio • semana" periodo={periodoSemana}><Ticket atual={o?.ticketSemana ?? null} anterior={o?.ticketSemanaAnoAnterior ?? null} /></Kpi>
      <Kpi titulo="Ticket médio • mês" periodo={periodoMes} pontos={ticketSerie} cor="#a78bfa"><Ticket atual={o?.ticketMes ?? null} anterior={o?.ticketMesAnoAnterior ?? null} /></Kpi>
      <Kpi titulo="Ticket médio • ano" periodo={periodoLabel(`${yearKey}-01-01`, hoje)}><Ticket atual={o?.ticketAno ?? null} anterior={o?.ticketAnoAnterior ?? null} /></Kpi>
      <Kpi titulo="Margem líquida" periodo={periodoMes} dica="Lucro líquido do mês ÷ faturamento. Lucro = faturamento − (impostos+cartão+fee+IR/CSLL) − CMV − gasto de marketing − custos do Financeiro − custo de pessoal (RH) − perdas/manutenção (Operação) − demais despesas estruturais.">
        <div className="v">{c ? pct(c.margin) : carregandoTxt}</div>
        {c ? <Badge selo={statusHigh(c.margin, 10, 5)} /> : null}
      </Kpi>
      <Kpi titulo="Economia vs. meta" periodo={periodoMes} dica='Soma de "meta saudável − custo real" nas 5 áreas controláveis (Marketing, Financeiro, RH, Operação, CMV). Positivo = economia total no mês; negativo = estourou no total, mesmo que alguma área isolada esteja dentro da meta.'>
        <div className="v">{c ? reais(c.saving) : carregandoTxt}</div>
        <span className="sjBadge">CONTROLÁVEL</span>
      </Kpi>
      <Kpi titulo="CMV real" periodo={periodoMes} dica="CMV real do mês — vem do último envio da área CMV (Márcio), % do faturamento gasto em mercadoria vendida.">
        <div className="v">{c ? pct(c.cmvReal) : carregandoTxt}</div>
        {c ? <Badge selo={statusCost(c.cmvReal, 22, 24)} /> : null}
      </Kpi>
      <Kpi titulo="Bônus destravado" dica="Trava do bônus pela margem líquida da casa: <8% = 0% liberado · <10% = 25% · <12% = 60% · <15% = 100% · ≥15% = 125%. Multiplica a meta de bônus de cada gestor, junto com o desempenho da própria área dele.">
        <div className="v">{c ? pct(bonusGate(c.margin) * 100) : carregandoTxt}</div>
        <span className="sjMini">pela margem da casa</span>
      </Kpi>
    </div>
  );
}
