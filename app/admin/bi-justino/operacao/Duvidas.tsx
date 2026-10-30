"use client";

import { useState } from "react";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { mensagemErro, postArea } from "./apiArea";
import { Badge } from "./Cartao";
import { fmtHora } from "./formato";

export interface Duvida {
  id: string;
  createdAt: string;
  askedByEmail: string;
  area: string;
  question: string;
  status: string;
  answer: string;
  answeredByEmail: string;
  answeredAt: string;
}

const ROTULO: Record<string, string> = { rh: "RH", diretoria: "Diretoria", gestores: "Gestores / Liderança" };

/** Quadro "Dúvidas do manual • <área>" (renderDuvidasBoxHtml) com resposta inline (responderDuvida). */
export function DuvidasBox({ area, dados, aoSalvar, recarregar }: { area: string; dados: DadosPlanilha; aoSalvar: () => void; recarregar: () => void }) {
  const todas = payloadDe<{ items?: Duvida[] }>(dados, "getDuvidas")?.items ?? [];
  const itens = todas.filter((d) => d.area === area);
  const pendentes = itens.filter((d) => d.status !== "respondida");
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  async function responder(id: string) {
    const texto = (respostas[id] ?? "").trim();
    if (!texto) { setStatus("Escreva a resposta antes de enviar."); return; }
    setStatus("Enviando…");
    const r = await postArea("/justino/operacao/duvidas/responder", { id, answer: texto });
    if (r.ok) { setStatus("Resposta enviada."); setRespostas((a) => ({ ...a, [id]: "" })); aoSalvar(); recarregar(); } else setStatus(mensagemErro(r.error, "Não consegui enviar a resposta."));
  }

  return (
    <section className="sjCard sjBloco opFull">
      <div className="sjRole">
        <h3>Dúvidas do manual • {ROTULO[area] ?? area}{pendentes.length ? <> <Badge nivel="y">{pendentes.length} em aberto</Badge></> : null}</h3>
        <button type="button" className="sjAnaliseBtn" onClick={recarregar}>🔄 Atualizar</button>
      </div>
      {!itens.length ? <p className="sjMini">Nenhuma dúvida enviada ainda.</p> : itens.slice(0, 12).map((d) => (
        <div key={d.id} className="opDuvida">
          <div className="opDuvidaMeta">{fmtHora(d.createdAt)} • {d.askedByEmail} • {d.status === "respondida" ? <Badge nivel="g">respondida</Badge> : <Badge nivel="y">pendente</Badge>}</div>
          <div>{d.question}</div>
          {d.status === "respondida" ? (
            <p className="sjMini" style={{ marginTop: 4 }}><b>Resposta:</b> {d.answer}</p>
          ) : (
            <div className="opResposta">
              <textarea className="sjInput" rows={2} placeholder="Responder…" value={respostas[d.id] ?? ""} onChange={(e) => setRespostas((a) => ({ ...a, [d.id]: e.target.value }))} />
              <button type="button" className="sjAnaliseBtn" onClick={() => responder(d.id)}>Responder</button>
            </div>
          )}
        </div>
      ))}
      {status ? <p className="sjMini" style={{ marginTop: 6 }}>{status}</p> : null}
    </section>
  );
}

/** Card "Ficou com dúvida?" da aba Manual (enviarDuvida). */
export function EnviarDuvida({ aoSalvar }: { aoSalvar: () => void }) {
  const [area, setArea] = useState("rh");
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState("");

  async function enviar() {
    if (!texto.trim()) { setStatus("Escreva a dúvida antes de enviar."); return; }
    setStatus("Enviando…");
    const r = await postArea("/justino/operacao/duvidas/enviar", { area, question: texto.trim() });
    if (r.ok) { setTexto(""); setStatus("Dúvida enviada!"); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui enviar. Tente de novo."));
  }

  return (
    <section className="sjCard sjBloco opFull">
      <h3>Ficou com dúvida?</h3>
      <p className="sjNote">Escreva sua pergunta e escolha quem deve responder. A dúvida fica visível na aba de quem for responsável, e você recebe a resposta por e-mail.</p>
      <p className="sjMini" style={{ margin: "8px 0 4px" }}>Para quem é a dúvida</p>
      <select className="sjInput" style={{ maxWidth: 320 }} value={area} onChange={(e) => setArea(e.target.value)}>
        <option value="rh">RH</option>
        <option value="gestores">Gestores / Liderança</option>
        <option value="diretoria">Diretoria</option>
      </select>
      <textarea className="sjInput" rows={3} style={{ marginTop: 8 }} placeholder="Escreva sua dúvida aqui…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="opLinhaAcoes">
        <button type="button" className="sjAnaliseBtn" onClick={enviar}>Enviar dúvida</button>
        <span className="sjMini">{status}</span>
      </div>
    </section>
  );
}
