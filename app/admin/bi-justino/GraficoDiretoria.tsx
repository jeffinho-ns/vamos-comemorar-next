"use client";

import { useMemo, useRef, useState } from "react";
import type { ZigAoVivo } from "./zigValor";

type Ponto = { rotulo: string; zig: number; eventos: number };
type Serie = { name: string; color: string; values: number[] };

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

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

function analise(rotulos: string[], series: Serie[]) {
  if (rotulos.length < 4) return "Poucos pontos no gráfico pra tirar uma tendência confiável.";
  return series.map((serie) => {
    const valores = serie.values;
    const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
    let maior = 0;
    let menor = 0;
    valores.forEach((valor, indice) => {
      if (valor > valores[maior]) maior = indice;
      if (valor < valores[menor]) menor = indice;
    });
    const ultimo = valores[valores.length - 1];
    const rumo = ultimo > valores[0] ? "em alta" : ultimo < valores[0] ? "em queda" : "estável";
    return `${serie.name} está ${rumo}. Maior ${reais(valores[maior])} (${rotulos[maior]}), menor ${reais(valores[menor])} (${rotulos[menor]}), média ${reais(media)}.`;
  }).join(" ");
}

function analiseBarras(itens: { label: string; valor: number }[]) {
  const positivos = itens.filter((item) => item.valor > 0).sort((a, b) => b.valor - a.valor);
  if (!positivos.length) return "Sem valores no gráfico ainda.";
  const total = positivos.reduce((soma, item) => soma + item.valor, 0);
  const fatia = (valor: number) => `${((valor / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return `Total ${reais(total)} em ${positivos.length} áreas. Maior: ${positivos[0].label}, ${reais(positivos[0].valor)} (${fatia(positivos[0].valor)}).`;
}

function LinhaSuave({ pontos, series }: { pontos: Ponto[]; series: Serie[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ indice: number; esquerda: number } | null>(null);
  const largura = 860;
  const altura = 260;
  const padL = 10;
  const padR = 10;
  const padT = 16;
  const padB = 10;
  const chartW = largura - padL - padR;
  const chartH = altura - padT - padB;
  const todos = series.flatMap((serie) => serie.values);
  const minimo = Math.min(...todos) * 0.92;
  const maximo = Math.max(1, Math.max(...todos) * 1.06);
  const xDe = (indice: number) => padL + (pontos.length > 1 ? indice * (chartW / (pontos.length - 1)) : 0);
  const yDe = (valor: number) => padT + chartH - ((valor - minimo) / Math.max(1, maximo - minimo)) * chartH;
  const desenhos = series.map((serie) => serie.values.map((valor, indice) => [xDe(indice), yDe(valor)]));
  const base = padT + chartH;
  const passo = Math.max(1, Math.ceil(pontos.length / 12));

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    const svg = caixa.current?.querySelector("svg");
    if (!svg || pontos.length < 2) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = (evento.clientX - rect.left) * (largura / rect.width);
    let indice = Math.round((xSvg - padL) / (chartW / (pontos.length - 1)));
    indice = Math.max(0, Math.min(pontos.length - 1, indice));
    const xPct = xDe(indice) / largura;
    const larguraCaixa = caixa.current?.getBoundingClientRect().width || rect.width;
    let esquerda = xPct * larguraCaixa + 14;
    if (esquerda + 190 > larguraCaixa) esquerda = xPct * larguraCaixa - 204;
    setHover({ indice, esquerda: Math.max(0, esquerda) });
  }

  return (
    <>
      <div
        className="sjFatHover"
        ref={caixa}
        onPointerMove={aoMover}
        onPointerLeave={() => setHover(null)}
      >
      <svg viewBox={`0 0 ${largura} ${altura}`} className="sjFatSvg" role="img" aria-label="Faturamento ZigPay e eventos">
        <defs>
          <linearGradient id="fatAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c96736" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c96736" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padL} y1={base} x2={largura - padR} y2={base} stroke="#271f1a" strokeWidth="1" />
        {series.length === 1 ? (
          <path d={`${curva(desenhos[0])} L${desenhos[0][desenhos[0].length - 1][0].toFixed(1)},${base.toFixed(1)} L${desenhos[0][0][0].toFixed(1)},${base.toFixed(1)} Z`} fill="url(#fatAreaGrad)" />
        ) : null}
        {series.map((serie, indice) => (
          <g key={serie.name}>
            <path d={curva(desenhos[indice])} fill="none" stroke={serie.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {desenhos[indice].map((ponto) => (
              <circle key={`${serie.name}-${ponto[0]}`} cx={ponto[0]} cy={ponto[1]} r="3" fill="#0d0b0a" stroke={serie.color} strokeWidth="2" />
            ))}
          </g>
        ))}
      </svg>
      {hover ? (
        <>
          <div className="sjCross" style={{ left: `${(xDe(hover.indice) / largura) * 100}%` }} />
          <div className="sjTip" style={{ left: hover.esquerda }}>
            <small>{pontos[hover.indice].rotulo}</small>
            {series.map((serie) => (
              <div key={serie.name}>
                <span>{serie.name}</span>
                <b>{reais(serie.values[hover.indice])}</b>
              </div>
            ))}
          </div>
        </>
      ) : null}
      </div>
      <div className="sjChartEixo">
        {pontos.map((ponto, indice) => <span key={`${ponto.rotulo}-${indice}`}>{indice % passo === 0 ? ponto.rotulo : ""}</span>)}
      </div>
    </>
  );
}

export function GraficoFaturamento({ zig }: { zig: ZigAoVivo | null }) {
  const [visao, setVisao] = useState<"junto" | "separado">("separado");
  const [modo, setModo] = useState<"mes" | "ano">("ano");
  const [aberta, setAberta] = useState(false);
  const pontos = useMemo<Ponto[]>(() => {
    const origem = modo === "ano" ? zig?.serieAno || [] : zig?.serieMes || [];
    return origem.map((ponto) => ({
      rotulo: ponto.rotulo || ("dia" in ponto ? ponto.dia.slice(8) : ponto.mes),
      zig: ponto.zig || 0,
      eventos: ponto.eventos || 0,
    }));
  }, [modo, zig]);
  const series = useMemo<Serie[]>(() => {
    if (visao === "separado") {
      return [
        { name: "ZigPay", color: "#c96736", values: pontos.map((ponto) => ponto.zig) },
        { name: "Eventos", color: "#a78bfa", values: pontos.map((ponto) => ponto.eventos) },
      ];
    }
    return [{
      name: "Faturamento (ZigPay+Eventos)",
      color: "#c96736",
      values: pontos.map((ponto) => ponto.zig + ponto.eventos),
    }];
  }, [pontos, visao]);
  const media = useMemo(() => {
    if (modo !== "ano" || pontos.length < 2) return null;
    const com = pontos.filter((ponto) => ponto.eventos > 0);
    const sem = pontos.filter((ponto) => ponto.eventos <= 0);
    const mediaDe = (lista: Ponto[]) => (lista.length
      ? lista.reduce((soma, ponto) => soma + ponto.zig + ponto.eventos, 0) / lista.length
      : null);
    return { com: mediaDe(com), sem: mediaDe(sem), nCom: com.length, nSem: sem.length };
  }, [modo, pontos]);

  return (
    <section className="sjCard sjBloco">
      <div className="sjFatHead">
        <h3>Faturamento</h3>
        <div className="sjFatToggles">
          <div className="sjSeg">
            <button type="button" className={visao === "junto" ? "on" : ""} onClick={() => setVisao("junto")}>Junto</button>
            <button type="button" className={visao === "separado" ? "on" : ""} onClick={() => setVisao("separado")}>Separado</button>
          </div>
          <div className="sjSeg">
            <button type="button" className={modo === "mes" ? "on" : ""} onClick={() => setModo("mes")}>Mês</button>
            <button type="button" className={modo === "ano" ? "on" : ""} onClick={() => setModo("ano")}>Ano</button>
          </div>
        </div>
      </div>
      {pontos.length < 2 ? (
        <p className="sjZigNota">{zig?.zigCarregando ? "Buscando o faturamento na ZigPay…" : "Sem dado de faturamento suficiente ainda."}</p>
      ) : (
        <>
          {series.length > 1 ? (
            <div className="sjLegenda">
              {series.map((serie) => (
                <span key={serie.name}><i style={{ background: serie.color }} />{serie.name}</span>
              ))}
            </div>
          ) : null}
          {media ? (
            <p className="sjZigNota">
              Média de faturamento no ano — com evento ({media.nCom} mês/meses): <b>{media.com == null ? "sem dado" : reais(media.com)}</b>
              {" "}• sem evento ({media.nSem} mês/meses): <b>{media.sem == null ? "sem dado" : reais(media.sem)}</b>
            </p>
          ) : null}
          <LinhaSuave pontos={pontos} series={series} />
          <button type="button" className="sjAnaliseBtn" onClick={() => setAberta((atual) => !atual)}>📊 Análise do gráfico</button>
          {aberta ? <p className="sjAnalise">{analise(pontos.map((ponto) => ponto.rotulo), series)} Leitura automática dos números do gráfico. Indica o rumo dos dados, não é previsão.</p> : null}
        </>
      )}
    </section>
  );
}

export function BarrasCusto({ custos, carregando }: { custos: { label: string; valor: number }[]; carregando?: boolean }) {
  const [aberta, setAberta] = useState(false);
  const topo = Math.max(1, ...custos.map((item) => item.valor));
  return (
    <section className="sjCard sjBloco">
      <h3>Custo por área</h3>
      {custos.length ? custos.map((item) => (
        <div key={item.label} className="sjBarra">
          <div className="sjBarraTop">
            <span>{item.label}</span>
            <b>{reais(item.valor)}</b>
          </div>
          <div className="sjBarraTrilho">
            <div style={{ width: `${Math.max(item.valor > 0 ? 2 : 0, Math.round((item.valor / topo) * 100))}%` }} />
          </div>
        </div>
      )) : <p className="sjZigNota">{carregando ? "Buscando os custos das áreas…" : "Sem dado ainda."}</p>}
      {custos.length ? (
        <>
          <button type="button" className="sjAnaliseBtn" onClick={() => setAberta((atual) => !atual)}>📊 Análise do gráfico</button>
          {aberta ? <p className="sjAnalise">{analiseBarras(custos)}</p> : null}
        </>
      ) : null}
    </section>
  );
}
