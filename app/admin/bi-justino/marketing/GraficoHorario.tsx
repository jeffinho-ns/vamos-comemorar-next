"use client";

import { useRef, useState, type PointerEvent } from "react";
import { reais } from "./numeros";
import type { SerieHorario } from "./series";

const W = 980;
const H = 320;
const PAD_L = 48;
const PAD_R = 10;
const PAD_T = 14;
const PAD_B = 30;

function catmull(pts: number[][]) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;
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

/** svgLinhasHorario do painel do Renato: uma linha por dia da semana + Geral, eixo X em blocos de 30 min. */
export function GraficoHorario({ clocks, series }: { clocks: string[]; series: SerieHorario[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const n = clocks.length;
  const xAt = (i: number) => PAD_L + (n > 1 ? i * (chartW / (n - 1)) : 0);
  const maxV = Math.max(1, ...series.flatMap((serie) => serie.valores));
  const yAt = (v: number) => PAD_T + chartH - (v / maxV) * chartH;

  function aoMover(evento: PointerEvent<HTMLDivElement>) {
    const svg = caixa.current?.querySelector("svg");
    if (!svg || n < 2) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = (evento.clientX - rect.left) * (W / Math.max(1, rect.width));
    let i = Math.round((xSvg - PAD_L) / (chartW / (n - 1)));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }

  return (
    <div className="sjFatHover" ref={caixa} onPointerMove={aoMover} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="sjFatSvg" role="img" aria-label="Venda média por horário, por dia da semana">
        {[0, 1, 2, 3, 4].map((f) => {
          const v = (maxV * f) / 4;
          const y = yAt(v);
          return (
            <g key={f}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#ffffff0d" strokeWidth="1" />
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#a39686">{reais(v)}</text>
            </g>
          );
        })}
        {clocks.map((c, i) => (i % 4 === 0 ? <text key={c} x={xAt(i)} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="#a39686">{c}</text> : null))}
        <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="#332b24" strokeWidth="1" />
        {series.map((serie) => (
          <path key={serie.key} d={catmull(serie.valores.map((v, i) => [xAt(i), yAt(v)]))} fill="none" stroke={serie.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      {hover != null ? (
        <>
          <div className="sjCross" style={{ left: `${(xAt(hover) / W) * 100}%` }} />
          <div className="sjTip" style={{ left: `${Math.min(68, (xAt(hover) / W) * 100)}%` }}>
            <small>{clocks[hover]}</small>
            {series.map((serie) => (
              <div key={serie.key}><span><i style={{ background: serie.cor, display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 4 }} />{serie.label}</span><b>{reais(serie.valores[hover])}</b></div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
