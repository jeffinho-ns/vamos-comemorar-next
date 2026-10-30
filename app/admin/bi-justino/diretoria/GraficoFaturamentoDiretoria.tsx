"use client";

import { useMemo, useState } from "react";
import { analiseBarras, analiseLinhas } from "../marketing/analiseTexto";
import { AnaliseBloco } from "../marketing/AnaliseBloco";
import type { ZigPorData } from "../marketing/espelhoDados";
import { GraficoLinha, type SerieLinha } from "../marketing/GraficoLinha";
import { hojeSp, reais } from "../marketing/numeros";

const MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Card "Faturamento" da Diretoria (renderFaturamentoChart): Junto/Separado × Mês/Ano, ZigPay + eventos realizados. */
export function GraficoFaturamentoDiretoria({ zig, eventosDia, eventosMes }: { zig: ZigPorData; eventosDia: Record<string, number>; eventosMes: Record<string, number> }) {
  const [visao, setVisao] = useState<"junto" | "separado">("junto");
  const [modo, setModo] = useState<"mes" | "ano">("mes");
  const { labels, zigValues, evValues } = useMemo(() => {
    const hoje = hojeSp();
    if (modo === "mes") {
      const mk = hoje.slice(0, 7);
      const dias = Number(hoje.slice(8, 10));
      const dates = Array.from({ length: dias }, (_, i) => `${mk}-${String(i + 1).padStart(2, "0")}`);
      return { labels: dates.map((d) => d.slice(8, 10)), zigValues: dates.map((d) => zig.revenue[d] || 0), evValues: dates.map((d) => eventosDia[d] || 0) };
    }
    const sums: Record<string, number> = {};
    Object.keys(zig.revenue).forEach((d) => {
      const mk = d.slice(0, 7);
      sums[mk] = (sums[mk] || 0) + (zig.revenue[d] || 0);
    });
    const [ano, mes] = hoje.split("-").map(Number);
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(ano, mes - 1 - (11 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    return { labels: months.map((mk) => MES_ABREV[Number(mk.slice(5, 7)) - 1]), zigValues: months.map((mk) => sums[mk] || 0), evValues: months.map((mk) => eventosMes[mk] || 0) };
  }, [modo, zig, eventosDia, eventosMes]);
  const total = zigValues.map((v, i) => v + evValues[i]);
  const series: SerieLinha[] = visao === "separado"
    ? [{ nome: "ZigPay", cor: "#c96736", valores: zigValues }, { nome: "Eventos", cor: "#a78bfa", valores: evValues }]
    : [{ nome: "Faturamento (ZigPay+Eventos)", cor: "#c96736", area: true, valores: total }];
  const media = useMemo(() => {
    if (modo !== "ano") return null;
    const com: number[] = [];
    const sem: number[] = [];
    total.forEach((v, i) => (evValues[i] > 0 ? com : sem).push(v));
    const avg = (arr: number[]) => (arr.length ? reais(arr.reduce((s, v) => s + v, 0) / arr.length) : "sem dado");
    return { com: avg(com), nCom: com.length, sem: avg(sem), nSem: sem.length };
  }, [modo, total, evValues]);

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
      {media ? <p className="sjZigNota">Média de faturamento no ano — <b>com evento</b> ({media.nCom} mês/meses): <b>{media.com}</b> • <b>sem evento</b> ({media.nSem} mês/meses): <b>{media.sem}</b></p> : null}
      <GraficoLinha
        rotulos={labels}
        series={series}
        aria="Faturamento ZigPay e eventos"
        analise={analiseLinhas(labels, series.map((s) => ({ name: s.nome, values: s.valores.map((v) => v ?? 0) }))).join(" ")}
        vazio="Sem dado de faturamento suficiente ainda."
      />
    </section>
  );
}

/** Card "Custo por área" (renderCustoPorAreaBars / renderCostBarsBase). */
export function CustoPorArea({ itens, carregando }: { itens: { label: string; value: number }[]; carregando: boolean }) {
  const maxV = Math.max(1, ...itens.map((e) => e.value));
  return (
    <section className="sjCard sjBloco">
      <h3>Custo por área</h3>
      {!itens.length ? <p className="sjMini">{carregando ? "Carregando…" : "Sem dado ainda."}</p> : (
        <>
          {itens.map((e) => (
            <div key={e.label} className="sjBarra">
              <div className="sjBarraTop"><span>{e.label}</span><b>{reais(e.value)}</b></div>
              <div className="sjBarraTrilho"><div style={{ width: `${Math.max(2, Math.round((e.value / maxV) * 100))}%` }} /></div>
            </div>
          ))}
          <AnaliseBloco texto={analiseBarras(itens).join(" ")} forcar={0} />
        </>
      )}
    </section>
  );
}
