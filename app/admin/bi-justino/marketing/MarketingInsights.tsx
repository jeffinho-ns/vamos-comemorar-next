"use client";

import { useMemo, useState } from "react";
import type { DadosPlanilha } from "../usePlanilha";
import { lerEntradas, lerRanking, lerZig, mkAtualPorData } from "./espelhoDados";
import { calcularInsights, dicasDoDia, INS_ORDEM, nomeDia, type Classe, type Diag, type LinhaDia } from "./insightsCalculo";
import { addDias, reais } from "./numeros";
import { bucketsHorario } from "./series";

const DIAG_LABEL: Record<Diag, string> = { fluxo: "fluxo", ticket: "ticket", ambos: "fluxo + ticket", modelo: "modelo", equilibrado: "" };

function ddmm(d: string) {
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
}
function sinal(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
}

function Selo({ classe }: { classe: Classe | null }) {
  if (classe === "forte") return <span className="sjBadgeG">forte</span>;
  if (classe === "fraco") return <span className="sjBadgeR">fraco</span>;
  if (classe === "médio") return <span className="sjBadge">médio</span>;
  return <span className="sjMini">—</span>;
}

function Tendencia({ linha }: { linha: LinhaDia }) {
  if (!linha.trend) return <span className="sjMini">—</span>;
  const p = linha.trend.pct;
  if (p >= 10) return <span className="sjBadgeG">{sinal(p)}</span>;
  if (p <= -10) return <span className="sjBadgeR">{sinal(p)}</span>;
  return <span className="sjMini">{sinal(p)}</span>;
}

function Lista({ itens }: { itens: readonly string[] }) {
  return <ul className="sjMkLista">{itens.map((item) => <li key={item}>{item}</li>)}</ul>;
}

/** Sub-aba "Insights" do Marketing (renderInsightsMk). */
export function MarketingInsights({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const ctx = useMemo(() => {
    const ranking = lerRanking(dados);
    const nota = ranking.calculadoEm ? `calculado em ${ranking.calculadoEm.slice(0, 10)}` : "";
    return calcularInsights(lerZig(dados), mkAtualPorData(lerEntradas(dados, "marketing")), bucketsHorario(dados), ranking.itens, nota);
  }, [dados]);
  const ab = ctx.lista.filter((l) => l.n >= 3 && l.ratio != null);
  const fracos = [...ab].sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0));
  const foco = fracos[0];
  const melhor = [...ab].sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))[0];
  const [escolha, setEscolha] = useState<number | null>(null);
  const wd = escolha ?? foco?.wd ?? 5;
  const atual = ctx.lista.find((l) => l.wd === wd) ?? ctx.lista[0];
  const dicas = dicasDoDia(atual, ctx);
  const suficiente = ab.length >= 2;

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>💡 Insights de Marketing • por dia da semana</h3>
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
        </div>
        <p className="sjNote">Cruza faturamento, público, ticket médio, venda por horário, gasto de marketing e ranking de atrações pra sugerir ativações que melhorem o fluxo de cada dia da semana. <b>Atualiza toda segunda-feira</b>: usa sempre as últimas 8 semanas fechadas (até o domingo), então o conteúdo só muda quando vira a semana. Cada dia traz <b>como o dia funciona</b> (Manual Operacional, ago/2026), <b>o que os dados mostram</b>, o <b>cruzamento dados × manual</b> e as <b>sugestões</b> (opinião a validar com a operação). Ideias de ativação também vêm do Manual de Marketing 2022, cujos valores podem estar desatualizados.</p>
        <p className="sjMini">Edição da semana de {ddmm(ctx.segAtual)} • dados de {ddmm(ctx.ini)} a {ddmm(ctx.fim)} (8 semanas fechadas) • próxima atualização automática: segunda, {ddmm(addDias(ctx.segAtual, 7))}</p>
      </section>
      <section className="sjCard sjBloco">
        {!suficiente ? <p className="sjMini">Ainda não há dias suficientes com faturamento e público capturados nas últimas 8 semanas fechadas pra cruzar os dados.</p> : (
          <>
            <div><b>Resumo por dia da semana</b> <span className="sjMini">(média dos dias abertos; dia sem faturamento fica de fora)</span></div>
            <div className="sjTableInner sjMkTabela">
              <table>
                <thead><tr><th>Dia</th><th>Dias abertos</th><th>Faturamento médio</th><th>Público médio</th><th>Ticket médio</th><th>Leitura</th><th>Tendência</th></tr></thead>
                <tbody>
                  {ctx.lista.map((l) => (
                    <tr key={l.wd}>
                      <td>{nomeDia(l.wd)}</td>
                      <td>{l.n}/8</td>
                      <td>{l.n ? reais(l.fat) : "—"}</td>
                      <td>{l.pub != null ? Math.round(l.pub) : "—"}</td>
                      <td>{l.tk != null ? reais(l.tk) : "—"}</td>
                      <td><Selo classe={l.classe} /></td>
                      <td><Tendencia linha={l} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {foco && foco.ratio != null && foco.ratio < 0.85 ? (
              <p>🎯 <b>Foco da semana: {nomeDia(foco.wd)}</b> (dia mais fraco: {reais(foco.fat)}, {Math.round(foco.ratio * 100)}% da média). <span className="sjMini">Simulação: levar este dia a 85% da média ({reais(0.85 * ctx.mFat)}) adicionaria ≈ {reais((0.85 * ctx.mFat - foco.fat) * 4)} por mês (4 ocorrências).</span></p>
            ) : (
              <p>🎯 Nenhum dia está abaixo de 85% da média dos dias abertos — foco em elevar a média geral e proteger {melhor ? nomeDia(melhor.wd) : "o dia mais forte"} (o mais forte).</p>
            )}
          </>
        )}
      </section>
      <section className="sjCard sjBloco">
        <div className="sjMkDias" role="group" aria-label="Dia da semana">
          {INS_ORDEM.map((d) => {
            const l = ctx.lista.find((x) => x.wd === d);
            return (
              <button key={d} type="button" className={wd === d ? "on" : ""} aria-pressed={wd === d} onClick={() => setEscolha(d)}>
                {nomeDia(d).replace("-feira", "")}
                <span>
                  {l?.classe ? <Selo classe={l.classe} /> : null}
                  {l?.diag && l.diag !== "equilibrado" ? <span className="sjBadgeP">{DIAG_LABEL[l.diag]}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
        {suficiente ? (
          <>
            <h4 className="sjMkH4">{nomeDia(atual.wd)}</h4>
            {dicas.manual.length ? <><p><b>📖 Como o dia funciona</b> <span className="sjMini">(Manual Operacional, v1 ago/2026)</span></p><Lista itens={dicas.manual} /></> : null}
            <p><b>📌 O que os dados mostram</b></p>
            <Lista itens={dicas.dado} />
            {dicas.cruz.length ? <><p><b>🔗 Dados × Manual</b> <span className="sjMini">(cruzamento da programação do dia com o que aconteceu)</span></p><Lista itens={dicas.cruz} /></> : null}
            {dicas.sug.length ? <><p><b>💡 Sugestões de ativação</b> <span className="sjMini">(opinião a partir dos dados — valide com a operação)</span></p><Lista itens={dicas.sug} /></> : null}
          </>
        ) : <p className="sjMini">Abra esta página pra gerar os insights…</p>}
      </section>
    </>
  );
}
