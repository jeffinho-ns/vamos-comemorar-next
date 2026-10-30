"use client";

import { useCallback, useEffect, useState } from "react";
import { getArea, mensagemErro, postArea } from "../operacao/apiArea";
import { BotaoAcao } from "../operacao/Cartao";
import { fmtData, fmtHora, hojeSp } from "../operacao/formato";
import { INTERACAO_TIPO_LABEL, type Interacao, type Tarefa } from "./tipos";

export interface Marco { label: string; email?: string; at: string; nota?: string }

export function marcosParaEvento(ev: { createdAt?: string; createdByEmail?: string; updatedAt?: string; updatedByEmail?: string }): Marco[] {
  const m: Marco[] = [];
  if (ev.createdAt) m.push({ label: "Evento criado", email: ev.createdByEmail, at: ev.createdAt });
  if (ev.updatedAt && ev.updatedAt !== ev.createdAt) m.push({ label: "Última atualização", email: ev.updatedByEmail, at: ev.updatedAt });
  return m;
}

export function marcosParaCotacao(c: { createdAt?: string; createdByEmail?: string; decidedAt?: string; decidedByEmail?: string; status?: string; decisionNote?: string; sentAt?: string; sentByEmail?: string }): Marco[] {
  const m: Marco[] = [];
  if (c.createdAt) m.push({ label: "Cotação criada", email: c.createdByEmail, at: c.createdAt });
  if (c.decidedAt) m.push({ label: c.status === "recusado" ? "Cotação recusada" : "Cotação aprovada", email: c.decidedByEmail, at: c.decidedAt, nota: c.decisionNote });
  if (c.sentAt) m.push({ label: "Contrato enviado", email: c.sentByEmail, at: c.sentAt });
  return m;
}

/** Lista de tarefas de um evento (renderListaTarefas) com concluir/reabrir. */
export function ListaTarefas({ tarefas, aoMudar }: { tarefas: Tarefa[]; aoMudar: () => void }) {
  const hoje = hojeSp();
  const [erro, setErro] = useState("");
  async function alternar(t: Tarefa) {
    const concluir = t.status !== "concluida";
    const r = await postArea("/justino/eventos/tarefas/concluir", { id: t.id, concluida: concluir });
    if (r.ok) aoMudar(); else setErro(mensagemErro(r.error, "Não consegui atualizar a tarefa."));
  }
  if (!tarefas.length) return <span className="sjMini">Nenhuma tarefa ainda.</span>;
  return (
    <div className="opLinhaTempo">
      {tarefas.map((t) => {
        const atrasada = t.status === "pendente" && t.dataVencimento < hoje;
        const cor = t.status === "concluida" ? "var(--muted)" : atrasada ? "var(--red)" : t.dataVencimento === hoje ? "var(--yellow)" : "inherit";
        return (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <div><span style={t.status === "concluida" ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{t.titulo}</span> <span className="sjMini" style={{ color: cor, display: "inline" }}>{fmtData(t.dataVencimento)}</span>{t.responsavelEmail ? <span className="sjMini" style={{ display: "inline" }}> ({t.responsavelEmail})</span> : null}</div>
            <BotaoAcao onClick={() => alternar(t)}>{t.status === "concluida" ? "↺ Reabrir" : "✓ Concluir"}</BotaoAcao>
          </div>
        );
      })}
      {erro ? <p className="sjMini opWarn">{erro}</p> : null}
    </div>
  );
}

/** "🕒 Linha do tempo & Tarefas" de um evento/cotação — interações sob demanda + tarefas do espelho. */
export function LinhaTempoTarefas({ eventoId, marcos, tarefas, diretoria, aoMudarTarefas }: { eventoId: string | null; marcos: Marco[]; tarefas: Tarefa[]; diretoria: boolean; aoMudarTarefas: () => void }) {
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [tipo, setTipo] = useState("nota");
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [dataTarefa, setDataTarefa] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [status, setStatus] = useState("");

  const carregar = useCallback(async (forcar: boolean) => {
    if (!eventoId) { setInteracoes([]); return; }
    const r = await getArea<{ ok: boolean; items?: Interacao[] }>(`/justino/eventos/interacoes/${encodeURIComponent(eventoId)}${forcar ? "?forcar=1" : ""}`);
    setInteracoes(r.json?.items ?? []);
  }, [eventoId]);
  useEffect(() => { carregar(false); }, [carregar]);

  if (!eventoId) return <p className="sjMini">Salve primeiro para registrar interações e tarefas.</p>;

  const todos = [
    ...marcos,
    ...interacoes.map((i) => ({ label: INTERACAO_TIPO_LABEL[i.tipo] ?? i.tipo, email: i.createdByEmail, at: i.createdAt, nota: i.texto, interacaoId: i.id })),
  ].filter((m) => m.at).sort((a, b) => (a.at < b.at ? 1 : -1));

  async function registrar() {
    if (!texto.trim()) return;
    const r = await postArea("/justino/eventos/interacoes/salvar", { eventoId, tipo, texto: texto.trim() });
    if (r.ok) { setTexto(""); setStatus("Registrado."); await carregar(true); } else setStatus(mensagemErro(r.error, "Não consegui registrar."));
  }
  async function apagarInteracao(id: string) {
    if (!window.confirm("Apagar essa interação do histórico?")) return;
    const r = await postArea("/justino/eventos/interacoes/apagar", { id });
    if (r.ok) await carregar(true); else setStatus(mensagemErro(r.error, "Não consegui apagar."));
  }
  async function novaTarefa() {
    if (!titulo.trim() || !dataTarefa) { setStatus("Preencha título e data da tarefa."); return; }
    const r = await postArea("/justino/eventos/tarefas/salvar", { eventoId, titulo: titulo.trim(), dataVencimento: dataTarefa, responsavelEmail: responsavel.trim() });
    if (r.ok) { setTitulo(""); setDataTarefa(""); setResponsavel(""); setStatus("Tarefa criada."); aoMudarTarefas(); } else setStatus(mensagemErro(r.error, "Não consegui criar a tarefa."));
  }

  return (
    <div className="opGrupo">
      <p className="sjMini">Linha do tempo</p>
      <div className="opLinhaTempo">
        {todos.length ? todos.map((m, i) => (
          <div key={`${m.at}-${i}`}>
            <b>{m.label}</b> <span className="sjMini" style={{ display: "inline" }}>{fmtHora(m.at)} — {m.email || ""}</span>
            {m.nota ? <div>{m.nota}</div> : null}
            {"interacaoId" in m && m.interacaoId && diretoria ? <> <BotaoAcao perigo onClick={() => apagarInteracao(m.interacaoId as string)}>apagar</BotaoAcao></> : null}
          </div>
        )) : <span className="sjMini">Nada registrado ainda.</span>}
      </div>
      <div className="opLinhaAcoes">
        <select className="sjInput" style={{ maxWidth: 140 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {Object.entries(INTERACAO_TIPO_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <textarea className="sjInput" rows={2} placeholder="O que aconteceu?" style={{ flex: 1, minWidth: 180 }} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <BotaoAcao onClick={registrar}>+ Registrar</BotaoAcao>
      </div>
      <p className="sjMini" style={{ margin: "12px 0 6px" }}>Tarefas</p>
      <ListaTarefas tarefas={tarefas.filter((t) => t.eventoId === eventoId)} aoMudar={aoMudarTarefas} />
      <div className="opLinhaAcoes">
        <input className="sjInput" placeholder="Título da tarefa" style={{ flex: 1, minWidth: 150 }} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <input className="sjInput" type="date" style={{ maxWidth: 150 }} value={dataTarefa} onChange={(e) => setDataTarefa(e.target.value)} />
        <input className="sjInput" type="email" placeholder="Responsável (e-mail)" style={{ maxWidth: 180 }} value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        <BotaoAcao onClick={novaTarefa}>+ Nova tarefa</BotaoAcao>
      </div>
      {status ? <p className="sjMini" style={{ marginTop: 4 }}>{status}</p> : null}
    </div>
  );
}
