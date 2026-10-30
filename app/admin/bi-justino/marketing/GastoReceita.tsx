"use client";

import type { ZigAoVivo } from "../zigValor";
import { GraficoLinha, type SerieLinha } from "./GraficoLinha";
import { textoComparado, textoTendencia } from "./numeros";
import { pontosGastoReceita } from "./series";

export function GastoReceita({ zig, forcar }: { zig: ZigAoVivo | null; forcar: number }) {
  const { eixo, pontos } = pontosGastoReceita(zig);
  const rotulos = pontos.map((ponto) => ponto.rotulo);
  const gasto = pontos.map((ponto) => ponto.gasto);
  const receita = pontos.map((ponto) => ponto.receita);
  const receitaPronta = receita.every((valor) => valor != null);
  const series: SerieLinha[] = [];
  if (receita.some((valor) => valor != null)) {
    series.push({ nome: "Receita Zig", cor: "#34d399", area: true, valores: receita });
  }
  series.push({ nome: "Gasto marketing", cor: "#f76e7c", area: series.length === 0, valores: gasto });
  const analise = !receitaPronta
    ? textoTendencia("Gasto marketing", rotulos, gasto, "pontos")
    : textoComparado(rotulos, [
      { nome: "Receita Zig", valores: receita.filter((valor): valor is number => valor != null) },
      { nome: "Gasto marketing", valores: gasto },
    ]);

  return (
    <section className="sjCard sjBloco">
      <h3>Gasto vs Receita — últimos 30 dias</h3>
      <p className="sjNote">
        Receita é o faturamento Zig do dia (série do mês), não o ticket digitado no registro. Gasto soma tráfego pago, atrações e outros do lançamento de Marketing.
        {eixo === "registro" ? " A série do mês ainda não tem dois dias, então o gráfico fica só com o gasto dos registros." : ""}
      </p>
      <GraficoLinha
        rotulos={rotulos}
        series={series}
        aria="Gasto de marketing e receita Zig dos últimos 30 dias"
        analise={pontos.length >= 2 ? analise : undefined}
        forcar={forcar}
        vazio={zig?.zigCarregando ? "Buscando o faturamento na ZigPay…" : "Sem dado suficiente ainda."}
      />
    </section>
  );
}
