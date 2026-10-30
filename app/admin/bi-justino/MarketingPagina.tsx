"use client";

import { useState } from "react";
import type { DreAoVivo } from "./dreValor";
import type { NovidadesAoVivo } from "./FontesNovas";
import type { ZigAoVivo } from "./zigValor";
import { MarketingRegistro } from "./MarketingRegistro";
import { MarketingProjecao, MarketingDemandas, MarketingGraficos, MarketingCanais } from "./MarketingAbas";

const ABAS = [
  ["daily", "Registro do dia"],
  ["plan", "Projeção (agendamento futuro)"],
  ["dem", "Demandas"],
  ["graf", "Análise de gráficos"],
  ["ins", "Insights"],
  ["insta", "Instagram"],
  ["deli", "Delivery"],
  ["aval", "Avaliações Google"],
] as const;

function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function pct(atual: number | null | undefined, base: number | null | undefined) {
  if (atual == null || !base) return null;
  return ((atual - base) / Math.abs(base)) * 100;
}

function Kpi({ titulo, valor, dica, trava }: { titulo: string; valor: string; dica: string; trava?: boolean }) {
  return (
    <article className="sjCard" title={dica}>
      <small>{titulo}</small>
      <div className="v">{trava ? "🔒" : valor}</div>
    </article>
  );
}

function Rodape({ zig }: { zig: ZigAoVivo | null }) {
  const bilheteria = zig?.bilheteria || [];
  const atual = bilheteria[0];
  const anterior = bilheteria[1];
  const vsAno = pct(zig?.faturamentoMes, zig?.mesmoMesAnoAnterior);
  const vsSemana = pct(zig?.semanaFaturado, zig?.semanaAnoAnterior);
  const vsProj = zig?.projetadoMes && zig?.faturamentoMes != null ? zig.faturamentoMes - zig.projetadoMes : null;
  const vsSemProj = zig?.semanaProjetado != null && zig?.semanaFaturado != null ? zig.semanaFaturado - zig.semanaProjetado : null;
  const vsBilheteria = pct(atual?.receita, anterior?.receita);
  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>Faturamento do mês (Financeiro)</h3>
          <div className="v">{reais(zig?.faturamentoMes)}</div>
        </div>
        <p className="sjMini">ZigPay {reais(zig?.zigMes)} + Eventos {reais(zig?.eventosMes)}</p>
        <div className="sjCampos">
          <div className="sjCampo"><small>Mês vs mesmo mês ano anterior</small><div className="v">{vsAno == null ? "—" : `${vsAno.toFixed(1).replace(".", ",")}%`}</div><span className="sjMini">{reais(zig?.mesmoMesAnoAnterior)}</span></div>
          <div className="sjCampo"><small>Projetado do mês × realizado</small><div className="v">{vsProj == null ? "—" : reais(vsProj)}</div><span className="sjMini">Projetado {reais(zig?.projetadoMes)}</span></div>
          <div className="sjCampo"><small>Semana: projetado × realizado</small><div className="v">{vsSemProj == null ? "—" : reais(vsSemProj)}</div></div>
          <div className="sjCampo"><small>Semana vs mesma semana ano anterior</small><div className="v">{vsSemana == null ? "—" : `${vsSemana.toFixed(1).replace(".", ",")}%`}</div><span className="sjMini">{reais(zig?.semanaFaturado)}</span></div>
          <div className="sjCampo"><small>Ticket médio • semana</small><div className="v">{reais(zig?.ticketSemana)}</div></div>
          <div className="sjCampo"><small>Ticket médio • mês</small><div className="v">{reais(zig?.ticketMes)}</div></div>
          <div className="sjCampo"><small>Ticket médio • ano</small><div className="v">{reais(zig?.ticketAno)}</div></div>
        </div>
      </section>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <div>
            <h3>Receita de entrada (Bilheteria)</h3>
            <p className="sjMini">Faturamento de entrada, direto da tela Relatórios de Bilheteria do ZigPay — captura mensal pelo robô, não diária.</p>
          </div>
          <div className="v">{reais(atual?.receita)}</div>
        </div>
        <div className="sjCampos">
          <div className="sjCampo"><small>Mês vs mês anterior</small><div className="v">{vsBilheteria == null ? "—" : `${vsBilheteria.toFixed(1).replace(".", ",")}%`}</div><span className="sjMini">{anterior?.mes || ""}</span></div>
          <div className="sjCampo"><small>Entradas vendidas no mês</small><div className="v">{atual?.entradasQtd?.toLocaleString("pt-BR") ?? "—"}</div></div>
          <div className="sjCampo"><small>Público do mês (ZigPay)</small><div className="v">{atual?.publicoMes?.toLocaleString("pt-BR") ?? "—"}</div></div>
          <div className="sjCampo"><small>% clientes × entradas</small><div className="v">{atual?.pctClientesEntradas == null ? "—" : `${atual.pctClientesEntradas.toFixed(1).replace(".", ",")}%`}</div><span className="sjMini">entradas vendidas ÷ público do mês</span></div>
        </div>
      </section>
    </>
  );
}

export function MarketingPagina({
  zig,
  novidades,
  dre,
  onSalvo,
}: {
  zig: ZigAoVivo | null;
  novidades: NovidadesAoVivo | null;
  dre: DreAoVivo | null;
  onSalvo: () => void;
}) {
  const [aba, setAba] = useState<(typeof ABAS)[number][0]>("daily");
  const dia = hoje();
  const linha = (zig?.lancamentos?.marketing || []).find((item) => item.date === dia) || zig?.lancamentos?.marketing?.[0];
  const gasto = Number(linha?.mkTraffic || 0) + Number(linha?.mkAttractions || 0) + Number(linha?.mkOther || 0);
  const receita = zig?.serieMes?.find((ponto) => ponto.dia === dia)?.zig ?? null;
  const fat = zig?.faturamentoMes || 0;
  const teto = Math.max(4500, fat * 0.00855) + 4500 + fat * 0.08;
  const show = Number(linha?.mkShow || linha?.mkAttendance || 0);
  const roas = gasto > 0 && receita != null ? receita / gasto : 0;
  const cac = show > 0 ? gasto / show : 0;
  return (
    <>
      <div className="sjGrid">
        <Kpi titulo="Gasto marketing" valor={reais(gasto)} dica="Tráfego pago + atrações + outros itens do registro do dia." />
        <Kpi titulo="Receita atribuída" valor={receita == null ? "—" : reais(receita)} dica="Faturamento real do dia capturado pela ZigPay." />
        <Kpi titulo="ROAS estimado" valor={`${roas.toFixed(1).replace(".", ",")}x`} dica="Receita atribuída dividida pelo gasto. Referência saudável: 15x ou mais." />
        <Kpi titulo="CAC consumidor" valor={reais(cac)} dica="Gasto de marketing dividido pelas pessoas que compareceram de reserva." />
        <Kpi titulo="Impacto vs meta" valor={reais(teto - gasto)} dica="Teto saudável sobre o faturamento de referência, menos o gasto real." />
        <Kpi titulo="Bônus projetado" valor="" trava dica="Bônus do dia. Fica visível só para o administrador do BI." />
      </div>
      <div className="sjSubs">
        {ABAS.map(([id, label]) => (
          <button key={id} type="button" className={aba === id ? "on" : ""} onClick={() => setAba(id)}>{label}</button>
        ))}
      </div>
      <div className="sjGrid">
        {aba === "daily" ? <MarketingRegistro zig={zig} onSalvo={onSalvo} /> : null}
        {aba === "plan" ? <MarketingProjecao zig={zig} /> : null}
        {aba === "dem" ? <MarketingDemandas /> : null}
        {aba === "graf" ? <MarketingGraficos zig={zig} dre={dre} onSalvo={onSalvo} /> : null}
        {aba === "ins" || aba === "insta" || aba === "deli" || aba === "aval" ? <MarketingCanais aba={aba} zig={zig} novidades={novidades} /> : null}
        <Rodape zig={zig} />
      </div>
    </>
  );
}
