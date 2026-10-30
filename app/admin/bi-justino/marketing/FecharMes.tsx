"use client";

import { useState } from "react";
import { chamarBi, payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { MonthClosuresResp } from "./espelhoTipos";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const LABEL_AREA: Record<string, string> = { marketing: "Marketing", financeiro: "Financeiro", rh: "RH", operacao: "Operação", cmv: "CMV" };

export function rotuloMesLongo(mk: string) {
  if (!/^\d{4}-\d{2}$/.test(mk)) return mk;
  return `${MESES[Number(mk.slice(5, 7)) - 1]}/${mk.slice(0, 4)}`;
}

function mesPassado() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function quando(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Quadro "Fechar mês • <área>" + lista de meses fechados (renderClosurePanel / closeMonthUI). */
export function FecharMes({ area, dados, onSalvo }: { area: string; dados: DadosPlanilha; onSalvo: () => void }) {
  const [mes, setMes] = useState(mesPassado);
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const fechados = (payloadDe<MonthClosuresResp>(dados, `getMonthClosures:${area}`)?.items ?? [])
    .filter((item) => item.area === area)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const label = LABEL_AREA[area] || area;

  async function fechar() {
    if (!/^\d{4}-\d{2}$/.test(mes)) {
      setStatus("Escolha o mês pra fechar.");
      return;
    }
    if (fechados.some((item) => item.monthKey === mes)) {
      setStatus(`${rotuloMesLongo(mes)} já está fechado.`);
      return;
    }
    if (!window.confirm(`Fechar ${rotuloMesLongo(mes)} em ${label}? Ninguém (menos o diretor) vai conseguir enviar, editar ou apagar envio desse mês até alguém reabrir.`)) return;
    setOcupado(true);
    const r = await chamarBi("/api/bi/justino/marketing/fechar-mes", { area, monthKey: mes });
    setOcupado(false);
    setStatus(r.ok ? `${rotuloMesLongo(mes)} fechado em ${label}.` : "Não consegui fechar o mês.");
    if (r.ok) onSalvo();
  }

  async function reabrir(monthKey: string) {
    if (!window.confirm(`Reabrir ${rotuloMesLongo(monthKey)} em ${label}? A equipe volta a poder enviar, editar e apagar envio desse mês.`)) return;
    setOcupado(true);
    const r = await chamarBi("/api/bi/justino/marketing/reabrir-mes", { area, monthKey });
    setOcupado(false);
    setStatus(r.ok ? `${rotuloMesLongo(monthKey)} reaberto em ${label}.` : "Não consegui reabrir o mês.");
    if (r.ok) onSalvo();
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>Fechar mês • {label}</h3></div>
      <div className="sjToolbar">
        <div className="sjTb"><label>Fechar mês<input className="sjInput" type="month" value={mes} onChange={(evento) => setMes(evento.target.value)} /></label></div>
        <button type="button" className="sjAnaliseBtn" style={{ background: "#8a4423" }} disabled={ocupado} onClick={() => { void fechar(); }}>📅 Fechar mês</button>
        {status ? <span className="sjMini" role="status">{status}</span> : null}
      </div>
      <div>
        {fechados.length ? fechados.map((item) => (
          <p key={item.id || item.monthKey} className="sjMini">
            🔒 <b>{rotuloMesLongo(item.monthKey)}</b> — fechado por {item.closedByEmail} em {quando(item.closedAt)}{" "}
            <button type="button" className="sjAnaliseBtn sjMkGrafBtn" style={{ background: "#8a4423" }} disabled={ocupado} onClick={() => { void reabrir(item.monthKey); }}>🔓 Reabrir</button>
          </p>
        )) : <span className="sjMini">Nenhum mês fechado ainda.</span>}
      </div>
    </section>
  );
}
