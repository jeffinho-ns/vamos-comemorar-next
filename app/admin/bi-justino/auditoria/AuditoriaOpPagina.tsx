"use client";

import { useState } from "react";
import { CONTEUDO } from "../conteudo";
import { mensagemErro, postArea, usePermissoesArea } from "../operacao/apiArea";
import { Badge, BotaoAcao, Kpi, Nota } from "../operacao/Cartao";
import { FecharMes, fechamentosDe } from "../operacao/FecharMes";
import { brl, fmtData, hojeSp } from "../operacao/formato";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import { AuditoriaOpForm } from "./AuditoriaOpForm";
import { AUOP_PRIORIDADE_BADGE, AUOP_PRIORIDADE_LABEL, AUOP_SETORES, AUOP_STATUS_BADGE, AUOP_STATUS_LABEL, AUOP_TIPO_LABEL, auopAtrasado, auopSetorLabel, indicadoresAuop, type ItemAuditoriaOp } from "./auditoriaOpTipos";
import "../operacao/operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

const CHAVES = ["getAuditoriaOpItens", "getMonthClosures:auditoriaop"];

export function AuditoriaOpPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.auditoriaop ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const { diretoria } = usePermissoesArea();
  const hoje = hojeSp();
  const itens = payloadDe<{ items?: ItemAuditoriaOp[] }>(dados, "getAuditoriaOpItens")?.items ?? [];
  const k = indicadoresAuop(itens, hoje);
  const [editando, setEditando] = useState<ItemAuditoriaOp | null>(null);
  const [fSetor, setFSetor] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const lista = itens.filter((x) => (!fSetor || x.setor === fSetor) && (fStatus ? x.status === fStatus : x.status !== "concluido"));
  const aoMudar = () => { onSalvo(); recarregar(); };

  async function apagar(id: string, confirmar = true) {
    if (confirmar && !window.confirm("Apagar este item de auditoria operacional? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return false;
    const r = await postArea("/justino/auditoria-op/apagar", { id });
    if (!r.ok) setStatus(mensagemErro(r.error, "Não consegui apagar."));
    return r.ok;
  }
  async function apagarSelecionados() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatus("Marque pelo menos um item."); return; }
    if (!window.confirm(`Apagar ${ids.length} item(ns) de auditoria? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagar(id, false)) ok += 1; setStatus(`Apagando… (${ok}/${ids.length})`); }
    setSel(new Set()); setStatus(`${ok} apagado(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`); aoMudar();
  }
  async function decidir(id: string, aprovar: boolean) {
    const obs = window.prompt(aprovar ? "Observação (opcional, vai pro item em Auditoria Operacional):" : "Motivo da negativa (recomendado):") ?? null;
    if (obs === null) return;
    const r = await postArea(aprovar ? "/justino/auditoria-op/aprovar" : "/justino/auditoria-op/negar", { id, observacao: obs });
    if (r.ok) { setStatus(aprovar ? "Item aprovado." : "Item negado."); aoMudar(); } else setStatus(mensagemErro(r.error, aprovar ? "Não consegui aprovar." : "Não consegui negar."));
  }

  return (
    <>
      {abas.length > 1 ? <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div> : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="auditoriaop" className="sjStage">
        <div className="sjGrid">
          <Nota><b>Auditoria Operacional</b> — plano de ação de manutenção, limpeza, organização e obra encontrado em vistoria: cadastre o item, atribua responsável/empresa executora, acompanhe prazo, custo e status até concluir. Mesmo espírito do &quot;Manutenção solicitada&quot; do Envio do dia, item por item em vez de 1 valor só.</Nota>
          <Kpi titulo="Aberto" valor={k.aberto} />
          <Kpi titulo="Em andamento" valor={k.andamento} />
          <Kpi titulo="Aguardando aprovação" valor={k.aguardando} />
          <Kpi titulo="Concluído" valor={k.concluido} />
          <Kpi titulo="Atrasado" valor={k.atrasado} dica="Não concluído e com prazo já vencido." />
          <Kpi titulo="Valor estimado em aberto" valor={brl(k.valorAberto)} sub="soma dos não concluídos" />
          <AuditoriaOpForm editando={editando} fechamentos={fechamentosDe(dados, "auditoriaop")} diretoria={diretoria} aoSalvar={() => { setEditando(null); aoMudar(); }} aoCancelar={() => setEditando(null)} />
          <FecharMes area="auditoriaop" dados={dados} diretoria={diretoria} aoSalvar={recarregar} />
          <details className="sjCollapse" open>
            <summary><span className="sjChev">▸</span>Itens de auditoria<span className="sjHint">clique para abrir</span></summary>
            <div className="sjCard sjBloco sjCollapseBody">
              <div className="sjRole"><h3>Itens de auditoria</h3><span className="opLinhaAcoes" style={{ marginTop: 0 }}><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionados}>🗑 Apagar selecionados</button><span className="sjMini">{status}</span></span></div>
              <div className="sjToolbar">
                <div className="sjTb"><label>Setor<select className="sjInput" value={fSetor} onChange={(e) => setFSetor(e.target.value)}><option value="">Todos</option>{AUOP_SETORES.map((s) => <option key={s} value={s}>{auopSetorLabel(s)}</option>)}</select></label></div>
                <div className="sjTb"><label>Status<select className="sjInput" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">Todos</option>{Object.entries(AUOP_STATUS_LABEL).map(([k2, n]) => <option key={k2} value={k2}>{n}</option>)}</select></label></div>
              </div>
              <div className="sjTableInner opTabela">
                <table>
                  <thead><tr><th>Data</th><th>Setor</th><th>Status</th><th>Tipo</th><th>Descrição</th><th>Responsável</th><th>Empresa executora</th><th>Prioridade</th><th>Prazo</th><th>Valor</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar todos" checked={lista.length > 0 && lista.every((x) => sel.has(x.id))} onChange={(e) => setSel(e.target.checked ? new Set(lista.map((x) => x.id)) : new Set())} /></th></tr></thead>
                  <tbody>
                    {lista.length ? lista.map((it) => {
                      const atrasado = auopAtrasado(it, hoje);
                      const podeAprovar = diretoria && it.necessitaAprovacao && it.status === "aguardandoAprovacao";
                      return (
                        <tr key={it.id}>
                          <td className="sjMini">{fmtData(it.dataIdentificacao)}</td><td className="sjMini">{auopSetorLabel(it.setor)}</td>
                          <td><Badge nivel={atrasado ? "r" : AUOP_STATUS_BADGE[it.status] ?? "y"}>{atrasado ? "Atrasado" : AUOP_STATUS_LABEL[it.status] ?? it.status}</Badge></td>
                          <td className="sjMini">{AUOP_TIPO_LABEL[it.tipoServico] ?? it.tipoServico}</td>
                          <td style={{ whiteSpace: "normal", maxWidth: 560, fontSize: 12 }}>{it.descricaoProblema}{it.observacaoAprovacao ? <div className="sjMini" style={{ marginTop: 4, padding: "4px 6px", borderRadius: 6, background: it.status === "negado" ? "#f76e7c14" : "#34d39914", color: it.status === "negado" ? "#f76e7c" : "#34d399" }}>📝 Diretoria: {it.observacaoAprovacao}</div> : null}</td>
                          <td className="sjMini">{it.responsavelInterno || "—"}</td><td className="sjMini">{it.empresaExecutora || "—"}</td>
                          <td><Badge nivel={AUOP_PRIORIDADE_BADGE[it.prioridade] ?? "y"}>{AUOP_PRIORIDADE_LABEL[it.prioridade] ?? it.prioridade}</Badge></td>
                          <td className="sjMini">{it.prazo ? fmtData(it.prazo) : "—"}</td><td className="sjMini">{brl(it.valorEstimado)}</td>
                          <td><div className="opAcoes">
                            {podeAprovar ? <><BotaoAcao destaque onClick={() => decidir(it.id, true)}>✓ Aprovar</BotaoAcao><BotaoAcao perigo onClick={() => decidir(it.id, false)}>✕ Negar</BotaoAcao></> : null}
                            <BotaoAcao onClick={() => setEditando(it)}>Editar</BotaoAcao>
                            <BotaoAcao perigo onClick={async () => { if (await apagar(it.id)) aoMudar(); }}>Apagar</BotaoAcao>
                          </div></td>
                          <td><input type="checkbox" className="opCheck" checked={sel.has(it.id)} onChange={(e) => setSel((a) => { const n = new Set(a); if (e.target.checked) n.add(it.id); else n.delete(it.id); return n; })} /></td>
                        </tr>
                      );
                    }) : <tr><td colSpan={12} className="sjMini">Nenhum item cadastrado ainda.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
