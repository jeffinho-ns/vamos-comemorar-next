"use client";

import { useEffect, useState } from "react";
import { mensagemErro, postArea } from "../operacao/apiArea";
import { parseBrl, monthKeyLabel } from "../operacao/formato";
import type { FechamentoMes } from "../operacao/FecharMes";
import { mesFechado } from "../operacao/FecharMes";
import { LinhaTempoTarefas, marcosParaEvento } from "./LinhaTempoTarefas";
import { EVENTO_FOLLOWUP_GROUPS, EVENTO_STATUS_LABEL, EVENTO_TIPO_LABEL, type Evento, type Tarefa } from "./tipos";

type Form = Record<string, string>;

const VAZIO: Form = { data: "", nomeCliente: "", documento: "", telefone: "", email: "", tipoEvento: "aniversario", pax: "", valorContrato: "", valorSinal: "", dataSinal: "", pagamentoPendente: "0", status: "orcamento", observacao: "" };

function deEvento(ev: Evento): Form {
  const f: Form = {
    data: ev.data || "", nomeCliente: ev.nomeCliente || "", documento: ev.documento || "", telefone: ev.telefone || "", email: ev.email || "",
    tipoEvento: ev.tipoEvento || "outro", pax: ev.pax ? String(ev.pax) : "", valorContrato: ev.valorContrato ? String(ev.valorContrato) : "", valorSinal: ev.valorSinal ? String(ev.valorSinal) : "",
    dataSinal: ev.dataSinal || "", pagamentoPendente: ev.pagamentoPendente ? "1" : "0", status: ev.status || "orcamento", observacao: ev.observacao || "",
  };
  EVENTO_FOLLOWUP_GROUPS.forEach((g) => g.campos.forEach(([campo]) => { const v = ev[campo]; f[campo] = v ? String(v) : ""; }));
  return f;
}

/** Formulário "+ Novo evento / Editar evento" (saveEventoUI) com acompanhamento comercial e linha do tempo. */
export function EventoForm({ editando, tarefas, fechamentos, diretoria, aoSalvar, aoCancelar, aoMudarTarefas }: {
  editando: Evento | null;
  tarefas: Tarefa[];
  fechamentos: FechamentoMes[];
  diretoria: boolean;
  aoSalvar: () => void;
  aoCancelar: () => void;
  aoMudarTarefas: () => void;
}) {
  const [form, setForm] = useState<Form>(VAZIO);
  const [status, setStatus] = useState("");
  const [aberto, setAberto] = useState(false);
  useEffect(() => { setForm(editando ? deEvento(editando) : VAZIO); setStatus(""); if (editando) setAberto(true); }, [editando]);
  const set = (campo: string, valor: string) => setForm((a) => ({ ...a, [campo]: valor }));
  const travado = !diretoria && Boolean(form.data) && mesFechado(fechamentos, form.data);

  async function salvar() {
    if (!form.data || !form.nomeCliente.trim()) { setStatus("Preencha data e cliente."); return; }
    const payload: Record<string, string | number | boolean | undefined> = {
      id: editando?.id, data: form.data, nomeCliente: form.nomeCliente.trim(), documento: form.documento.trim(), telefone: form.telefone.trim(), email: form.email.trim(),
      tipoEvento: form.tipoEvento, pax: Number(form.pax) || 0, valorContrato: parseBrl(form.valorContrato), valorSinal: parseBrl(form.valorSinal), dataSinal: form.dataSinal,
      status: form.status, pagamentoPendente: form.pagamentoPendente === "1", observacao: form.observacao.trim(),
    };
    EVENTO_FOLLOWUP_GROUPS.forEach((g) => g.campos.forEach(([campo, , tipo]) => { payload[campo] = tipo === "number" ? parseBrl(form[campo] ?? "") : (form[campo] ?? "").trim(); }));
    setStatus("Salvando…");
    const r = await postArea("/justino/eventos/salvar", payload);
    if (r.ok) { setStatus("Evento salvo."); setForm(VAZIO); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui salvar o evento."));
  }

  return (
    <details className="sjCollapse" open={aberto} onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary><span className="sjChev">▸</span>{editando ? "Editar evento" : "+ Novo evento"}<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="opForm">
          <label><b>Data do evento</b><input className="sjInput" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} /></label>
          <label><b>Cliente (nome)</b><input className="sjInput" placeholder="Pessoa física ou razão social" value={form.nomeCliente} onChange={(e) => set("nomeCliente", e.target.value)} /></label>
          <label><b>CPF/CNPJ</b><input className="sjInput" placeholder="Opcional" value={form.documento} onChange={(e) => set("documento", e.target.value)} /></label>
          <label><b>Telefone</b><input className="sjInput" type="tel" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></label>
          <label><b>E-mail</b><input className="sjInput" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label><b>Tipo de evento</b><select className="sjInput" value={form.tipoEvento} onChange={(e) => set("tipoEvento", e.target.value)}>{Object.entries(EVENTO_TIPO_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label><b>Pax esperado</b><input className="sjInput" type="number" min={0} step={1} value={form.pax} onChange={(e) => set("pax", e.target.value)} /></label>
          <label><b>Valor do contrato</b><input className="sjInput" inputMode="decimal" placeholder="0,00" value={form.valorContrato} onChange={(e) => set("valorContrato", e.target.value)} /></label>
          <label><b>Valor do sinal</b><input className="sjInput" inputMode="decimal" placeholder="0,00" value={form.valorSinal} onChange={(e) => set("valorSinal", e.target.value)} /></label>
          <label><b>Data do sinal</b><input className="sjInput" type="date" value={form.dataSinal} onChange={(e) => set("dataSinal", e.target.value)} /></label>
          <label><b>Pagamento pendente</b><select className="sjInput" value={form.pagamentoPendente} onChange={(e) => set("pagamentoPendente", e.target.value)}><option value="0">Não</option><option value="1">Sim</option></select><span className="help">Só organizacional — mostra uma tag na lista. Não muda o cálculo de faturamento (esse continua pelo campo &quot;Pagamento&quot; do Acompanhamento comercial).</span></label>
          <label><b>Status</b><select className="sjInput" value={form.status} onChange={(e) => set("status", e.target.value)}>{Object.entries(EVENTO_STATUS_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className="opLargo"><b>Observação</b><textarea className="sjInput" rows={3} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} /></label>
        </div>
        <details className="sjCollapse" style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13 }}><span className="sjChev">▸</span> Acompanhamento comercial (follow-up)<span className="sjHint">clique para abrir</span></summary>
          <div className="sjCollapseBody">
            {EVENTO_FOLLOWUP_GROUPS.map((g) => (
              <div key={g.titulo} className="opGrupo">
                <p className="sjMini">{g.titulo}</p>
                <div className="opForm">
                  {g.campos.map(([campo, label, tipo]) => (
                    <label key={campo}><b>{label}</b><input className="sjInput" inputMode={tipo === "number" ? "decimal" : undefined} value={form[campo] ?? ""} onChange={(e) => set(campo, e.target.value)} /></label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
        <details className="sjCollapse" style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13 }}><span className="sjChev">▸</span> 🕒 Linha do tempo &amp; Tarefas<span className="sjHint">clique para abrir</span></summary>
          <div className="sjCollapseBody">
            <LinhaTempoTarefas eventoId={editando?.id ?? null} marcos={editando ? marcosParaEvento(editando) : []} tarefas={tarefas} diretoria={diretoria} aoMudarTarefas={aoMudarTarefas} />
          </div>
        </details>
        <div className="opLinhaAcoes">
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => setAberto(false)}>← Voltar</button>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={salvar} disabled={travado}>Salvar evento</button>
          {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => { setForm(VAZIO); aoCancelar(); }}>Cancelar edição</button> : null}
          <span className="sjMini">{status}</span>
          {travado ? <span className="sjMini opWarn">🔒 {monthKeyLabel(form.data.slice(0, 7))} fechado — peça pro diretor reabrir.</span> : null}
        </div>
      </div>
    </details>
  );
}
