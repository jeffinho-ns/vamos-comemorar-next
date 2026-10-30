"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { AnaliseBloco } from "./AnaliseBloco";
import { reais } from "./numeros";

export type SerieLinha = {
  nome: string;
  cor: string;
  valores: (number | null)[];
  area?: boolean;
  tracejado?: boolean;
};

const LARGURA = 860;
const ALTURA = 240;
const PAD_L = 10;
const PAD_R = 10;
const PAD_T = 16;
const PAD_B = 10;

function curva(pontos: number[][]) {
  if (pontos.length < 2) return "";
  if (pontos.length === 2) {
    return `M${pontos[0][0].toFixed(1)},${pontos[0][1].toFixed(1)} L${pontos[1][0].toFixed(1)},${pontos[1][1].toFixed(1)}`;
  }
  let caminho = `M${pontos[0][0].toFixed(1)},${pontos[0][1].toFixed(1)}`;
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const p0 = pontos[i - 1] || pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    caminho += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return caminho;
}

function trilhas(valores: (number | null)[], xDe: (indice: number) => number, yDe: (valor: number) => number) {
  const saida: number[][][] = [];
  let atual: number[][] = [];
  valores.forEach((valor, indice) => {
    if (valor == null || !Number.isFinite(valor)) {
      if (atual.length) saida.push(atual);
      atual = [];
      return;
    }
    atual.push([xDe(indice), yDe(valor)]);
  });
  if (atual.length) saida.push(atual);
  return saida;
}

export function GraficoLinha({
  rotulos,
  series,
  aria,
  analise,
  forcar = 0,
  vazio = "Sem dado suficiente ainda.",
}: {
  rotulos: string[];
  series: SerieLinha[];
  aria: string;
  analise?: string;
  forcar?: number;
  vazio?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const gradiente = useId().replace(/:/g, "");
  const numeros = series.flatMap((serie) => serie.valores.filter((valor): valor is number => valor != null && Number.isFinite(valor)));
  if (rotulos.length < 2 || numeros.length < 2) return <p className="sjMini">{vazio}</p>;

  const chartW = LARGURA - PAD_L - PAD_R;
  const chartH = ALTURA - PAD_T - PAD_B;
  const minimo = Math.min(...numeros) * 0.9;
  const maximo = Math.max(1, Math.max(...numeros) * 1.08);
  const xDe = (indice: number) => PAD_L + indice * (chartW / (rotulos.length - 1));
  const yDe = (valor: number) => PAD_T + chartH - ((valor - minimo) / Math.max(1, maximo - minimo)) * chartH;
  const base = PAD_T + chartH;
  const passo = Math.max(1, Math.ceil(rotulos.length / 10));
  const comArea = series.find((serie) => serie.area);

  function aoMover(evento: PointerEvent<HTMLDivElement>) {
    const svg = caixa.current?.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = (evento.clientX - rect.left) * (LARGURA / Math.max(1, rect.width));
    let indice = Math.round((xSvg - PAD_L) / (chartW / (rotulos.length - 1)));
    indice = Math.max(0, Math.min(rotulos.length - 1, indice));
    setHover(indice);
  }

  return (
    <>
      {series.length > 1 ? (
        <div className="sjLegenda">
          {series.map((serie) => (
            <span key={serie.nome}>
              <i className={serie.tracejado ? "sjDash" : undefined} style={serie.tracejado ? undefined : { background: serie.cor }} />
              {serie.nome}
            </span>
          ))}
        </div>
      ) : null}
      <div className="sjFatHover" ref={caixa} onPointerMove={aoMover} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="sjFatSvg" role="img" aria-label={aria}>
          {comArea ? (
            <defs>
              <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={comArea.cor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={comArea.cor} stopOpacity="0" />
              </linearGradient>
            </defs>
          ) : null}
          <line x1={PAD_L} y1={base} x2={LARGURA - PAD_R} y2={base} stroke="#271f1a" strokeWidth="1" />
          {series.map((serie) => (serie.area ? trilhas(serie.valores, xDe, yDe).map((trilha, indice) => {
            if (trilha.length < 2) return null;
            const d = curva(trilha);
            const ultimo = trilha[trilha.length - 1];
            const primeiro = trilha[0];
            return (
              <path
                key={`${serie.nome}-area-${indice}`}
                d={`${d} L${ultimo[0].toFixed(1)},${base.toFixed(1)} L${primeiro[0].toFixed(1)},${base.toFixed(1)} Z`}
                fill={`url(#${gradiente})`}
              />
            );
          }) : null))}
          {series.map((serie) => trilhas(serie.valores, xDe, yDe).map((trilha, indice) => (
            trilha.length < 2 ? null : (
              <path
                key={`${serie.nome}-${indice}`}
                d={curva(trilha)}
                fill="none"
                stroke={serie.cor}
                strokeWidth={serie.area ? 2.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={serie.tracejado ? "7 5" : undefined}
                opacity={serie.tracejado ? 0.85 : 1}
              />
            )
          )))}
        </svg>
        {hover != null ? (
          <>
            <div className="sjCross" style={{ left: `${(xDe(hover) / LARGURA) * 100}%` }} />
            <div className="sjTip" style={{ left: `${Math.min(68, (xDe(hover) / LARGURA) * 100)}%` }}>
              <small>{rotulos[hover]}</small>
              {series.map((serie) => {
                const valor = serie.valores[hover];
                return (
                  <div key={serie.nome}>
                    <span>{serie.nome}</span>
                    <b>{valor == null ? "—" : reais(valor)}</b>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      <div className="sjChartEixo">
        {rotulos.map((rotulo, indice) => <span key={`${rotulo}-${indice}`}>{indice % passo === 0 ? rotulo : ""}</span>)}
      </div>
      {analise ? <AnaliseBloco texto={analise} forcar={forcar} /> : null}
    </>
  );
}
