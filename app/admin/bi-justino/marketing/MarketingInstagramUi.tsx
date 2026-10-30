"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Recolhivel({ titulo, inicioAberto, children }: { titulo: string; inicioAberto?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (inicioAberto && ref.current) ref.current.open = true;
  }, [inicioAberto]);
  return (
    <details className="sjCollapse" ref={ref}>
      <summary>
        <span className="sjChev">▸</span>
        {titulo}
        <span className="sjHint">clique para abrir</span>
      </summary>
      <div className="sjCard sjBloco sjCollapseBody">{children}</div>
    </details>
  );
}

export function Tabela({ colunas, linhas }: { colunas: readonly string[]; linhas: readonly (readonly ReactNode[])[] }) {
  return (
    <div className="sjTableInner sjMkTabela">
      <table>
        <thead>
          <tr>{colunas.map((coluna) => <th key={coluna}>{coluna}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((linha, indice) => (
            <tr key={`${indice}-${String(linha[0])}`}>
              {linha.map((celula, coluna) => <td key={coluna}>{celula}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
