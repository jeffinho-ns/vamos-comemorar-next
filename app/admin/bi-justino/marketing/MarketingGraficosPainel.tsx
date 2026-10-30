"use client";

import { useState } from "react";
import type { DreAoVivo } from "../dreValor";
import type { ZigAoVivo } from "../zigValor";
import { BudgetAtracoes } from "./BudgetAtracoes";
import { GastoReceita } from "./GastoReceita";
import { HistoricoDre } from "./HistoricoDre";
import { PadraoSemanalGrafico } from "./PadraoSemanalGrafico";
import { SemanalSeisMeses } from "./SemanalSeisMeses";
import { TopBandas } from "./TopBandas";
import { VendaHorario } from "./VendaHorario";

export function MarketingGraficosPainel({
  zig,
  dre,
  onSalvo,
}: {
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
  onSalvo: () => void;
}) {
  const [forcar, setForcar] = useState(0);
  return (
    <>
      <section className="sjCard sjBloco">
        <p className="sjNote">
          <b>Análise de gráficos • Marketing</b> — todos os gráficos da aba num lugar só. Cada gráfico tem o botão <b>📊 Análise do gráfico</b> com a leitura dos números.{" "}
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={() => setForcar((atual) => atual + 1)}>📊 Abrir a análise de todos</button>
        </p>
      </section>
      <GastoReceita zig={zig} forcar={forcar} />
      <HistoricoDre dre={dre} onSalvo={onSalvo} forcar={forcar} />
      <SemanalSeisMeses zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <PadraoSemanalGrafico zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <VendaHorario zig={zig} onSalvo={onSalvo} forcar={forcar} />
      <BudgetAtracoes zig={zig} onSalvo={onSalvo} />
      <TopBandas onSalvo={onSalvo} />
    </>
  );
}
