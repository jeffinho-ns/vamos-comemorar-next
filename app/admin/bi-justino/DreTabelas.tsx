"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import { avisoDre, linhasAlerta, linhasCusto, type DreAoVivo } from "./dreValor";

export function TabelaCustoDre({ dre }: { dre: DreAoVivo | null }) {
  const linhas = linhasCusto(dre);
  if (!linhas.length) return <p className="sjNota">{avisoDre(dre) || "—"}</p>;
  return (
    <div className="sjTableInner">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Participação</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.label}>
              <td>{linha.label}</td>
              <td><AnimatedNumber value={linha.valor} kind="money" /></td>
              <td><AnimatedNumber value={Math.round(linha.participacao)} kind="pct" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabelaAlertasDre({
  dre,
  faturamento,
}: {
  dre: DreAoVivo | null;
  faturamento: number | null;
}) {
  const linhas = linhasAlerta(dre, faturamento);
  if (!linhas.length) return <p className="sjNota">{avisoDre(dre) || "—"}</p>;
  return (
    <div className="sjTableInner">
      <table>
        <thead>
          <tr>
            <th>Nível</th>
            <th>Categoria</th>
            <th>Alerta</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.categoria}>
              <td>{linha.nivel}</td>
              <td>{linha.categoria}</td>
              <td>{linha.alerta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
