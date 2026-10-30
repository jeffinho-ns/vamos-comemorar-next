"use client";

import { useMemo } from "react";
import { DuvidasBox } from "../marketing/DuvidasBox";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import "../financeiro/area.css";
import { mapasZig, type ZigRevenuePayload } from "../financeiro/comum";
import { Alertas, Collapse, Kpi } from "../financeiro/ui";
import { cmvDocsValidos, fmtPctOuTraco, kpisCmv, type CmvPayload, type RankingPayload } from "./cmvCalc";
import { CmvTeoricoParcial } from "./CmvTeoricoParcial";
import { CmvRanking } from "./CmvRanking";

/** Página pronta: cópia da aba CMV (Márcio) do painel do Renato lendo o espelho da planilha. */
export const PRONTA = true;

const CHAVES = ["getCmvTeoricoParcial", "getZigItemSalesRanking", "getZigRevenue", "getEntries:cmv", "getMonthClosures:cmv", "getDuvidas"];

export function CmvPagina({ onSalvo }: PaginaEspelhoProps) {
  const { dados, erro, carregando, recarregar } = usePlanilha(CHAVES);
  const cmv = payloadDe<CmvPayload>(dados, "getCmvTeoricoParcial");
  const ranking = payloadDe<RankingPayload>(dados, "getZigItemSalesRanking");
  const zig = useMemo(() => mapasZig(payloadDe<ZigRevenuePayload>(dados, "getZigRevenue")), [dados]);
  const docs = useMemo(() => cmv?.docs || [], [cmv]);
  const validos = useMemo(() => cmvDocsValidos(docs, zig.revenue), [docs, zig]);
  // KPIs/alertas/gráfico usam só dias VÁLIDOS (revisão de 19/10); sem nenhum válido, cai no último gravado.
  const atual = validos[0] || cmv?.latest || null;
  const k = kpisCmv(cmv && cmv.ok ? atual : null);

  function atualizar() {
    recarregar();
    onSalvo();
  }

  return (
    <div className="sjStage">
      {erro ? <p className="sjNota">{erro}</p> : null}
      <div className="sjGrid">
        <DuvidasBox area="gestores" dados={dados} onSalvo={atualizar} />
        <Kpi label="CMV teórico (parcial) • comida">{carregando && !cmv ? "Carregando…" : fmtPctOuTraco(k.foodPct)}</Kpi>
        <Kpi label="CMV teórico (parcial) • bebida">{fmtPctOuTraco(k.bevPct)}</Kpi>
        <Kpi label="Cobertura ficha técnica">{fmtPctOuTraco(k.coberturaPct)}</Kpi>
        <Kpi label="Bônus projetado" sub="Márcio não tem bônus nessa área">Sem bônus</Kpi>

        {cmv && cmv.ok && cmv.latest ? (
          <Collapse titulo="CMV teórico automático (parcial)">
            <CmvTeoricoParcial docs={docs} validos={validos} atual={atual} semFicha={ranking?.semFicha || []} zig={zig} onAtualizar={atualizar} />
          </Collapse>
        ) : null}

        <Alertas titulo="Alertas • Comida" alertas={k.alertasComida} />
        <Alertas titulo="Alertas • Bebida" alertas={k.alertasBebida} />

        <section className="sjCard sjBloco">
          <h3>Ficha técnica a corrigir</h3>
          <p className="sjMini">Lista de itens com ficha técnica divergente (ex.: receita duplicada em mais de uma versão no Everest) ainda não está ligada ao BI — hoje vive em <code>robo-zigpay/cmv-teorico/subprodutos_para_corrigir.xlsx</code>, gerada na investigação de ficha técnica. Avisar se quiser essa lista puxada aqui automaticamente.</p>
        </section>

        <Collapse titulo="Top itens vendidos e curva ABC">
          <CmvRanking ranking={ranking} onAtualizar={atualizar} />
        </Collapse>
      </div>
    </div>
  );
}
