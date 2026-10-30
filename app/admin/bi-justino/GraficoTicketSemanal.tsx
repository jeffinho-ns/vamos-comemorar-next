"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ZigAoVivo } from "./zigValor";

type Semana = NonNullable<ZigAoVivo["semanas"]>[number];

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function deslocar(iso: string, dias: number) {
  const data = new Date(`${iso}T12:00:00`);
  data.setDate(data.getDate() + dias);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function segundaDe(iso: string) {
  const data = new Date(`${iso}T12:00:00`);
  return deslocar(iso, -((data.getDay() + 6) % 7));
}

function rotulo(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function reais(valor: number) {
  return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function pct(valor: number) {
  return `${(Number(valor) || 0).toFixed(1)}%`;
}

function regressao(valores: number[]) {
  const n = valores.length;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  valores.forEach((y, x) => {
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
  });
  const den = n * sxx - sx * sx;
  const slope = den ? (n * sxy - sx * sy) / den : 0;
  const icpt = (sy - slope * sx) / n;
  const media = sy / n;
  let ssTot = 0;
  let ssRes = 0;
  const fit = valores.map((_, x) => {
    const previsto = icpt + slope * x;
    ssTot += (valores[x] - media) ** 2;
    ssRes += (valores[x] - previsto) ** 2;
    return previsto;
  });
  return { slope, r2: ssTot ? 1 - ssRes / ssTot : 0, fit };
}

function textoAnalise(semanas: Semana[], valores: number[]) {
  const n = valores.length;
  if (n < 4) return "Poucas semanas com dado pra tirar uma tendência confiável.";
  const reg = regressao(valores);
  const ini = Math.max(1, reg.fit[0]);
  const fim = reg.fit[n - 1];
  const variacao = ((fim - ini) / ini) * 100;
  const direcao = Math.abs(variacao) < 3 ? "estável" : variacao > 0 ? "em alta" : "em queda";
  const marca = direcao === "estável" ? "➡️" : variacao > 0 ? "📈" : "📉";
  const k = Math.min(4, Math.floor(n / 2));
  const media = (lista: number[]) => lista.reduce((soma, valor) => soma + valor, 0) / lista.length;
  const ultimas = media(valores.slice(-k));
  const anteriores = media(valores.slice(-2 * k, -k));
  const delta = anteriores ? ((ultimas - anteriores) / anteriores) * 100 : 0;
  let maior = 0;
  let menor = 0;
  valores.forEach((valor, indice) => {
    if (valor > valores[maior]) maior = indice;
    if (valor < valores[menor]) menor = indice;
  });
  const forca = reg.r2 >= 0.5 ? "tendência clara" : reg.r2 >= 0.2 ? "tendência moderada" : "tendência fraca (muita oscilação semana a semana)";
  const sinal = (valor: number) => (valor >= 0 ? "+" : "");
  return `${marca} Ticket médio ${direcao}: a linha de tendência vai de ${reais(ini)} a ${reais(fim)} (${sinal(variacao)}${pct(variacao)} em ${n} semanas, ${sinal(reg.slope)}${reais(reg.slope)}/semana) — ${forca} (R² ${reg.r2.toFixed(2)}). Últimas ${k} semanas: média ${reais(ultimas)}, ${sinal(delta)}${pct(delta)} vs as ${k} anteriores (${reais(anteriores)}). Melhor: ${reais(valores[maior])} (semana de ${rotulo(semanas[maior].inicio)}). Pior: ${reais(valores[menor])} (semana de ${rotulo(semanas[menor].inicio)}).`;
}

function curva(pontos: number[][]) {
  if (pontos.length < 2) return "";
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

function Traco({ d, color }: { d: string; color: string }) {
  const ref = useRef<SVGPathElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !d) return;
    const len = el.getTotalLength();
    if (!Number.isFinite(len) || len <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.transition = "none";
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    const frame = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 780ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.strokeDashoffset = "0";
    });
    return () => cancelAnimationFrame(frame);
  }, [d]);
  return <path ref={ref} d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
}

export function GraficoTicketSemanal({
  zig,
  onAtualizar,
}: {
  zig: ZigAoVivo | null;
  onAtualizar?: () => void;
}) {
  const [aberta, setAberta] = useState(true);
  const serie = useMemo(() => {
    const segunda = segundaDe(hojeSp());
    const inicio = deslocar(segunda, -13 * 7);
    return (zig?.semanas || [])
      .filter((semana) => semana.inicio >= inicio && semana.inicio < segunda && semana.ticket != null && semana.publico > 0)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [zig?.semanas]);
  const valores = serie.map((semana) => semana.ticket || 0);
  const tendencia = valores.length >= 4 ? regressao(valores) : null;
  const analise = textoAnalise(serie, valores);

  const largura = 860;
  const altura = 240;
  const padL = 10;
  const padR = 10;
  const padT = 16;
  const padB = 10;
  const chartW = largura - padL - padR;
  const chartH = altura - padT - padB;
  const todos = tendencia ? [...valores, ...tendencia.fit] : valores;
  const minimo = Math.min(...todos, 0) * 0.9;
  const maximo = Math.max(1, ...todos) * 1.08;
  const xDe = (indice: number) => padL + (serie.length > 1 ? indice * (chartW / (serie.length - 1)) : 0);
  const yDe = (valor: number) => padT + chartH - ((valor - minimo) / Math.max(1, maximo - minimo)) * chartH;
  const pontos = valores.map((valor, indice) => [xDe(indice), yDe(valor)]);
  const linha = tendencia ? tendencia.fit.map((valor, indice) => [xDe(indice), yDe(valor)]) : [];
  const base = padT + chartH;
  const passo = Math.max(1, Math.ceil(serie.length / 10));
  const caixa = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    const svg = caixa.current?.querySelector("svg");
    if (!svg || serie.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = (evento.clientX - rect.left) * (largura / rect.width);
    let indice = Math.round((xSvg - padL) / (chartW / (serie.length - 1)));
    indice = Math.max(0, Math.min(serie.length - 1, indice));
    setHover(indice);
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjFatHead">
        <h3>Ticket médio semanal — últimos 3 meses</h3>
        <button type="button" className="sjAnaliseBtn" onClick={onAtualizar}>Atualizar</button>
      </div>
      <p className="sjZigNota">
        Semanas de segunda a domingo já fechadas. Ticket médio = faturamento ÷ público (ZigPay). Linha tracejada = tendência (regressão linear).
        {serie.length >= 4 ? ` Período: semana de ${rotulo(serie[0].inicio)} a ${rotulo(serie[serie.length - 1].inicio)} (${serie.length} semanas).` : ""}
      </p>
      {serie.length < 4 ? (
        <p className="sjZigNota">Ainda não há 4 semanas fechadas com público capturado pra montar a tendência.</p>
      ) : (
        <>
          <div className="sjLegenda">
            <span><i style={{ background: "#60a5fa" }} />Ticket médio semanal</span>
            <span><i className="sjDash" />Tendência</span>
          </div>
          <div className="sjFatHover" ref={caixa} onPointerMove={aoMover} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${largura} ${altura}`} className="sjFatSvg" role="img" aria-label="Ticket médio semanal dos últimos 3 meses">
              <defs>
                <linearGradient id="ticketArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={padL} y1={base} x2={largura - padR} y2={base} stroke="#271f1a" strokeWidth="1" />
              <path d={`${curva(pontos)} L${pontos[pontos.length - 1][0].toFixed(1)},${base.toFixed(1)} L${pontos[0][0].toFixed(1)},${base.toFixed(1)} Z`} fill="url(#ticketArea)" />
              <Traco d={curva(pontos)} color="#60a5fa" />
              <path d={curva(linha)} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeDasharray="7 5" opacity="0.85" />
            </svg>
            {hover != null ? (
              <>
                <div className="sjCross" style={{ left: `${(xDe(hover) / largura) * 100}%` }} />
                <div className="sjTip" style={{ left: `${Math.min(70, (xDe(hover) / largura) * 100)}%` }}>
                  <small>Semana de {rotulo(serie[hover].inicio)}</small>
                  <div><span>Ticket médio semanal</span><b>{reais(valores[hover])}</b></div>
                  {tendencia ? <div><span>Tendência</span><b>{reais(tendencia.fit[hover])}</b></div> : null}
                </div>
              </>
            ) : null}
          </div>
          <div className="sjChartEixo">
            {serie.map((semana, indice) => <span key={semana.inicio}>{indice % passo === 0 ? rotulo(semana.inicio) : ""}</span>)}
          </div>
          <button type="button" className="sjAnaliseBtn" onClick={() => setAberta((atual) => !atual)}>📊 Análise do gráfico</button>
          {aberta ? <p className="sjAnalise">{analise} Leitura automática dos números do gráfico (regressão linear e médias). Indica o rumo dos dados, não é previsão.</p> : null}
        </>
      )}
    </section>
  );
}
