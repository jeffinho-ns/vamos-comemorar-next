"use client";

import { useState, type ReactNode } from "react";

export interface ColunaKanban { key: string; label: string }

/** Funil visual genérico (renderKanbanBoard): arrastar um card dispara a mesma ação do botão equivalente. */
export function Kanban<T extends { id: string; status: string }>({ itens, colunas, card, aoSoltar }: {
  itens: T[];
  colunas: ColunaKanban[];
  card: (item: T) => ReactNode;
  aoSoltar: (item: T, de: string, para: string) => void;
}) {
  const [arrastando, setArrastando] = useState<{ id: string; col: string } | null>(null);
  return (
    <div className="opKanban">
      {colunas.map((c) => {
        const lista = itens.filter((it) => it.status === c.key);
        return (
          <div
            key={c.key}
            className="opKanbanCol"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!arrastando || arrastando.col === c.key) { setArrastando(null); return; }
              const item = itens.find((it) => it.id === arrastando.id);
              setArrastando(null);
              if (item) aoSoltar(item, arrastando.col, c.key);
            }}
          >
            <div className="opKanbanHead"><span>{c.label}</span><span className="sjBadge">{lista.length}</span></div>
            <div className="opKanbanBody">
              {lista.length ? lista.map((it) => (
                <div key={it.id} className="opKanbanCard" draggable onDragStart={() => setArrastando({ id: it.id, col: c.key })}>{card(it)}</div>
              )) : <div className="sjMini" style={{ padding: 8, opacity: 0.5, textAlign: "center" }}>—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
