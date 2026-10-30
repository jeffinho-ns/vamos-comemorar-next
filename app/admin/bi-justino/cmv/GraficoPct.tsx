"use client";

import { useState } from "react";
import { pct } from "../financeiro/comum";
import "../financeiro/area.css";

export interface SeriePct { nome: string; cor: string; valores: (number | null)[] }

const W = 860;
const H = 240;
const PAD_L = 42;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;

/** Gráfico de linhas em % (renderTrendChart do HTML para o CMV teórico) — o GraficoLinha do Marketing formata em R$. */
export function GraficoPct({ rotulos, series, aria, vazio }: { rotulos: string[]; series: SeriePct[]; aria: string; vazio: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const numeros = series.flatMap((s) => s.valores.filter((v): v is number => v != null && Number.isFinite(v)));
  if (rotulos.length < 2 || numeros.length < 2) return <p className="sjMini">{vazio}</p>;
  const minimo = Math.max(0, Math.floor(Math.min(...numeros) * 0.9));
  const maximo = Math.ceil(Math.max(...numeros) * 1.1) || 1;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const xDe = (i: number) => PAD_L + (rotulos.length > 1 ? (i * chartW) / (rotulos.length - 1) : chartW / 2);
  const yDe = (v: number) => PAD_T + chartH - ((v - minimo) / (maximo - minimo || 1)) * chartH;
  const linhas = [0, 0.25, 0.5, 0.75, 1].map((f) => minimo + (maximo - minimo) * f);
  const passoRotulo = Math.max(1, Math.ceil(rotulos.length / 8));
  return (
    <div className="sjCmvChart" onMouseLeave={() => setHover(null)}>
      <div className="sjLegenda">{series.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - box.left) / box.width) * W;
          const i = Math.round(((x - PAD_L) / chartW) * (rotulos.length - 1));
          setHover(Math.max(0, Math.min(rotulos.length - 1, i)));
        }}>
        {linhas.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yDe(v)} y2={yDe(v)} stroke="#332b24" strokeWidth="1" />
            <text x={PAD_L - 6} y={yDe(v) + 4} textAnchor="end" fontSize="11" fill="#a39686">{pct(v)}</text>
          </g>
        ))}
        {rotulos.map((r, i) => (i % passoRotulo === 0 ? <text key={r + i} x={xDe(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#a39686">{r.replace(/^\S+\s/, "").slice(0, 5)}</text> : null))}
        {series.map((s) => {
          const pontos = s.valores.map((v, i) => (v == null ? null : `${xDe(i).toFixed(1)},${yDe(v).toFixed(1)}`)).filter(Boolean).join(" ");
          return <polyline key={s.nome} points={pontos} fill="none" stroke={s.cor} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />;
        })}
        {hover != null ? <line x1={xDe(hover)} x2={xDe(hover)} y1={PAD_T} y2={PAD_T + chartH} stroke="#f7f4f1" strokeOpacity="0.4" strokeDasharray="3 3" /> : null}
        {hover != null ? series.map((s) => (s.valores[hover] == null ? null : <circle key={s.nome} cx={xDe(hover)} cy={yDe(s.valores[hover] as number)} r="4" fill={s.cor} />)) : null}
      </svg>
      {hover != null ? (
        <p className="sjMini">{rotulos[hover]} — {series.map((s) => `${s.nome}: ${s.valores[hover] == null ? "—" : pct(s.valores[hover])}`).join(" • ")}</p>
      ) : null}
    </div>
  );
}
