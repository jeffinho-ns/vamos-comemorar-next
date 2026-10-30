"use client";

import type { ReactNode } from "react";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { lerOverview, ultimoPorArea } from "./espelhoDados";
import type { RevenueOverview, ZigBilheteriaResp } from "./espelhoTipos";
import { reais } from "./numeros";

const MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}
function fmtDMA(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
}
function periodo(d1: string, d2: string) {
  return `(${fmtDMA(d1)} até ${fmtDMA(d2)})`;
}
function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
function mesLabel(mk: string) {
  return `${MES_ABREV[Number(mk.slice(5, 7)) - 1]}/${mk.slice(2, 4)}`;
}

/** Badge verde/vermelho com a diferença percentual (badge(...) do painel). */
export function BadgeDiff({ diff, pctValor }: { diff: number; pctValor: number }) {
  return <span className={diff >= 0 ? "sjBadgeG" : "sjBadgeR"}>{diff >= 0 ? "+" : ""}{pct(pctValor)}</span>;
}

/** difAlerta do painel: realizado × projetado com faixas de alerta. */
export function difAlerta(real: number, proj: number | null) {
  if (!(proj && proj > 0)) return null;
  const p = ((real - proj) / proj) * 100;
  const cls = p >= -5 ? "sjBadgeG" : p >= -15 ? "sjBadgeY" : "sjBadgeR";
  const txt = p >= 5 ? "ACIMA" : p >= -5 ? "NO RITMO" : p >= -15 ? "ATENÇÃO" : "CRÍTICO";
  return <span className={cls}>{p >= 0 ? "+" : ""}{pct(p)} • {txt}</span>;
}

export function Ticket({ atual, anterior }: { atual: number | null; anterior: number | null }) {
  if (atual == null) return <><div className="v">Sem público suficiente</div></>;
  const diff = anterior == null ? null : atual - anterior;
  return (
    <>
      <div className="v">{reais(atual)}</div>
      {anterior == null ? <span className="sjMini">sem histórico</span> : <BadgeDiff diff={diff ?? 0} pctValor={anterior ? ((diff ?? 0) / anterior) * 100 : 0} />}
    </>
  );
}

function Mini({ rotulo, children, nota }: { rotulo: string; children: ReactNode; nota?: ReactNode }) {
  return (
    <article className="sjMkMini">
      <small>{rotulo}</small>
      {children}
      {nota ? <p className="sjMini">{nota}</p> : null}
    </article>
  );
}

function periodoSemana(o: RevenueOverview) {
  return o.weekStart && o.weekEnd ? `${periodo(o.weekStart, o.weekEnd)}${o.weekIsPrevious ? " • semana anterior" : ""}` : "";
}

/** Cards "Faturamento do mês (Financeiro)" e "Receita de entrada (Bilheteria)" do fim da aba Marketing. */
export function MarketingRodape({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const o = lerOverview(dados);
  const fin = ultimoPorArea(dados).financeiro;
  const bilheteria = [...(payloadDe<ZigBilheteriaResp>(dados, "getZigBilheteria")?.docs ?? [])].sort((a, b) => b.mes.localeCompare(a.mes));
  const atual = bilheteria[0];
  const anterior = bilheteria[1];
  const baseProj = o ? (o.monthProjectedToDate != null && o.monthProjectedToDate > 0 ? o.monthProjectedToDate : o.monthProjected) : 0;

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjMkTopo">
          <div><b>Faturamento do mês (Financeiro)</b> <span className="sjMini">{fin ? `último envio: ${dataCurta(fin.date)}` : "Financeiro ainda não enviou — usando valor de referência"}</span></div>
          <div className="sjMkTopoValor">
            <div className="v">{o ? reais(o.monthRevenue) : "—"}</div>
            <p className="sjMini">{o ? `ZigPay ${reais(o.monthRevenueZig)} + Eventos ${reais(o.monthRevenueEventos)}` : ""}</p>
          </div>
        </div>
        <hr className="sjMkSep" />
        <div className="sjMkGrade">
          <Mini rotulo="Mês vs mesmo mês ano anterior">
            {o && o.lastYearSameMonth != null ? <><div className="v">{reais(o.lastYearSameMonth)}</div><BadgeDiff diff={o.monthRevenue - o.lastYearSameMonth} pctValor={o.lastYearSameMonth ? ((o.monthRevenue - o.lastYearSameMonth) / o.lastYearSameMonth) * 100 : 0} /></> : <div className="v">Sem histórico</div>}
          </Mini>
          <Mini rotulo="Projetado do mês × realizado" nota={o ? (baseProj ? `Projetado até hoje ${reais(baseProj)} • Realizado ${reais(o.monthRevenue)}${o.monthProjected && o.monthProjected !== baseProj ? ` • Projeção do mês inteiro ${reais(o.monthProjected)}` : ""}` : `Realizado ${reais(o.monthRevenue)}`) : undefined}>
            {o && baseProj ? <><div className="v">{o.monthRevenue - baseProj >= 0 ? "+" : ""}{reais(o.monthRevenue - baseProj)}</div>{difAlerta(o.monthRevenue, baseProj)}</> : <div className="v">Sem projeção</div>}
          </Mini>
          <Mini rotulo="Semana: projetado × realizado" nota={o ? (o.weekDiff == null ? `Realizado ${reais(o.weekActual)} ${periodoSemana(o)}` : `Projetado ${reais(o.weekProjected ?? 0)} • Realizado ${reais(o.weekActual)} ${periodoSemana(o)}`) : undefined}>
            {o && o.weekDiff != null ? <><div className="v">{o.weekDiff >= 0 ? "+" : ""}{reais(o.weekDiff)}</div>{difAlerta(o.weekActual, o.weekProjected)}</> : <div className="v">Sem projeção</div>}
          </Mini>
          <Mini rotulo="Semana vs mesma semana ano anterior">
            {o && o.weekActualLastYear != null ? <><div className="v">{reais(o.weekActualLastYear)}</div><BadgeDiff diff={o.weekActual - o.weekActualLastYear} pctValor={o.weekActualLastYear ? ((o.weekActual - o.weekActualLastYear) / o.weekActualLastYear) * 100 : 0} /></> : <div className="v">Sem histórico</div>}
          </Mini>
          <Mini rotulo="Ticket médio • semana (vs ano anterior)"><Ticket atual={o?.ticketSemana ?? null} anterior={o?.ticketSemanaAnoAnterior ?? null} /></Mini>
          <Mini rotulo="Ticket médio • mês (vs ano anterior)"><Ticket atual={o?.ticketMes ?? null} anterior={o?.ticketMesAnoAnterior ?? null} /></Mini>
          <Mini rotulo="Ticket médio • ano (vs ano anterior)"><Ticket atual={o?.ticketAno ?? null} anterior={o?.ticketAnoAnterior ?? null} /></Mini>
        </div>
      </section>
      <section className="sjCard sjBloco">
        <div className="sjMkTopo">
          <div><b>Receita de entrada (Bilheteria)</b> <span className="sjMini">{atual ? `(${mesLabel(atual.mes)})` : ""}</span></div>
          <div className="sjMkTopoValor">
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
            <div className="v">{atual ? reais(atual.receita) : "Sem captura ainda"}</div>
          </div>
        </div>
        <p className="sjMini">Faturamento de entrada (bilheteria), direto da tela &quot;Relatórios de Bilheteria&quot; do ZigPay — captura mensal pelo robô, não diária.</p>
        <hr className="sjMkSep" />
        <div className="sjMkGrade">
          <Mini rotulo="Mês vs mês anterior" nota={anterior ? mesLabel(anterior.mes) : undefined}>
            {atual && anterior ? <><div className="v">{reais(anterior.receita)}</div><BadgeDiff diff={atual.receita - anterior.receita} pctValor={anterior.receita ? ((atual.receita - anterior.receita) / anterior.receita) * 100 : 0} /></> : <div className="v">Sem mês anterior</div>}
          </Mini>
          <Mini rotulo="Entradas vendidas no mês"><div className="v">{atual ? (atual.entradasQtd || 0).toLocaleString("pt-BR") : "—"}</div></Mini>
          <Mini rotulo="Público do mês (ZigPay)"><div className="v">{atual ? (atual.publicoMes || 0).toLocaleString("pt-BR") : "—"}</div></Mini>
          <Mini rotulo="% clientes × entradas" nota="entradas vendidas ÷ público do mês"><div className="v">{atual && atual.pctClientesEntradas != null ? pct(atual.pctClientesEntradas) : "—"}</div></Mini>
        </div>
      </section>
    </>
  );
}
