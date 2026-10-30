"use client";

import type { ReactNode } from "react";
import { AlertasFlow } from "../DiretoriaQuadros";
import { brl, type Alerta, type Nivel } from "./comum";

/** Cartão KPI (`.card.kpi` do HTML): rótulo, valor grande, subtítulo opcional, tooltip opcional e sparkline. */
export function Kpi({ label, children, sub, tip, spark }: { label: string; children: ReactNode; sub?: ReactNode; tip?: ReactNode; spark?: ReactNode }) {
  return (
    <article className="sjCard">
      <small>{label}</small>
      <div className="v">{children}</div>
      {sub ? <span className="sjMini sjKpiSub">{sub}</span> : null}
      {spark ? <div className="sjSpark">{spark}</div> : null}
      {tip ? <div className="sjKpiTip">{tip}</div> : null}
    </article>
  );
}

/** Bloco recolhível (`details.cardCollapse` do HTML). */
export function Collapse({ titulo, children, aberto }: { titulo: string; children: ReactNode; aberto?: boolean }) {
  return (
    <details className="sjCollapse" open={aberto}>
      <summary><span className="sjChev">▸</span> {titulo}<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCollapseBody">{children}</div>
    </details>
  );
}

/** Cabeçalho de bloco com título à esquerda e ações à direita (`.roleTitle`). */
export function Cabecalho({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="sjRole">
      <h3>{titulo}</h3>
      {children ? <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{children}</span> : null}
    </div>
  );
}

export function Badge({ nivel, children, title }: { nivel?: Nivel | "p" | ""; children: ReactNode; title?: string }) {
  if (nivel === "p") return <span className="sjBadgeP" title={title}>{children}</span>;
  return <span className={`sjBadge ${nivel || ""}`} title={title}>{children}</span>;
}

/** Tabela simples; `linhas` já vem com as células prontas. */
export function Tabela({ colunas, linhas, vazio, rodape }: { colunas: ReactNode[]; linhas: { key: string; cels: ReactNode[]; className?: string }[]; vazio?: string; rodape?: ReactNode }) {
  return (
    <div className="sjTabela">
      <table>
        <thead><tr>{colunas.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {linhas.length ? linhas.map((l) => (
            <tr key={l.key} className={l.className}>{l.cels.map((c, i) => <td key={i}>{c}</td>)}</tr>
          )) : <tr><td colSpan={colunas.length} className="sjMini">{vazio || "Sem dado ainda."}</td></tr>}
          {rodape}
        </tbody>
      </table>
    </div>
  );
}

/** Alertas no mesmo quadro usado nas outras páginas. */
export function Alertas({ titulo, alertas, nota }: { titulo: string; alertas: Alerta[]; nota?: string }) {
  return <AlertasFlow titulo={titulo} nota={nota} alertas={alertas.map((a) => ({ titulo: a.titulo, valor: a.valor, nivel: a.nivel, selo: a.selo, detalhe: a.detalhe ?? null }))} />;
}

/** Barras horizontais de custo por categoria (renderCostBars do HTML). */
export function BarrasCusto({ itens }: { itens: { label: string; value: number }[] }) {
  if (!itens.length) return <p className="sjMini">Sem dado ainda.</p>;
  const maxV = Math.max(1, ...itens.map((e) => e.value));
  return (
    <div style={{ marginTop: 12 }}>
      {itens.map((e) => (
        <div key={e.label} className="sjBarra">
          <div className="sjBarraTop"><span>{e.label}</span><b>{brl(e.value)}</b></div>
          <div className="sjBarraTrilho"><div style={{ width: `${Math.max(2, Math.round((e.value / maxV) * 100))}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function caminhoSuave(pts: number[][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Sparkline dos KPIs (sparklineSvg do HTML). */
export function Sparkline({ valores, cor }: { valores: (number | null)[]; cor: string }) {
  const vals = valores.filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length < 2) return null;
  const w = 100;
  const h = 28;
  const pad = 2;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = vals.map((v, i) => [pad + (i * (w - 2 * pad)) / (vals.length - 1), pad + (h - 2 * pad) - ((v - minV) / range) * (h - 2 * pad)]);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={caminhoSuave(pts)} fill="none" stroke={cor} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2" fill={cor} />
    </svg>
  );
}

/** Linha de formulário (`.field` do HTML): rótulo+ajuda | campo | ajuda à direita. */
export function Campo({ titulo, ajudaTitulo, children, ajuda }: { titulo: string; ajudaTitulo?: ReactNode; children: ReactNode; ajuda?: ReactNode }) {
  return (
    <div className="sjField">
      <div>
        <b>{titulo}</b>
        {ajudaTitulo ? <div className="sjCampoAjuda">{ajudaTitulo}</div> : null}
      </div>
      <div>{children}</div>
      <div className="sjCampoAjuda">{ajuda}</div>
    </div>
  );
}

/** Campo da barra de ferramentas (`.tbItem`). */
export function ItemBarra({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="sjTb">
      <label>{rotulo}{children}</label>
    </div>
  );
}
