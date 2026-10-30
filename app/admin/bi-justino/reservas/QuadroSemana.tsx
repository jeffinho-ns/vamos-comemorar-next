"use client";

import { useState } from "react";
import { TabelaQuadroSemana } from "../tabelasReais";
import { Cartao } from "../operacao/Cartao";
import { DIA_LONGO, datasDaSemana, deslocarDias, diaSemana, fmtData, hojeSp, segundaDe } from "../operacao/formato";
import type { BiLiveData } from "../useBiLive";
import type { ReservaDia } from "./tipos";

const LINHAS: [string, keyof Pick<ReservaDia, "pax" | "happyHour" | "despedida" | "aniversario">][] = [["Reservas (pax)", "pax"], ["Happy Hour", "happyHour"], ["Despedida", "despedida"], ["Aniversário", "aniversario"]];

/** "Quadro geral da semana / do mês" (renderReservasWeekly/renderReservasMonthly) + quadro do NOSSO banco (TabelaQuadroSemana). */
export function QuadroSemana({ porData, eventosPax, live, recarregar }: { porData: Record<string, ReservaDia>; eventosPax: Record<string, number>; live: BiLiveData | null; recarregar: () => void }) {
  const hoje = hojeSp();
  const [modo, setModo] = useState<"semana" | "mes">("semana");
  const [segunda, setSegunda] = useState(segundaDe(hoje));
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const dates = modo === "semana" ? datasDaSemana(segunda) : (() => {
    const [y, m] = mes.split("-").map(Number);
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Array.from({ length: n }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
  })();
  const val = (d: string, k: keyof ReservaDia) => Number(porData[d]?.[k]) || 0;

  return (
    <Cartao titulo="Quadro geral da semana" aberto={false}>
      <div className="sjRole"><h3>{modo === "mes" ? "Quadro geral do mês" : "Quadro geral da semana"}</h3><span className="opLinhaAcoes" style={{ marginTop: 0 }}><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => window.print()}>🖨 Imprimir</button></span></div>
      <div className="sjToolbar">
        <div className="sjTb"><label>Visualização<select className="sjInput" value={modo} onChange={(e) => setModo(e.target.value as "semana" | "mes")}><option value="semana">Semana</option><option value="mes">Mês completo</option></select></label></div>
        {modo === "semana" ? (
          <>
            <div className="sjTb"><label>Semana começando em (segunda-feira)<input className="sjInput" type="date" value={segunda} onChange={(e) => setSegunda(e.target.value ? segundaDe(e.target.value) : segunda)} /></label></div>
            <button type="button" className="sjAnaliseBtn" onClick={() => setSegunda(deslocarDias(segunda, -7))}>‹ Semana anterior</button>
            <button type="button" className="sjAnaliseBtn" onClick={() => setSegunda(deslocarDias(segunda, 7))}>Próxima semana ›</button>
          </>
        ) : <div className="sjTb"><label>Mês<input className="sjInput" type="month" value={mes} onChange={(e) => setMes(e.target.value || mes)} /></label></div>}
      </div>
      <div className="sjTableInner opTabela">
        {modo === "semana" ? (
          <table>
            <thead><tr><th>Indicador</th>{dates.map((d) => <th key={d}>{DIA_LONGO[diaSemana(d)]}<br /><span className="sjMini">{fmtData(d)}</span></th>)}<th>Total</th></tr></thead>
            <tbody>
              {LINHAS.map(([label, k]) => { const tot = dates.reduce((t, d) => t + val(d, k), 0); return <tr key={k}><td><b>{label}</b></td>{dates.map((d) => <td key={d}>{val(d, k) || "—"}</td>)}<td><b>{tot || "—"}</b></td></tr>; })}
              {(() => { const tot = dates.reduce((t, d) => t + (eventosPax[d] || 0), 0); return <tr><td><b>Eventos (pax)</b></td>{dates.map((d) => <td key={d}>{eventosPax[d] || "—"}</td>)}<td><b>{tot || "—"}</b></td></tr>; })()}
              <tr className="opTotal"><td>Total geral (pax)</td><td colSpan={dates.length} className="sjMini">soma da semana inteira</td><td>{dates.reduce((t, d) => t + val(d, "pax"), 0)}</td></tr>
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>Data</th><th>Reservas (pax)</th><th>Happy Hour</th><th>Despedida</th><th>Aniversário</th><th>Eventos (pax)</th></tr></thead>
            <tbody>
              {dates.map((d) => <tr key={d}><td>{fmtData(d)}</td><td>{val(d, "pax") || "—"}</td><td>{val(d, "happyHour") || "—"}</td><td>{val(d, "despedida") || "—"}</td><td>{val(d, "aniversario") || "—"}</td><td>{eventosPax[d] || "—"}</td></tr>)}
              <tr className="opTotal"><td>Total do mês</td><td>{dates.reduce((t, d) => t + val(d, "pax"), 0)}</td><td>{dates.reduce((t, d) => t + val(d, "happyHour"), 0)}</td><td>{dates.reduce((t, d) => t + val(d, "despedida"), 0)}</td><td>{dates.reduce((t, d) => t + val(d, "aniversario"), 0)}</td><td>{dates.reduce((t, d) => t + (eventosPax[d] || 0), 0)}</td></tr>
            </tbody>
          </table>
        )}
      </div>
      <h3 className="sjFormTitulo" style={{ fontSize: 14 }}>Reservas do Agilizai (nosso banco) — semana atual</h3>
      <TabelaQuadroSemana live={live} />
    </Cartao>
  );
}
