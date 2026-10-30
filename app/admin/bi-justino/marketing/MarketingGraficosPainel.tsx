"use client";

import { useMemo, useState } from "react";
import type { DadosPlanilha } from "../usePlanilha";
import { BudgetAtracoes } from "./BudgetAtracoes";
import { lerEntradas, lerZig, mkAtualPorData } from "./espelhoDados";
import { GastoReceita } from "./GastoReceita";
import { HistoricoDre } from "./HistoricoDre";
import { PadraoSemanalGrafico } from "./PadraoSemanalGrafico";
import { SemanalSeisMeses } from "./SemanalSeisMeses";
import { TopBandas } from "./TopBandas";
import { VendaHorario } from "./VendaHorario";

/** Sub-aba "Análise de gráficos" do Marketing: os mesmos quadros, na mesma ordem do painel do Renato. */
export function MarketingGraficosPainel({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const [forcar, setForcar] = useState(0);
  const zig = useMemo(() => lerZig(dados), [dados]);
  const mkAtual = useMemo(() => mkAtualPorData(lerEntradas(dados, "marketing")), [dados]);
  return (
    <>
      <section className="sjCard sjBloco">
        <p className="sjNote">
          <b>Análise de gráficos • Marketing</b> — todos os gráficos da aba num lugar só. Cada gráfico tem o botão <b>📊 Análise do gráfico</b> com a leitura dos números.{" "}
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={() => setForcar((atual) => atual + 1)}>📊 Abrir a análise de todos</button>
        </p>
      </section>
      <GastoReceita mkAtual={mkAtual} forcar={forcar} />
      <HistoricoDre dados={dados} onSalvo={onSalvo} forcar={forcar} />
      <SemanalSeisMeses zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <PadraoSemanalGrafico zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <VendaHorario dados={dados} zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <BudgetAtracoes dados={dados} onSalvo={onSalvo} />
      <TopBandas dados={dados} onSalvo={onSalvo} />
    </>
  );
}
