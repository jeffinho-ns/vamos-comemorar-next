"use client";

import type { ReactNode } from "react";

/** `<details class="cardCollapse">` do painel do Renato. */
export function Cartao({ titulo, children, aberto = true, id }: { titulo: ReactNode; children: ReactNode; aberto?: boolean; id?: string }) {
  return (
    <details className="sjCollapse" open={aberto} id={id}>
      <summary>
        <span className="sjChev">▸</span>
        {titulo}
        <span className="sjHint">clique para abrir</span>
      </summary>
      <div className="sjCard sjBloco sjCollapseBody">{children}</div>
    </details>
  );
}

/** `.card.full.note` do painel. */
export function Nota({ children }: { children: ReactNode }) {
  return <section className="sjCard sjBloco opNota"><p className="sjNote" style={{ margin: 0 }}>{children}</p></section>;
}

/** `.card.kpi` do painel. */
export function Kpi({ titulo, valor, sub, dica, largo }: { titulo: string; valor: ReactNode; sub?: ReactNode; dica?: ReactNode; largo?: boolean }) {
  return (
    <article className={`sjCard opKpi${largo ? " opKpiLargo" : ""}`} title={typeof dica === "string" ? dica : undefined}>
      <small>{titulo}</small>
      <div className="v">{valor}</div>
      {sub ? <span className="sjMini">{sub}</span> : null}
      {dica && typeof dica !== "string" ? <div className="opTip">{dica}</div> : null}
    </article>
  );
}

export function Badge({ nivel, children }: { nivel: "g" | "y" | "r" | "b" | "p" | "bl" | ""; children: ReactNode }) {
  return <span className={`sjBadge opBadge ${nivel}`}>{children}</span>;
}

export function BotaoAcao({ children, perigo, destaque, onClick, disabled, title }: { children: ReactNode; perigo?: boolean; destaque?: boolean; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button type="button" className={`sjMiniBtn${perigo ? " sjMiniBtnR" : ""}${destaque ? " opBtnDestaque" : ""}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}
