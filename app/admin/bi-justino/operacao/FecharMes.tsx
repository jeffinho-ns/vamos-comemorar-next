"use client";

import { useState } from "react";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { mensagemErro, postArea } from "./apiArea";
import { fmtHora, hojeSp, mesAnterior, monthKeyLabel } from "./formato";

export interface FechamentoMes {
  id: string;
  area: string;
  monthKey: string;
  closedByEmail: string;
  closedAt: string;
}

const ROTULO: Record<string, string> = { operacao: "Operação", reservas: "Reservas", eventos: "Eventos", auditoriaop: "Auditoria Operacional" };

export function chaveFechamento(area: string) {
  return `getMonthClosures:${area}`;
}

export function fechamentosDe(dados: DadosPlanilha, area: string): FechamentoMes[] {
  const payload = payloadDe<{ items?: FechamentoMes[] }>(dados, chaveFechamento(area));
  return (payload?.items ?? []).filter((c) => c.area === area).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

export function mesFechado(fechamentos: FechamentoMes[], dataIso: string) {
  const mk = String(dataIso || "").slice(0, 7);
  return Boolean(mk) && fechamentos.some((c) => c.monthKey === mk);
}

/** Card "Fechar mês • <Área>" do painel do Renato (closeMonthUI/renderClosurePanel). */
export function FecharMes({ area, dados, diretoria, aoSalvar }: { area: string; dados: DadosPlanilha; diretoria: boolean; aoSalvar: () => void }) {
  const [mes, setMes] = useState(mesAnterior(hojeSp()));
  const [status, setStatus] = useState("");
  const fechados = fechamentosDe(dados, area);
  const rotulo = ROTULO[area] ?? area;

  async function fechar() {
    if (!mes) { setStatus("Escolha o mês pra fechar."); return; }
    if (fechados.some((c) => c.monthKey === mes)) { setStatus(`${monthKeyLabel(mes)} já está fechado.`); return; }
    if (!window.confirm(`Fechar ${monthKeyLabel(mes)} em ${rotulo}? Ninguém (menos o diretor) vai conseguir enviar, editar ou apagar envio desse mês até alguém reabrir.`)) return;
    setStatus("Fechando…");
    const r = await postArea("/justino/operacao/fechar-mes", { area, monthKey: mes });
    if (r.ok) { setStatus(`${monthKeyLabel(mes)} fechado em ${rotulo}.`); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui fechar o mês."));
  }

  async function reabrir(monthKey: string) {
    if (!window.confirm(`Reabrir ${monthKeyLabel(monthKey)} em ${rotulo}? A equipe volta a poder enviar e editar nesse mês.`)) return;
    setStatus("Reabrindo…");
    const r = await postArea("/justino/operacao/reabrir-mes", { area, monthKey });
    if (r.ok) { setStatus(`${monthKeyLabel(monthKey)} reaberto em ${rotulo}.`); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui reabrir o mês."));
  }

  return (
    <section className="sjCard sjBloco opFull">
      <div className="sjRole"><h3>Fechar mês • {rotulo}</h3></div>
      <div className="sjToolbar">
        <div className="sjTb"><label>Fechar mês<input className="sjInput" type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label></div>
        <button type="button" className="sjAnaliseBtn" style={{ background: "#8a4423" }} onClick={fechar} disabled={!diretoria} title={diretoria ? undefined : "Só a Diretoria fecha o mês por aqui."}>📅 Fechar mês</button>
        <span className="sjMini">{status}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {fechados.length ? fechados.map((c) => (
          <div key={c.id} className="sjMini" style={{ padding: "2px 0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span>🔒 <b>{monthKeyLabel(c.monthKey)}</b> — fechado por {c.closedByEmail} em {fmtHora(c.closedAt)}</span>
            {diretoria ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, padding: "2px 8px", fontSize: 12, background: "#8a4423" }} onClick={() => reabrir(c.monthKey)}>🔓 Reabrir</button> : null}
          </div>
        )) : <span className="sjMini">Nenhum mês fechado ainda.</span>}
      </div>
    </section>
  );
}
