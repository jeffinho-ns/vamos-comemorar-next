"use client";

import type { MkAtual } from "./espelhoDados";
import { analiseLinhas } from "./analiseTexto";
import { GraficoLinha, type SerieLinha } from "./GraficoLinha";
import { pontosGastoReceita } from "./series";

/** Card "Gasto vs Receita — últimos 30 dias" (mkTrendChartWrap do painel do Renato). */
export function GastoReceita({ mkAtual, forcar }: { mkAtual: Record<string, MkAtual>; forcar: number }) {
  const pontos = pontosGastoReceita(mkAtual);
  const rotulos = pontos.map((ponto) => ponto.rotulo);
  const receita = pontos.map((ponto) => ponto.receita);
  const gasto = pontos.map((ponto) => ponto.gasto);
  const series: SerieLinha[] = [
    { nome: "Receita atribuída", cor: "#34d399", area: true, valores: receita },
    { nome: "Gasto marketing", cor: "#f76e7c", valores: gasto },
  ];
  return (
    <section className="sjCard sjBloco">
      <h3>Gasto vs Receita — últimos 30 dias</h3>
      <GraficoLinha
        rotulos={rotulos}
        series={series}
        aria="Receita atribuída e gasto de marketing dos últimos 30 envios"
        analise={pontos.length >= 2 ? analiseLinhas(rotulos, [{ name: "Receita atribuída", values: receita }, { name: "Gasto marketing", values: gasto }]).join(" ") : undefined}
        forcar={forcar}
        vazio="Sem dado suficiente ainda."
      />
    </section>
  );
}
