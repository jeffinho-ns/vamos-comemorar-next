"use client";

import { useEffect, useState } from "react";
import { mensagemErro, postArea } from "../operacao/apiArea";
import { Cartao } from "../operacao/Cartao";
import type { FechamentoMes } from "../operacao/FecharMes";
import { mesFechado } from "../operacao/FecharMes";
import { DIA_LONGO, diaSemana, monthKeyLabel } from "../operacao/formato";
import { RESERVA_ORIGEM_LABEL, RESERVATION_TIPO_LABEL, type ReservaEntry } from "./tipos";

interface Ativacao { id: string; titulo?: string; data?: string; tipo?: string }

type Form = { date: string; pax: string; tipo: string; hora: string; origem: string; ativacaoId: string; nomeCliente: string; telefone: string; email: string; submittedByName: string; observacao: string; convidados: string };
const VAZIO: Form = { date: "", pax: "1", tipo: "normal", hora: "", origem: "", ativacaoId: "", nomeCliente: "", telefone: "", email: "", submittedByName: "", observacao: "", convidados: "" };

function idPedido() {
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** "Nova reserva • Seu Justino" (submitSingleReservation / updateReservationEntry). */
export function NovaReserva({ editando, ativacoes, fechamentos, diretoria, aoSalvar, aoCancelar }: { editando: ReservaEntry | null; ativacoes: Ativacao[]; fechamentos: FechamentoMes[]; diretoria: boolean; aoSalvar: () => void; aoCancelar: () => void }) {
  const [form, setForm] = useState<Form>(VAZIO);
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reqId, setReqId] = useState(idPedido);
  useEffect(() => {
    setForm(editando ? { date: editando.date, pax: String(editando.pax), tipo: editando.tipo || "normal", hora: editando.hora || "", origem: editando.origem || "", ativacaoId: editando.ativacaoId || "", nomeCliente: editando.nomeCliente || "", telefone: editando.telefone || "", email: editando.email || "", submittedByName: editando.submittedByName || "", observacao: editando.observacao || "", convidados: editando.convidados || "" } : VAZIO);
    setStatus(editando ? "Editando reserva — altere os campos e clique em \"Salvar edição\"." : "");
  }, [editando]);
  const set = (campo: keyof Form, valor: string) => setForm((a) => ({ ...a, [campo]: valor }));
  const travado = !diretoria && Boolean(form.date) && mesFechado(fechamentos, form.date);

  async function enviar() {
    if (!form.date) { setStatus("Escolha uma data."); return; }
    if (travado) { setStatus("🔒 Mês fechado — peça pro diretor reabrir."); return; }
    setEnviando(true);
    setStatus(editando ? "Salvando…" : "Enviando…");
    const payload = { ...form, pax: Math.max(1, Number(form.pax) || 1), ativacaoId: form.origem === "instagram" ? form.ativacaoId : "" };
    const r = editando
      ? await postArea("/justino/reservas/editar", { ...payload, id: editando.id })
      : await postArea("/justino/reservas/enviar", { ...payload, clientRequestId: reqId });
    setEnviando(false);
    if (r.ok) {
      setStatus(editando ? "Atualizado." : "Enviado.");
      setReqId(idPedido());
      if (editando) aoCancelar(); else setForm((a) => ({ ...VAZIO, date: a.date, submittedByName: a.submittedByName }));
      aoSalvar();
    } else setStatus(mensagemErro(r.error, editando ? "Falha ao salvar." : "Falha ao enviar."));
  }

  return (
    <Cartao titulo="Nova reserva • Seu Justino" aberto={Boolean(editando)}>
      <div className="sjRole"><h3>Nova reserva • Seu Justino</h3><span className="sjBadgeP">ALIMENTA SUGESTÃO DE FREELANCER</span></div>
      <p className="sjNote">Lance cada reserva separadamente — o quadro geral da semana e a sugestão de freelancer (aba Gerente Operador) somam tudo sozinhos.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Data<input className="sjInput" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /><span className="sjMini">{form.date ? DIA_LONGO[diaSemana(form.date)] : ""}</span></label></div>
        <div className="sjTb"><label>Pax (pessoas)<input className="sjInput" type="number" min={1} step={1} value={form.pax} onChange={(e) => set("pax", e.target.value)} /></label></div>
        <div className="sjTb"><label>Tipo<select className="sjInput" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>{Object.entries(RESERVATION_TIPO_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label></div>
        <div className="sjTb"><label>Horário de chegada (opcional)<input className="sjInput" type="time" title="Ajuda o BI a escalar a equipe por hora" value={form.hora} onChange={(e) => set("hora", e.target.value)} /></label></div>
        <div className="sjTb"><label>Origem da reserva<select className="sjInput" value={form.origem} onChange={(e) => set("origem", e.target.value)}><option value="">Não informado</option>{Object.entries(RESERVA_ORIGEM_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label></div>
        {form.origem === "instagram" ? <div className="sjTb"><label>Ação do Instagram (opcional)<select className="sjInput" value={form.ativacaoId} onChange={(e) => set("ativacaoId", e.target.value)}><option value="">— não sei qual —</option>{ativacoes.map((a) => <option key={a.id} value={a.id}>{a.data ? `${a.data} • ` : ""}{a.titulo || a.tipo || a.id}</option>)}</select></label></div> : null}
        <div className="sjTb"><label>Nome do cliente<input className="sjInput" placeholder="Quem reservou" value={form.nomeCliente} onChange={(e) => set("nomeCliente", e.target.value)} /></label></div>
        <div className="sjTb"><label>Telefone<input className="sjInput" type="tel" placeholder="(11) 90000-0000" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></label></div>
        <div className="sjTb"><label>E-mail<input className="sjInput" type="email" placeholder="cliente@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} /></label></div>
        <div className="sjTb"><label>Enviado por<input className="sjInput" placeholder="Seu nome" value={form.submittedByName} onChange={(e) => set("submittedByName", e.target.value)} /></label></div>
      </div>
      <div className="opForm">
        <label><b>Observação</b><textarea className="sjInput" rows={5} placeholder="Mesa, restrição, pedido especial, etc." value={form.observacao} onChange={(e) => set("observacao", e.target.value)} /></label>
        <label><b>Lista de convidados (opcional)</b><textarea className="sjInput" rows={5} placeholder="Um nome por linha — o sistema ordena sozinho em ordem alfabética." value={form.convidados} onChange={(e) => set("convidados", e.target.value)} /><span className="help">Pra despedida, aniversário etc. com lista de nomes. Fica anexada à reserva e pode ser aberta/impressa em ordem alfabética na &quot;Lista de reservas&quot;.</span></label>
      </div>
      <div className="opLinhaAcoes">
        <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#8a4423" }} onClick={enviar} disabled={enviando}>{editando ? "Salvar edição" : "Enviar"}</button>
        {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={aoCancelar}>Cancelar edição</button> : null}
        <span className="sjMini">{status}</span>
        {travado ? <span className="sjMini opWarn">🔒 {monthKeyLabel(form.date.slice(0, 7))} fechado — peça pro diretor reabrir.</span> : null}
      </div>
    </Cartao>
  );
}
