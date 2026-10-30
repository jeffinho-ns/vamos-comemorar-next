"use client";

import { useId } from "react";
import { AnaliseBloco } from "./AnaliseBloco";

export function BarrasSemana({
  itens,
  cor,
  aria,
  analise,
  forcar = 0,
  vazio = "Sem dado suficiente ainda.",
}: {
  itens: { label: string; valor: number; texto: string }[];
  cor: string;
  aria: string;
  analise?: string;
  forcar?: number;
  vazio?: string;
}) {
  const gradiente = `bar${useId().replace(/:/g, "")}`;
  const positivos = itens.filter((item) => item.valor > 0);
  if (positivos.length < 2) return <p className="sjMini">{vazio}</p>;

  const largura = 820;
  const altura = 210;
  const padL = 10;
  const padR = 10;
  const padT = 26;
  const padB = 28;
  const gap = 16;
  const chartW = largura - padL - padR;
  const chartH = altura - padT - padB;
  const barW = (chartW - gap * (itens.length - 1)) / Math.max(1, itens.length);
  const maxV = Math.max(1, ...itens.map((item) => item.valor));
  const base = padT + chartH;

  return (
    <>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="sjFatSvg" role="img" aria-label={aria}>
        <defs>
          <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="1" />
            <stop offset="100%" stopColor={cor} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {itens.map((item, indice) => {
          const bh = (item.valor / maxV) * chartH;
          const x = padL + indice * (barW + gap);
          const y = base - bh;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barW} height={Math.max(0, bh)} rx={5} fill={`url(#${gradiente})`} />
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="12" fill="#f7f4f1">{item.texto}</text>
              <text x={x + barW / 2} y={base + 18} textAnchor="middle" fontSize="12" fill="#a39686">{item.label}</text>
            </g>
          );
        })}
        <line x1={padL} y1={base} x2={largura - padR} y2={base} stroke="#332b24" strokeWidth="1" />
      </svg>
      {analise ? <AnaliseBloco texto={analise} forcar={forcar} /> : null}
    </>
  );
}
