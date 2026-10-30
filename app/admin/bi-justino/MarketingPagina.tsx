"use client";

import { useState } from "react";
import type { DreAoVivo } from "./dreValor";
import type { NovidadesAoVivo } from "./FontesNovas";
import { MarketingCanaisPainel } from "./marketing/MarketingCanaisPainel";
import { MarketingDemandasPainel } from "./marketing/MarketingDemandasPainel";
import { MarketingGraficosPainel } from "./marketing/MarketingGraficosPainel";
import { MarketingProjecaoPainel } from "./marketing/MarketingProjecaoPainel";
import { MarketingRodape } from "./marketing/MarketingRodape";
import { MarketingRegistro } from "./MarketingRegistro";
import { Sparkline } from "./MarketingSparks";
import type { ZigAoVivo } from "./zigValor";

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

function gastoDaLinha(linha: Record<string, unknown> | undefined) {
  return Number(linha?.mkTraffic || 0) + Number(linha?.mkAttractions || 0) + Number(linha?.mkOther || 0);
}

function Kpi({ titulo, valor, dica, trava, pontos }: { titulo: string; valor: string; dica: string; trava?: boolean; pontos?: number[] }) {
  return (
    <article className="sjCard" title={dica}>
      <small>{titulo}</small>
      <div className="v">{trava ? "🔒" : valor}</div>
      {pontos ? <Sparkline pontos={pontos} /> : null}
    </article>
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
  const lancamentos = zig?.lancamentos?.marketing || [];
  const linha = lancamentos.find((item) => item.date === dia) || lancamentos[0];
  const gasto = gastoDaLinha(linha);
  const receita = zig?.serieMes?.find((ponto) => ponto.dia === dia)?.zig ?? null;
  const fat = zig?.faturamentoMes || 0;
  const teto = Math.max(4500, fat * 0.00855) + 4500 + fat * 0.08;
  const show = Number(linha?.mkShow || linha?.mkAttendance || 0);
  const roas = gasto > 0 && receita != null ? receita / gasto : 0;
  const cac = show > 0 ? gasto / show : 0;
  const dias = (zig?.serieMes || []).slice(-30);
  const gastosSerie = dias.map((ponto) => gastoDaLinha(lancamentos.find((item) => item.date === ponto.dia)));
  const receitasSerie = dias.map((ponto) => ponto.zig);
  return (
    <>
      <div className="sjGrid">
        <Kpi titulo="Gasto marketing" valor={reais(gasto)} dica="Tráfego pago + atrações + outros itens do registro do dia." pontos={gastosSerie} />
        <Kpi titulo="Receita atribuída" valor={receita == null ? "—" : reais(receita)} dica="Faturamento real do dia capturado pela ZigPay." pontos={receitasSerie} />
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
        {aba === "plan" ? <MarketingProjecaoPainel zig={zig} /> : null}
        {aba === "dem" ? <MarketingDemandasPainel /> : null}
        {aba === "graf" ? <MarketingGraficosPainel zig={zig} dre={dre} onSalvo={onSalvo} /> : null}
        {aba === "ins" || aba === "insta" || aba === "deli" || aba === "aval" ? <MarketingCanaisPainel aba={aba} zig={zig} novidades={novidades} /> : null}
        <MarketingRodape zig={zig} />
      </div>
    </>
  );
}
