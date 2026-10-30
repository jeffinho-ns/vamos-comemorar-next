"use client";

import { useState } from "react";
import { mensagemErro, postArea } from "../operacao/apiArea";
import { Badge, BotaoAcao } from "../operacao/Cartao";
import { brl, fmtData, hojeSp } from "../operacao/formato";
import { contratoAssinado, pagamentoValidado, valorEventoBruto, valorEventoSistema } from "./indicadores";
import { Kanban } from "./Kanban";
import { EVENTO_FOLLOWUP_FIELDS, EVENTO_STATUS_BADGE, EVENTO_STATUS_LABEL, EVENTO_TIPO_LABEL, pendenciasEvento, type Evento, type Tarefa } from "./tipos";

const COLUNAS = [{ key: "orcamento", label: "Orçamento" }, { key: "confirmado", label: "Confirmado" }, { key: "realizado", label: "Realizado" }, { key: "cancelado", label: "Cancelado" }];

function PendenciasBadge({ ev }: { ev: Evento }) {
  const n = pendenciasEvento(ev);
  const total = EVENTO_FOLLOWUP_FIELDS.length;
  return <span title={`${n} de ${total} campos de acompanhamento comercial ainda em aberto`}><Badge nivel={n === 0 ? "g" : n > 10 ? "r" : "y"}>{n}/{total}</Badge></span>;
}

function ValorSistema({ ev }: { ev: Evento }) {
  if (ev.status !== "realizado") return <td className="sjMini">—</td>;
  const bruto = valorEventoBruto(ev);
  const sistema = valorEventoSistema(ev);
  const viaContrato = (Number(ev.valorContrato) || 0) + (Number(ev.valorExcedente) || 0);
  const origem = viaContrato > 0 ? "Contrato+Excedente" : "Valor total (fallback)";
  const motivo = contratoAssinado(ev) ? "Contrato assinado" : pagamentoValidado(ev) ? "Pagamento validado" : "NÃO contado — sem contrato assinado nem pagamento validado";
  return <td title={`Fórmula: ${origem} (${brl(bruto)}). Motivo: ${motivo}. Contrato: ${ev.statusContrato || "(vazio)"}. Pagamento: ${ev.statusPagamento || "(vazio)"}.`}>{brl(sistema)}{sistema === 0 && bruto > 0 ? " ⚠" : ""}</td>;
}

/** "📋 Tarefas de hoje e atrasadas" (loadTarefasHojeWidget). */
export function TarefasHoje({ tarefas, eventos, recarregar }: { tarefas: Tarefa[]; eventos: Evento[]; recarregar: () => void }) {
  const hoje = hojeSp();
  const pendentes = tarefas.filter((t) => t.status === "pendente" && t.dataVencimento <= hoje).sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1));
  return (
    <section className="sjCard sjBloco opFull">
      <div className="sjRole"><h3>📋 Tarefas de hoje e atrasadas</h3><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button></div>
      {!pendentes.length ? <span className="sjMini">Nenhuma tarefa pendente pra hoje ou atrasada. 🎉</span> : (
        <div className="opLinhaTempo">
          {pendentes.map((t) => {
            const atrasada = t.dataVencimento < hoje;
            const nome = eventos.find((e) => e.id === t.eventoId)?.nomeCliente || "(evento)";
            return (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <div>
                  <Badge nivel={atrasada ? "r" : "y"}>{atrasada ? "Atrasada" : "Hoje"}</Badge>{" "}
                  <b>{t.titulo}</b>{" "}
                  <span className="sjMini" style={{ display: "inline" }}>{nome} • {fmtData(t.dataVencimento)}{t.responsavelEmail ? ` • ${t.responsavelEmail}` : ""}</span>
                </div>
                <BotaoAcao onClick={async () => {
                  const r = await postArea("/justino/eventos/tarefas/concluir", { id: t.id, concluida: true });
                  if (r.ok) recarregar();
                }}>✓ Concluir</BotaoAcao>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** "Eventos cadastrados" — tabela, funil (kanban), apagar e seleção em lote. */
export function EventosLista({ eventos, aoEditar, aoMudar, recarregar }: { eventos: Evento[]; aoEditar: (ev: Evento) => void; aoMudar: () => void; recarregar: () => void }) {
  const [modo, setModo] = useState<"tabela" | "kanban">("tabela");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  async function apagar(id: string, confirmar = true) {
    if (confirmar && !window.confirm("Apagar este evento? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return false;
    const r = await postArea("/justino/eventos/apagar", { id });
    if (!r.ok) setStatus(mensagemErro(r.error, "Não consegui apagar."));
    return r.ok;
  }
  async function apagarSelecionados() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatus("Marque pelo menos um evento."); return; }
    if (!window.confirm(`Apagar ${ids.length} evento(s)? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagar(id, false)) ok += 1; setStatus(`Apagando… (${ok}/${ids.length})`); }
    setSel(new Set());
    setStatus(`${ok} apagado(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`);
    aoMudar();
  }
  async function mover(item: Evento, de: string, para: string) {
    if (!window.confirm(`Mover "${item.nomeCliente}" de ${EVENTO_STATUS_LABEL[de] ?? de} pra ${EVENTO_STATUS_LABEL[para] ?? para}?`)) return;
    const r = await postArea("/justino/eventos/salvar", { ...item, status: para });
    if (r.ok) aoMudar(); else setStatus(mensagemErro(r.error, "Não consegui mover o evento."));
  }

  return (
    <details className="sjCollapse">
      <summary><span className="sjChev">▸</span>Eventos cadastrados<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Eventos cadastrados</h3>
          <span className="opLinhaAcoes" style={{ marginTop: 0 }}>
            <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button>
            <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => setModo((m) => (m === "tabela" ? "kanban" : "tabela"))}>{modo === "tabela" ? "🗂 Ver como funil" : "📋 Ver como tabela"}</button>
            <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionados}>🗑 Apagar selecionados</button>
            <span className="sjMini">{status}</span>
          </span>
        </div>
        {modo === "kanban" ? (
          <Kanban itens={eventos} colunas={COLUNAS} aoSoltar={mover} card={(ev) => (
            <><div style={{ fontWeight: 600 }}>{ev.nomeCliente}</div><div className="sjMini">{fmtData(ev.data)} • {brl(ev.valorContrato)}</div><div style={{ marginTop: 4 }}><PendenciasBadge ev={ev} /></div></>
          )} />
        ) : (
          <div className="sjTableInner opTabela">
            <table>
              <thead><tr><th>Data</th><th>Cliente</th><th>Tipo</th><th>Pax</th><th>Valor contrato</th><th>Sinal</th><th title="Valor que o BI está somando no faturamento pra esse evento, com o motivo em cima do mouse">Valor (sistema)</th><th>Status</th><th>Pendências</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar todos" checked={eventos.length > 0 && eventos.every((e) => sel.has(e.id))} onChange={(e) => setSel(e.target.checked ? new Set(eventos.map((x) => x.id)) : new Set())} /></th></tr></thead>
              <tbody>
                {eventos.length ? eventos.map((ev) => (
                  <tr key={ev.id}>
                    <td>{fmtData(ev.data)}</td><td>{ev.nomeCliente}</td><td className="sjMini">{EVENTO_TIPO_LABEL[ev.tipoEvento] ?? ev.tipoEvento}</td><td>{ev.pax || 0}</td>
                    <td>{brl(ev.valorContrato)}</td><td>{brl(ev.valorSinal)}</td><ValorSistema ev={ev} />
                    <td><Badge nivel={EVENTO_STATUS_BADGE[ev.status] ?? "y"}>{EVENTO_STATUS_LABEL[ev.status] ?? ev.status}</Badge>{ev.pagamentoPendente ? <> <Badge nivel="y">Pagamento pendente</Badge></> : null}</td>
                    <td><PendenciasBadge ev={ev} /></td>
                    <td><div className="opAcoes">
                      <BotaoAcao onClick={() => aoEditar(ev)}>Editar</BotaoAcao>
                      {ev.contratoAnexoUrl ? <a className="sjMiniBtn" href={ev.contratoAnexoUrl} target="_blank" rel="noreferrer" title={ev.contratoAnexoNome}>📄 Ver</a> : <BotaoAcao title="Anexo de contrato (upload) ainda pendente neste painel" disabled>📎 Contrato</BotaoAcao>}
                      <BotaoAcao perigo onClick={async () => { if (await apagar(ev.id)) aoMudar(); }}>Apagar</BotaoAcao>
                    </div></td>
                    <td><input type="checkbox" className="opCheck" checked={sel.has(ev.id)} onChange={(e) => setSel((a) => { const n = new Set(a); if (e.target.checked) n.add(ev.id); else n.delete(ev.id); return n; })} /></td>
                  </tr>
                )) : <tr><td colSpan={11} className="sjMini">Nenhum evento cadastrado ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
