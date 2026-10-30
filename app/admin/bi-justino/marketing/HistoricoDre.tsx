"use client";

import type { DreAoVivo } from "../dreValor";
import { TabelaHistoricoDre } from "../tabelasReais";
import { GraficoLinha } from "./GraficoLinha";
import { textoTendencia } from "./numeros";
import { pontosDre } from "./series";

export function HistoricoDre({
  dre,
  onSalvo,
  forcar,
}: {
  dre: DreAoVivo | null;
  onSalvo: () => void;
  forcar: number;
}) {
  const pontos = pontosDre(dre);
  const rotulos = pontos.map((ponto) => ponto.rotulo);
  const valores = pontos.map((ponto) => ponto.valor);
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Faturamento histórico (DRE) — mês a mês</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
      </div>
      <p className="sjNote">
        Faturamento bruto mensal, direto da DRE. O robô ZigPay só captura dia a dia desde que entrou no ar, por isso o histórico mais antigo precisaria da série da planilha.
        {pontos.length === 1 ? <span className="sjMini"> Período disponível: só {pontos[0].rotulo}.</span> : null}
      </p>
      {pontos.length < 2 ? (
        <p className="sjMini">Histórico insuficiente na DRE ainda.</p>
      ) : (
        <GraficoLinha
          rotulos={rotulos}
          series={[{ nome: "Faturamento bruto (DRE)", cor: "#34d399", area: true, valores }]}
          aria="Faturamento bruto mensal da DRE"
          analise={textoTendencia("Faturamento bruto (DRE)", rotulos, valores, "pontos")}
          forcar={forcar}
        />
      )}
      <TabelaHistoricoDre dre={dre} />
    </section>
  );
}
