"use client";

import { useState } from "react";
import { chamarBi, type DadosPlanilha } from "../usePlanilha";
import { lerRanking } from "./espelhoDados";
import { reais } from "./numeros";

const GRUPOS = [
  ["voz", "Voz e Violão"],
  ["banda", "Banda"],
  ["dj", "DJ"],
] as const;

const DIAS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

function dataCurta(iso: string) {
  const dia = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return iso;
  const [ano, mes, d] = dia.split("-");
  return `${DIAS[new Date(`${dia}T12:00:00`).getDay()]} ${d}/${mes}/${ano}`;
}

/** Card "Top bandas • faturamento & público" (getBandRanking + atualizarBandRanking). */
export function TopBandas({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number][0]>("voz");
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const { itens, calculadoEm } = lerRanking(dados);
  const visiveis = itens.filter((item) => (item.grupo || "banda") === grupo).slice(0, 6);

  async function atualizar() {
    setOcupado(true);
    setStatus("Recalculando…");
    const r = await chamarBi<{ ok?: boolean; error?: string; count?: number; apresentacoes?: number; diasComReceita?: number }>("/api/bi/justino/marketing/bandas/atualizar", {});
    setOcupado(false);
    if (!r.ok || !r.json?.ok) {
      setStatus(`Não consegui atualizar o ranking: ${r.json?.error || "erro"}`);
      onSalvo();
      return;
    }
    setStatus(`Ranking atualizado: ${r.json.count ?? 0} atrações (${r.json.apresentacoes ?? 0} apresentações cruzadas com ${r.json.diasComReceita ?? 0} dias de receita).`);
    onSalvo();
  }

  return (
    <details className="sjCollapse">
      <summary><span className="sjChev">▸</span>Top bandas • faturamento &amp; público<span className="sjHint">clique para abrir</span></summary>
      <section className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Top bandas • faturamento &amp; público</h3>
          <span>
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" disabled={ocupado} onClick={() => { void atualizar(); }}>🔄 Atualizar</button>{" "}
            <span className="sjMini">{calculadoEm ? `calculado em ${dataCurta(calculadoEm)}` : ""}</span>
          </span>
        </div>
        <p className="sjNote">Cruza a agenda artística (planilha externa) com o faturamento e público reais do ZigPay, dia a dia. Quando 2 ou mais atrações tocam no mesmo dia, o faturamento é do DIA INTEIRO, não só daquela atração — por isso só entram aqui atrações com pelo menos 2 dias de faturamento real confirmado (não estimado). O ranking é recalculado sozinho todo dia (11h) a partir da planilha da agenda artística, e na hora ao clicar em Atualizar.</p>
        {status ? <p className="sjMini" role="status">{status}</p> : null}
        <div className="sjDias" role="tablist" aria-label="Tipo de atração">
          {GRUPOS.map(([id, nome]) => (
            <button key={id} type="button" className={grupo === id ? "on" : ""} aria-pressed={grupo === id} onClick={() => setGrupo(id)}>{nome}</button>
          ))}
        </div>
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Atração</th><th>Dias com dado real</th><th>Faturamento médio/dia</th><th>Público médio/dia</th></tr></thead>
            <tbody>
              {!itens.length ? <tr><td colSpan={4} className="sjMini">Sem ranking calculado ainda.</td></tr>
                : !visiveis.length ? <tr><td colSpan={4} className="sjMini">Sem atração desse tipo com dado suficiente ainda.</td></tr>
                  : visiveis.map((item) => (
                    <tr key={item.banda}><td>{item.banda}</td><td>{item.diasComDadoReal}/{item.aparicoesTotal}</td><td>{reais(item.faturamentoMedio)}</td><td>{Math.round(item.publicoMedio)}</td></tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>
    </details>
  );
}
