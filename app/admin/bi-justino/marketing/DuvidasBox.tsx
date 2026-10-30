"use client";

import { useState } from "react";
import { chamarBi, payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { Duvida, DuvidasResp } from "./espelhoTipos";

const LABEL: Record<string, string> = { rh: "RH", diretoria: "Diretoria", gestores: "Gestores / Liderança" };

function quando(iso: string) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Linha({ duvida, onSalvo }: { duvida: Duvida; onSalvo: () => void }) {
  const [resposta, setResposta] = useState("");
  const [status, setStatus] = useState("");
  async function responder() {
    const texto = resposta.trim();
    if (!texto) {
      setStatus("Escreva a resposta antes de enviar.");
      return;
    }
    setStatus("Enviando…");
    const r = await chamarBi("/api/bi/justino/marketing/duvidas/responder", { id: duvida.id, answer: texto });
    if (!r.ok) {
      setStatus("Não consegui enviar a resposta.");
      return;
    }
    setStatus("Resposta enviada.");
    onSalvo();
  }
  return (
    <div className="sjFormBloco">
      <p className="sjMini">{quando(duvida.createdAt)} • {duvida.askedByEmail} • {duvida.status === "respondida" ? <span className="sjBadgeG">respondida</span> : <span className="sjBadgeY">pendente</span>}</p>
      <div>{duvida.question}</div>
      {duvida.status === "respondida" ? (
        <p className="sjMini"><b>Resposta:</b> {duvida.answer}</p>
      ) : (
        <div className="sjToolbar">
          <textarea className="sjInput" rows={2} placeholder="Responder…" value={resposta} onChange={(evento) => setResposta(evento.target.value)} />
          <button type="button" className="sjAnaliseBtn" onClick={() => { void responder(); }}>Responder</button>
          {status ? <span className="sjMini" role="status">{status}</span> : null}
        </div>
      )}
    </div>
  );
}

/** Quadro "Dúvidas do manual • <área>" do painel do Renato (renderDuvidasBoxHtml). */
export function DuvidasBox({ area, dados, onSalvo }: { area: "gestores" | "diretoria" | "rh"; dados: DadosPlanilha; onSalvo: () => void }) {
  const itens = (payloadDe<DuvidasResp>(dados, "getDuvidas")?.items ?? []).filter((item) => item.area === area);
  const pendentes = itens.filter((item) => item.status !== "respondida").length;
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Dúvidas do manual • {LABEL[area]} {pendentes ? <span className="sjBadgeY">{pendentes} em aberto</span> : null}</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      {itens.length ? itens.slice(0, 12).map((item) => <Linha key={item.id} duvida={item} onSalvo={onSalvo} />) : <p className="sjMini">Nenhuma dúvida enviada ainda.</p>}
    </section>
  );
}
