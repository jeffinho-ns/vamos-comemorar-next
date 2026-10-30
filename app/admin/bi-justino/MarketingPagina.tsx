"use client";

import { useCallback, useMemo, useState } from "react";
import type { DreAoVivo } from "./dreValor";
import type { NovidadesAoVivo } from "./FontesNovas";
import { consolidar, consolidadoPronto } from "./diretoria/consolidado";
import { CHAVES_MARKETING, lerEntradas, lerZig, mkAtualPorData, ultimoPorArea, valorDe } from "./marketing/espelhoDados";
import { calcularKpisMarketing, RASCUNHO_VAZIO, type RascunhoMarketing } from "./marketing/kpisMarketing";
import { MarketingCanaisPainel } from "./marketing/MarketingCanaisPainel";
import { MarketingDemandasPainel } from "./marketing/MarketingDemandasPainel";
import { MarketingGraficosPainel } from "./marketing/MarketingGraficosPainel";
import { MarketingProjecaoPainel } from "./marketing/MarketingProjecaoPainel";
import { MarketingRodape } from "./marketing/MarketingRodape";
import { MarketingRegistro } from "./MarketingRegistro";
import { Sparkline } from "./MarketingSparks";
import { usePlanilha } from "./usePlanilha";
import type { ZigAoVivo } from "./zigValor";

const ABAS = [
  ["daily", "Registro do dia"],
  ["plan", "Projeção (agendamento futuro)"],
  ["dem", "Demandas"],
  ["graf", "Análise de gráficos"],
  ["ins", "Insights"],
  ["insta", "Instagram"],
  ["deli", "🛵 Delivery"],
  ["aval", "⭐ Avaliações Google"],
] as const;

type AbaId = (typeof ABAS)[number][0];
const CHAVES = [...CHAVES_MARKETING];

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Kpi({ titulo, valor, dica, pontos, cor, classe }: { titulo: string; valor: string; dica: string; pontos?: number[]; cor?: string; classe?: string }) {
  return (
    <article className="sjCard" title={dica}>
      <small>{titulo}</small>
      <div className={`v${classe ? ` ${classe}` : ""}`}>{valor}</div>
      <p className="sjMini">{dica}</p>
      {pontos && pontos.length >= 2 ? <Sparkline pontos={pontos} cor={cor} /> : null}
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
  void zig;
  void novidades;
  void dre;
  const [aba, setAba] = useState<AbaId>("daily");
  const [rascunho, setRascunho] = useState<RascunhoMarketing>(RASCUNHO_VAZIO);
  const [gastoProjetado, setGastoProjetado] = useState(0);
  const { dados, erro, carregando, recarregar } = usePlanilha(CHAVES);

  const salvo = useCallback(() => {
    recarregar();
    onSalvo();
  }, [recarregar, onSalvo]);

  const zigPorData = useMemo(() => lerZig(dados), [dados]);
  const enviosMarketing = useMemo(() => lerEntradas(dados, "marketing"), [dados]);
  const mkAtual = useMemo(() => mkAtualPorData(enviosMarketing), [enviosMarketing]);
  const consolidado = useMemo(() => (consolidadoPronto(dados) ? consolidar(dados) : null), [dados]);
  const opPublico = useMemo(() => valorDe(ultimoPorArea(dados).operacao, "opPublic"), [dados]);
  const kpis = useMemo(
    () => calcularKpisMarketing(rascunho, zigPorData.revenue, mkAtual, consolidado, opPublico),
    [rascunho, zigPorData.revenue, mkAtual, consolidado, opPublico],
  );
  const noPlano = aba === "plan";

  return (
    <>
      {erro ? <p className="sjAlert r">{erro}</p> : null}
      <div className="sjGrid">
        <Kpi
          titulo={noPlano ? "Gastos projetados de marketing" : "Gasto marketing"}
          valor={reais(noPlano ? gastoProjetado : kpis.gasto)}
          dica='Soma do dia: tráfego pago + atrações (banda/DJ/cantor) + outros itens de marketing lançados no "Registro do dia".'
          pontos={noPlano ? undefined : kpis.serieGasto}
          cor="#c96736"
        />
        <Kpi
          titulo="Receita atribuída"
          valor={reais(kpis.receita)}
          dica='Faturamento real do dia, já capturado pelo robô ZigPay (mesmo valor que alimenta o gráfico "Gasto vs Receita"). Usado contra o gasto de marketing pra calcular o ROAS do dia.'
          pontos={kpis.serieReceita}
          cor="#34d399"
        />
        <Kpi titulo="ROAS estimado" valor={kpis.temDado ? `${kpis.roas.toFixed(1)}x` : "—"} dica="Receita atribuída ÷ gasto de marketing: quanto retornou pra cada R$ 1 gasto em mídia/atrações. Referência saudável: ≥ 15x." />
        <Kpi titulo="CAC consumidor" valor={kpis.temDado ? reais(kpis.cac) : "—"} dica="Gasto de marketing ÷ pessoas vindas de reserva (comparecimento). Custo de aquisição por cliente que chegou via reserva." />
        <Kpi
          titulo="Impacto vs meta"
          valor={kpis.temDado ? reais(kpis.impacto) : "—"}
          classe={kpis.temDado ? (kpis.impacto >= 0 ? "sjPos" : "sjNeg") : undefined}
          dica="Teto saudável de gasto (calculado sobre o faturamento de referência) menos o gasto real do dia. Positivo = gastou dentro do teto; negativo = estourou."
        />
        <Kpi
          titulo="Bônus projetado"
          valor={!kpis.temDado ? "—" : kpis.bonus == null ? "🔒" : reais(kpis.bonus)}
          dica="Bônus do dia, calculado a partir do impacto vs meta e da margem da casa. Só aparece pro administrador do BI."
        />
      </div>
      <div className="sjSubs">
        {ABAS.map(([id, label]) => (
          <button key={id} type="button" className={aba === id ? "on" : ""} onClick={() => setAba(id)}>{label}</button>
        ))}
      </div>
      <div key={aba} className="sjGrid sjStage">
        {carregando && !Object.keys(dados).length ? <p className="sjMini">Carregando a cópia da planilha…</p> : null}
        {aba === "daily" ? <MarketingRegistro dados={dados} kpis={kpis} onSalvo={salvo} onRascunho={setRascunho} /> : null}
        {aba === "plan" ? <MarketingProjecaoPainel dados={dados} onSalvo={salvo} onGastoProjetado={setGastoProjetado} /> : null}
        {aba === "dem" ? <MarketingDemandasPainel dados={dados} onSalvo={salvo} /> : null}
        {aba === "graf" ? <MarketingGraficosPainel dados={dados} onSalvo={salvo} /> : null}
        {aba === "ins" || aba === "insta" || aba === "deli" || aba === "aval" ? <MarketingCanaisPainel aba={aba} dados={dados} onSalvo={salvo} /> : null}
      </div>
      <div className="sjGrid">
        <MarketingRodape dados={dados} onSalvo={salvo} />
      </div>
    </>
  );
}
