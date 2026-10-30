"use client";

import { useState } from "react";

const GRUPOS = [
  ["voz", "Voz e Violão"],
  ["banda", "Banda"],
  ["dj", "DJ"],
] as const;

export function TopBandas({ onSalvo }: { onSalvo: () => void }) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number][0]>("voz");
  return (
    <details className="sjCollapse">
      <summary>
        <span className="sjChev">▸</span>
        Top bandas • faturamento & público
        <span className="sjHint">clique para abrir</span>
      </summary>
      <section className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Top bandas • faturamento & público</h3>
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
        </div>
        <p className="sjNote">
          Cruza a agenda artística com o faturamento e o público reais do ZigPay, dia a dia. Quando 2 ou mais atrações tocam no mesmo dia, o faturamento é do dia inteiro, não só daquela atração — por isso só entram aqui atrações com pelo menos 2 dias de faturamento real confirmado (não estimado).
        </p>
        <div className="sjDias" role="tablist" aria-label="Tipo de atração">
          {GRUPOS.map(([id, nome]) => (
            <button key={id} type="button" className={grupo === id ? "on" : ""} aria-pressed={grupo === id} onClick={() => setGrupo(id)}>{nome}</button>
          ))}
        </div>
        <div className="sjTableInner">
          <table>
            <thead>
              <tr>
                <th>Atração</th>
                <th>Dias com dado real</th>
                <th>Faturamento médio/dia</th>
                <th>Público médio/dia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="sjMini">Sem ranking calculado ainda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </details>
  );
}
