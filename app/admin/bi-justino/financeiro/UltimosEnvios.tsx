"use client";

import { useMemo, useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Cabecalho } from "./ui";
import { MONTH_LABEL_PT, fmtDate, fmtTime, monthKeyAdd, todayStr, type EntryDoc, type MonthClosure, isMonthClosedFor } from "./comum";

export interface EstatisticaEnvio { label: string; val: string }

/**
 * "Últimos envios • <área>" do painel do Renato (renderHistoryMonthView): navegação por mês, totais do mês,
 * um cartão por envio (clique = editar), seleção em lote e apagar.
 */
export function UltimosEnvios({
  area,
  rotuloArea,
  docs,
  closures,
  stats,
  totals,
  caminhoApagar,
  onAtualizar,
  onEditar,
  onSalvo,
}: {
  area: string;
  rotuloArea: string;
  docs: EntryDoc[];
  closures: MonthClosure[];
  stats: (doc: EntryDoc) => EstatisticaEnvio[];
  totals: (docs: EntryDoc[]) => EstatisticaEnvio[];
  caminhoApagar: string;
  onAtualizar: () => void;
  onEditar: (doc: EntryDoc) => void;
  onSalvo: () => void;
}) {
  const [mes, setMes] = useState(() => todayStr().slice(0, 7));
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const doMes = useMemo(
    () => docs.filter((d) => d.date.slice(0, 7) === mes).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [docs, mes],
  );
  const rotuloMes = `${MONTH_LABEL_PT[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;
  const totais = totals(doMes);

  function alternar(date: string, marcado: boolean) {
    setSelecionadas((atual) => (marcado ? Array.from(new Set([...atual, date])) : atual.filter((d) => d !== date)));
  }
  function alternarTodos(marcado: boolean) {
    setSelecionadas(marcado ? doMes.map((d) => d.date) : []);
  }

  async function apagar(datas: string[]) {
    if (!datas.length) {
      setStatus("Marque pelo menos um envio.");
      return;
    }
    if (!window.confirm(`Apagar ${datas.length} envio(s) de ${rotuloArea}? Essa ação não tem volta.`)) return;
    setStatus("Apagando…");
    const r = await chamarBi<{ ok: boolean; apagados?: number; falhas?: unknown[]; error?: string }>(caminhoApagar, { dates: datas });
    const apagados = r.json?.apagados ?? 0;
    const falhou = r.json?.falhas?.length ?? (r.ok ? 0 : datas.length);
    setSelecionadas([]);
    setStatus(r.ok ? `${apagados} apagado(s)${falhou ? `, ${falhou} falhou(aram).` : "."}` : `Não consegui apagar (${r.json?.error || r.status}).`);
    if (r.ok) onSalvo();
  }

  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo={`Últimos envios • ${rotuloArea}`}>
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
        <button type="button" className="sjBtn sjBtnP sjBtnR" onClick={() => apagar(selecionadas)}>🗑 Apagar selecionados</button>
        <label className="sjMini" style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" className="sjCheck" title="Selecionar todos os dias do mês visível" checked={doMes.length > 0 && doMes.every((d) => selecionadas.includes(d.date))} onChange={(e) => alternarTodos(e.target.checked)} />
          todos
        </label>
        <span className="sjMini">{status}</span>
      </Cabecalho>
      <div className="sjMkMesNav">
        <button type="button" onClick={() => setMes((m) => monthKeyAdd(m, -1))} aria-label="Mês anterior">‹</button>
        <div><b>{rotuloMes}</b><span className="sjMini">{doMes.length} envio(s)</span></div>
        <button type="button" onClick={() => setMes((m) => monthKeyAdd(m, 1))} aria-label="Próximo mês">›</button>
      </div>
      <div className="sjMkHistKpis">
        {totais.map((t) => (
          <article key={t.label} className="sjMkHistKpi"><div className="v">{t.val}</div><span className="sjMini">{t.label}</span></article>
        ))}
      </div>
      {doMes.length ? doMes.map((doc) => {
        const travado = isMonthClosedFor(closures, area, doc.date);
        return (
          <div key={doc.date} className="sjHistDia" role="button" tabIndex={0} onClick={() => onEditar(doc)} onKeyDown={(e) => { if (e.key === "Enter") onEditar(doc); }}>
            <span className="sjMkDiaPonto" aria-hidden="true" />
            <span className="sjMkDiaMain"><b>{fmtDate(doc.date)}</b><span className="sjMini">{doc.submittedByName || "—"} • {fmtTime(doc.submittedAt)}</span></span>
            <span className="sjMkDiaStats">
              {stats(doc).map((s) => <span key={s.label} className="sjMkDiaStat"><span className="sjMini">{s.label}</span><b>{s.val}</b></span>)}
            </span>
            <span className="sjHistDiaAcoes" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
              <input type="checkbox" className="sjCheck" checked={selecionadas.includes(doc.date)} onChange={(e) => alternar(doc.date, e.target.checked)} aria-label={`Selecionar ${fmtDate(doc.date)}`} />
              {travado ? <span className="sjMini">🔒</span> : <button type="button" className="sjBtn sjBtnP sjBtnR" onClick={() => apagar([doc.date])}>Apagar</button>}
            </span>
          </div>
        );
      }) : <p className="sjMini">Sem envios nesse mês.</p>}
    </section>
  );
}
