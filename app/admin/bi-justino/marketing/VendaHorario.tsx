"use client";

import { useMemo, useState } from "react";
import type { DadosPlanilha } from "../usePlanilha";
import { analiseHorario } from "./analiseTexto";
import { AnaliseBloco } from "./AnaliseBloco";
import type { ZigPorData } from "./espelhoDados";
import { GraficoHorario } from "./GraficoHorario";
import { reais } from "./numeros";
import { bucketsDetalhe, bucketsHorario, vendaPorHorario } from "./series";
import { BANDA_DURACAO_PADRAO_H, sugerirHorarios } from "./sugestaoAtracao";

/** Card "🕒 Venda por horário • média histórica por dia da semana" + sugestão de horário pra banda/DJ. */
export function VendaHorario({ dados, zig, onSalvo, forcar }: { dados: DadosPlanilha; zig: ZigPorData; onSalvo: () => void; forcar: number }) {
  const [sugestaoAberta, setSugestaoAberta] = useState(false);
  const [duracao, setDuracao] = useState(String(BANDA_DURACAO_PADRAO_H));
  const buckets = useMemo(() => bucketsHorario(dados), [dados]);
  const detalhe = useMemo(() => bucketsDetalhe(dados), [dados]);
  const estado = useMemo(() => vendaPorHorario(buckets, zig), [buckets, zig]);
  const sugestoes = useMemo(() => (sugestaoAberta ? sugerirHorarios(buckets, detalhe, Number(duracao.replace(",", ".")) || BANDA_DURACAO_PADRAO_H) : []), [sugestaoAberta, buckets, detalhe, duracao]);

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>🕒 Venda por horário • média histórica por dia da semana</h3>
        <span>
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={() => setSugestaoAberta((atual) => !atual)}>💡 Sugestão de horário pra banda/DJ</button>{" "}
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
        </span>
      </div>
      <p className="sjNote">
        Faturamento médio de cada bloco de 30min do dia, quebrado por dia da semana (mesmo formato do gráfico &quot;Total de venda por horário&quot; da própria ZigPay) — dia com faturamento zero (fechado) fica de fora da média, mesmo critério do padrão semanal. &quot;Geral&quot; é a média de todos os dias da semana juntos.
      </p>
      {sugestaoAberta ? (
        <section className="sjCard sjBloco">
          <div className="sjRole">
            <h3>💡 Sugestão de horário pra banda/DJ</h3>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" style={{ background: "#3a1620" }} onClick={() => setSugestaoAberta(false)}>✕</button>
          </div>
          <p className="sjNote">A partir do histórico de faturamento e entrada de clientes por bloco de 30min (mesma fonte do gráfico ao lado): pra cada dia que a casa abre, acha a(s) janela(s) de faturamento mais sustentado (não um pico de 1 bloco só, nem um salto isolado — soma toda a duração da atração, pra não confundir ruído estatístico com movimento de verdade). Sexta sugere 2 horários (2 bandas) e sábado sugere 3 (3 bandas); os outros dias sugerem 1. É indício de quando tem mais gente pra puxar, não prova de causa — pode ser que a casa já enche <i>porque</i> tem atração nesse horário, não o contrário. Confira sempre a entrada de clientes mostrada ao lado do faturamento antes de decidir.</p>
          <div className="sjToolbar">
            <div className="sjTb"><label>Duração da atração (horas)<input className="sjInput" type="number" min={0.5} max={4} step={0.5} value={duracao} onChange={(evento) => setDuracao(evento.target.value)} /></label></div>
          </div>
          {sugestoes.map((item) => (
            <div key={item.dia} className="sjFormBloco">
              <b>{item.dia}</b>
              {item.linhas.map((linha) => <p key={linha}>{linha}</p>)}
              {item.manual ? <p className="sjMini">{item.manual}</p> : null}
              {item.rodape ? <p className="sjMini">{item.rodape}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
      {!estado ? <p className="sjMini">Sem captura de horário ainda.</p> : !estado.clocks.length ? <p className="sjMini">Sem dia aberto com captura de horário ainda.</p> : (
        <>
          <div className="sjLegenda">
            {estado.series.map((serie) => <span key={serie.key}><i style={{ background: serie.cor }} />{serie.label}</span>)}
          </div>
          <GraficoHorario clocks={estado.clocks} series={estado.series} />
          <AnaliseBloco texto={analiseHorario(estado.clocks, estado.series).join(" ")} forcar={forcar} />
          <details className="sjMkDetalhe">
            <summary>Ver tabela de valores</summary>
            <div className="sjTableInner sjMkNota">
              <table>
                <thead><tr><th>Horário</th>{estado.series.map((serie) => <th key={serie.key}>{serie.label}</th>)}</tr></thead>
                <tbody>
                  {estado.clocks.map((c, i) => (
                    <tr key={c}><td>{c}</td>{estado.series.map((serie) => <td key={serie.key}>{reais(serie.valores[i])}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
