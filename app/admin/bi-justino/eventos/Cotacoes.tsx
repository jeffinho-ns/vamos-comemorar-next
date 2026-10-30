"use client";

import { useEffect, useState } from "react";
import { mensagemErro, postArea } from "../operacao/apiArea";
import { Badge, BotaoAcao } from "../operacao/Cartao";
import { brl, fmtData, parseBrl } from "../operacao/formato";
import { Kanban } from "./Kanban";
import { LinhaTempoTarefas, marcosParaCotacao } from "./LinhaTempoTarefas";
import { COTACAO_EDITAVEL, COTACAO_FIELD_GROUPS, COTACAO_STATUS_BADGE, COTACAO_STATUS_LABEL, type Cotacao, type Tarefa } from "./tipos";

type Form = Record<string, string>;
const CAMPOS = COTACAO_FIELD_GROUPS.flatMap((g) => g.campos);
const VAZIO: Form = Object.fromEntries(CAMPOS.map(([c]) => [c, ""]));
const COLUNAS = [{ key: "rascunho", label: "Rascunho" }, { key: "aguardando_aprovacao", label: "Aguardando aprovação" }, { key: "aprovado", label: "Aprovado" }, { key: "enviado", label: "Enviado" }, { key: "recusado", label: "Recusado" }];

function coletar(form: Form) {
  const payload: Record<string, string | number> = {};
  CAMPOS.forEach(([campo, , tipo]) => { payload[campo] = tipo === "number" ? parseBrl(form[campo] ?? "") : (form[campo] ?? "").trim(); });
  return payload;
}

/** "+ Nova cotação / Editar cotação" (saveCotacaoUI, submitCotacaoUI). */
export function CotacaoForm({ editando, tarefas, diretoria, aoSalvar, aoCancelar, aoMudarTarefas }: { editando: Cotacao | null; tarefas: Tarefa[]; diretoria: boolean; aoSalvar: () => void; aoCancelar: () => void; aoMudarTarefas: () => void }) {
  const [form, setForm] = useState<Form>(VAZIO);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (editando) {
      setForm(Object.fromEntries(CAMPOS.map(([c]) => [c, editando[c] ? String(editando[c]) : ""])));
      setIdAtual(editando.id); setEventoId(editando.eventoId || null); setAberto(true);
    } else { setForm(VAZIO); setIdAtual(null); setEventoId(null); }
    setStatus("");
  }, [editando]);
  const set = (campo: string, valor: string) => setForm((a) => ({ ...a, [campo]: valor }));
  const somenteVer = Boolean(editando) && !COTACAO_EDITAVEL.includes(editando?.status ?? "");

  async function salvar(): Promise<string | null> {
    const payload = coletar(form);
    if (!payload.nomeEmpresaCliente || !payload.dataEvento) { setStatus("Preencha pelo menos cliente e data do evento."); return null; }
    setStatus("Salvando…");
    const r = await postArea("/justino/eventos/cotacoes/salvar", { ...payload, id: idAtual ?? undefined });
    if (!r.ok) { setStatus(mensagemErro(r.error, "Não consegui salvar a cotação.")); return null; }
    setStatus("Cotação salva."); setIdAtual(r.id ?? idAtual); if (r.eventoId) setEventoId(r.eventoId); aoSalvar();
    return r.id ?? idAtual;
  }
  async function submeter() {
    const id = idAtual ?? (await salvar());
    if (!id) return;
    if (!window.confirm("Submeter essa cotação pra aprovação da Diretoria? Depois disso ela fica travada até ser decidida.")) return;
    setStatus("Enviando pra aprovação…");
    const r = await postArea("/justino/eventos/cotacoes/submeter", { id });
    if (r.ok) { setStatus("Cotação enviada pra aprovação."); setForm(VAZIO); setIdAtual(null); aoCancelar(); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui submeter a cotação."));
  }

  return (
    <details className="sjCollapse" open={aberto} onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary><span className="sjChev">▸</span>{editando ? `${somenteVer ? "Ver cotação" : "Editar cotação"} — ${editando.nomeEmpresaCliente}` : "+ Nova cotação"}<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        {COTACAO_FIELD_GROUPS.map((g) => (
          <div key={g.titulo} className="opGrupo">
            <p className="sjMini">{g.titulo}</p>
            <div className="opForm">
              {g.campos.map(([campo, label, tipo]) => (
                <label key={campo}><b>{label}</b><input className="sjInput" type={tipo === "number" ? "text" : tipo} inputMode={tipo === "number" ? "decimal" : undefined} value={form[campo] ?? ""} readOnly={somenteVer} onChange={(e) => set(campo, e.target.value)} /></label>
              ))}
            </div>
          </div>
        ))}
        <details className="sjCollapse" style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13 }}><span className="sjChev">▸</span> 🕒 Linha do tempo &amp; Tarefas<span className="sjHint">clique para abrir</span></summary>
          <div className="sjCollapseBody"><LinhaTempoTarefas eventoId={eventoId} marcos={editando ? marcosParaCotacao(editando) : []} tarefas={tarefas} diretoria={diretoria} aoMudarTarefas={aoMudarTarefas} /></div>
        </details>
        <div className="opLinhaAcoes">
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={salvar} disabled={somenteVer}>💾 Salvar rascunho</button>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#8a4423" }} onClick={submeter} disabled={somenteVer}>📤 Submeter pra aprovação</button>
          {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => { setForm(VAZIO); setIdAtual(null); aoCancelar(); }}>Cancelar edição</button> : null}
          <span className="sjMini">{status}</span>
        </div>
      </div>
    </details>
  );
}

/** "Cotações cadastradas" + painel "Revisar e enviar contrato" (decideCotacaoUI, confirmarEnvioContratoUI). */
export function CotacoesLista({ cotacoes, diretoria, aoEditar, aoMudar, recarregar }: { cotacoes: Cotacao[]; diretoria: boolean; aoEditar: (c: Cotacao) => void; aoMudar: () => void; recarregar: () => void }) {
  const [modo, setModo] = useState<"tabela" | "kanban">("tabela");
  const [envio, setEnvio] = useState<{ id: string; para: string; assunto: string; corpo: string } | null>(null);
  const [status, setStatus] = useState("");
  const aguardandoContrato = cotacoes.filter((c) => c.status === "aprovado").length;

  async function decidir(id: string, approve: boolean) {
    if (!window.confirm(approve ? "Aprovar essa cotação? O contrato já sai gerado automaticamente com os dados dela." : "Recusar essa cotação? Ela volta pra rascunho, pode ser corrigida e submetida de novo.")) return;
    const note = approve ? "" : window.prompt("Motivo da recusa (opcional, fica registrado):") || "";
    const r = await postArea("/justino/eventos/cotacoes/decidir", { id, approve, note });
    if (r.ok) { setStatus(approve ? "Cotação aprovada, contrato gerado." : "Cotação recusada."); aoMudar(); } else setStatus(mensagemErro(r.error, "Não consegui decidir essa cotação."));
  }
  async function submeter(id: string) {
    const r = await postArea("/justino/eventos/cotacoes/submeter", { id });
    if (r.ok) aoMudar(); else setStatus(mensagemErro(r.error, "Não consegui enviar pra aprovação."));
  }
  function abrirEnvio(c: Cotacao) {
    setEnvio({ id: c.id, para: c.emailCliente || "(sem e-mail cadastrado nessa cotação — edite antes de enviar)", assunto: `Contrato — ${c.nomeEvento}`, corpo: `Olá, ${c.nomeResponsavel || ""}! Segue em anexo o contrato para o evento "${c.nomeEvento}". Qualquer dúvida, estamos à disposição.` });
  }
  async function confirmarEnvio() {
    if (!envio) return;
    if (!window.confirm("Confirmar o envio do contrato pro cliente? Essa ação não tem como desfazer.")) return;
    const r = await postArea("/justino/eventos/cotacoes/enviar-contrato", { id: envio.id, assunto: envio.assunto, corpo: envio.corpo });
    if (r.ok) { setStatus("Contrato enviado."); setEnvio(null); aoMudar(); } else setStatus(mensagemErro(r.error, "Não consegui enviar o contrato."));
  }
  async function mover(item: Cotacao, de: string, para: string) {
    if (de === "rascunho" && para === "aguardando_aprovacao") { if (window.confirm(`Submeter "${item.nomeEmpresaCliente}" pra aprovação?`)) await submeter(item.id); return; }
    if (de === "aguardando_aprovacao" && (para === "aprovado" || para === "recusado")) { if (!diretoria) { setStatus("Só a Diretoria aprova/recusa."); return; } await decidir(item.id, para === "aprovado"); return; }
    if (de === "aprovado" && para === "enviado") { if (!diretoria) { setStatus("Só a Diretoria envia."); return; } abrirEnvio(item); return; }
    setStatus("Não dá pra mover direto dessa etapa pra essa.");
  }

  return (
    <details className="sjCollapse" open>
      <summary><span className="sjChev">▸</span>Cotações cadastradas<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Cotações cadastradas</h3>
          <span className="opLinhaAcoes" style={{ marginTop: 0 }}>
            {aguardandoContrato ? <Badge nivel="y">{aguardandoContrato} aguardando envio de contrato</Badge> : null}
            <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button>
            <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => setModo((m) => (m === "tabela" ? "kanban" : "tabela"))}>{modo === "tabela" ? "🗂 Ver como funil" : "📋 Ver como tabela"}</button>
            <span className="sjMini">{status}</span>
          </span>
        </div>
        {modo === "kanban" ? (
          <Kanban itens={cotacoes} colunas={COLUNAS} aoSoltar={mover} card={(c) => (<><div style={{ fontWeight: 600 }}>{c.nomeEmpresaCliente}</div><div className="sjMini">{c.nomeEvento || ""}</div><div className="sjMini">{fmtData(c.dataEvento)} • {brl(c.valorTotal)}</div></>)} />
        ) : (
          <div className="sjTableInner opTabela">
            <table>
              <thead><tr><th>Cliente</th><th>Evento</th><th>Data</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                {cotacoes.length ? cotacoes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nomeEmpresaCliente}</td><td className="sjMini">{c.nomeEvento}</td><td>{fmtData(c.dataEvento)}</td><td>{brl(c.valorTotal)}</td>
                    <td><Badge nivel={COTACAO_STATUS_BADGE[c.status] ?? "y"}>{COTACAO_STATUS_LABEL[c.status] ?? c.status}</Badge></td>
                    <td><div className="opAcoes" style={{ justifyContent: "flex-start" }}>
                      <BotaoAcao onClick={() => aoEditar(c)}>{COTACAO_EDITAVEL.includes(c.status) ? "Editar" : "Ver"}</BotaoAcao>
                      {c.status === "aguardando_aprovacao" && diretoria ? <><BotaoAcao destaque onClick={() => decidir(c.id, true)}>✅ Aprovar</BotaoAcao><BotaoAcao perigo onClick={() => decidir(c.id, false)}>❌ Recusar</BotaoAcao></> : null}
                      {(c.status === "aprovado" || c.status === "enviado") && c.contratoDocUrl ? <a className="sjMiniBtn" href={c.contratoDocUrl} target="_blank" rel="noreferrer">📄 Ver contrato</a> : null}
                      {c.status === "aprovado" && diretoria ? <BotaoAcao destaque onClick={() => abrirEnvio(c)}>📧 Enviar</BotaoAcao> : null}
                    </div></td>
                  </tr>
                )) : <tr><td colSpan={6} className="sjMini">Nenhuma cotação ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {envio ? (
          <div className="opGrupo" style={{ marginTop: 10 }}>
            <div className="sjRole"><h3>Revisar e enviar contrato</h3></div>
            <p className="sjMini">Pra: {envio.para}</p>
            <div className="opForm">
              <label className="opLargo"><b>Assunto</b><input className="sjInput" value={envio.assunto} onChange={(e) => setEnvio({ ...envio, assunto: e.target.value })} /></label>
              <label className="opLargo"><b>Mensagem</b><textarea className="sjInput" rows={4} value={envio.corpo} onChange={(e) => setEnvio({ ...envio, corpo: e.target.value })} /></label>
            </div>
            <div className="opLinhaAcoes">
              <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#8a4423" }} onClick={confirmarEnvio}>✅ Confirmar envio</button>
              <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => setEnvio(null)}>Cancelar</button>
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
