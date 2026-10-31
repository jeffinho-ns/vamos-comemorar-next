"use client";

import { useEffect, useState } from "react";
import { CONTEUDO } from "../conteudo";
import { mensagemErro, postArea, usePermissoesArea } from "../operacao/apiArea";
import { Badge, BotaoAcao, Cartao } from "../operacao/Cartao";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { itensDe, payloadDe, usePlanilha } from "../usePlanilha";
import "../operacao/operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

interface Contato { id: string; nome: string; categoria: string; telefone: string; observacao: string; ativo: boolean }
interface Solicitacao { id: string; tipo: string; contatoId: string; contatoNome: string; dados: { categoria?: string; telefone?: string }; solicitadoPorEmail: string; solicitadoEm: string; status: string; decididoPorEmail: string; decididoEm: string; nota: string }

const CHAVES = ["getContatosEmergencia", "getContatoSolicitacoes", "getDuvidas"];
const SOLIC_TIPO: Record<string, string> = { criar: "Cadastrar", editar: "Editar", apagar: "Apagar" };
type Form = { nome: string; categoria: string; telefone: string; observacao: string; ativo: string };
const VAZIO: Form = { nome: "", categoria: "", telefone: "", observacao: "", ativo: "1" };

function textoDe(valor: unknown) {
  return valor == null ? "" : String(valor);
}

function telHref(telefone: unknown) {
  return `tel:${textoDe(telefone).replace(/[^\d+]/g, "")}`;
}

export function ContatosPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.contatos ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const { diretoria } = usePermissoesArea();
  const contatos = itensDe<Contato>(payloadDe(dados, "getContatosEmergencia")).filter((c) => c && textoDe(c.id));
  const solicitacoes = itensDe<Solicitacao>(payloadDe(dados, "getContatoSolicitacoes")).filter((x) => x && textoDe(x.id));
  const pendentes = solicitacoes.filter((x) => x.status === "pendente").length;
  const [editando, setEditando] = useState<Contato | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [status, setStatus] = useState("");
  const [statusLista, setStatusLista] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  useEffect(() => { setForm(editando ? { nome: textoDe(editando.nome), categoria: textoDe(editando.categoria), telefone: textoDe(editando.telefone), observacao: textoDe(editando.observacao), ativo: editando.ativo ? "1" : "0" } : VAZIO); }, [editando]);
  const set = (c: keyof Form, v: string) => setForm((a) => ({ ...a, [c]: v }));
  const aoMudar = () => { onSalvo(); recarregar(); };

  async function salvar() {
    if (!form.nome.trim() || !form.telefone.trim()) { setStatus("Preencha nome e telefone."); return; }
    setStatus("Salvando…");
    const r = await postArea("/justino/contatos/salvar", { id: editando?.id, nome: form.nome.trim(), categoria: form.categoria.trim(), telefone: form.telefone.trim(), observacao: form.observacao.trim(), ativo: form.ativo === "1" });
    if (r.ok) { setStatus(r.solicitacao ? "Solicitação enviada para aprovação da Diretoria." : "Contato salvo."); setEditando(null); setForm(VAZIO); aoMudar(); } else setStatus(mensagemErro(r.error, "Não consegui salvar o contato."));
  }
  async function apagar(id: string, confirmar = true) {
    if (confirmar && !window.confirm(diretoria ? "Apagar este contato de emergência? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria)." : "Solicitar a exclusão deste contato? A Diretoria precisa aprovar.")) return false;
    const r = await postArea("/justino/contatos/apagar", { id });
    if (r.ok) setStatusLista(r.solicitacao ? "Solicitação de exclusão enviada para aprovação da Diretoria." : "Contato apagado."); else setStatusLista(mensagemErro(r.error, "Não consegui apagar."));
    return r.ok;
  }
  async function apagarSelecionados() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatusLista("Marque pelo menos um contato."); return; }
    if (!window.confirm(diretoria ? `Apagar ${ids.length} contato(s) selecionado(s)?` : `Solicitar a exclusão de ${ids.length} contato(s)? A Diretoria precisa aprovar.`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagar(id, false)) ok += 1; }
    setSel(new Set()); setStatusLista(`${ok} apagado(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`); aoMudar();
  }
  async function decidir(id: string, approve: boolean) {
    let nota = "";
    if (!approve) nota = (window.prompt("Motivo da recusa (opcional):", "") || "").trim();
    else if (!window.confirm("Aprovar esta solicitação? A alteração vale na hora.")) return;
    const r = await postArea("/justino/contatos/decidir", { id, approve, nota });
    if (r.ok) { setStatusLista(approve ? "Solicitação aprovada." : "Solicitação recusada."); aoMudar(); } else setStatusLista(mensagemErro(r.error, "Não consegui registrar a decisão."));
  }

  return (
    <>
      {abas.length > 1 ? <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div> : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="contatos" className="sjStage">
        <div className="sjGrid">
          <section className="sjCard sjBloco opFull">
            <div className="sjRole"><h3>{editando ? "Editar contato de emergência" : "+ Adicionar contato de emergência"}</h3></div>
            <p className="sjNote">Prestadores de confiança pra emergências (elétrica, hidráulica, eletrodomésticos, chaveiro etc.) — visível pra qualquer um logado no BI. <b>{diretoria ? "Como Diretoria, suas alterações valem na hora e você aprova os pedidos da equipe abaixo." : <>Cadastrar, editar ou apagar contato é uma <u>solicitação</u>: a Diretoria aprova.</>}</b></p>
            <div className="opForm">
              <label><b>Nome</b><input className="sjInput" placeholder="Ex.: Flávio Micro" value={form.nome} onChange={(e) => set("nome", e.target.value)} /></label>
              <label><b>Categoria / especialidade</b><input className="sjInput" placeholder="Ex.: Eletrodomésticos (microondas)" value={form.categoria} onChange={(e) => set("categoria", e.target.value)} /></label>
              <label><b>Telefone</b><input className="sjInput" type="tel" placeholder="+55 11 90000-0000" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></label>
              <label><b>Status</b><select className="sjInput" value={form.ativo} onChange={(e) => set("ativo", e.target.value)}><option value="1">Ativo</option><option value="0">Inativo</option></select></label>
              <label className="opLargo"><b>Observação</b><textarea className="sjInput" rows={2} placeholder="Ex.: bom preço, qualidade e prazo de entrega. Ele retira o aparelho." value={form.observacao} onChange={(e) => set("observacao", e.target.value)} /></label>
            </div>
            <div className="opLinhaAcoes">
              <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={salvar}>{diretoria ? "Salvar contato" : "Solicitar cadastro do contato"}</button>
              {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => { setEditando(null); setForm(VAZIO); setStatus(""); }}>Cancelar edição</button> : null}
              <span className="sjMini">{status}</span>
            </div>
          </section>
          <Cartao titulo="Solicitações de contatos">
            <div className="sjRole"><h3>Solicitações de contatos <Badge nivel="y">{pendentes} pendente(s)</Badge></h3><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button></div>
            <p className="sjMini">{diretoria ? "Pedidos da equipe aguardando a sua aprovação." : "Seus pedidos e a decisão da Diretoria."}</p>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>Quando</th><th>Pedido</th><th>Contato</th><th>Quem pediu</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>
                  {solicitacoes.length ? solicitacoes.map((x) => (
                    <tr key={x.id}>
                      <td className="sjMini">{textoDe(x.solicitadoEm).slice(0, 16).replace("T", " ")}</td><td>{SOLIC_TIPO[x.tipo] ?? textoDe(x.tipo)}</td>
                      <td>{textoDe(x.contatoNome) || "—"}{x.tipo !== "apagar" ? <><br /><span className="sjMini">{textoDe(x.dados?.categoria) + (x.dados?.telefone ? ` • ${textoDe(x.dados.telefone)}` : "")}</span></> : null}</td>
                      <td className="sjMini">{x.solicitadoPorEmail || ""}</td>
                      <td><Badge nivel={x.status === "aprovado" ? "g" : x.status === "recusado" ? "r" : "y"}>{x.status}</Badge>{x.nota ? <><br /><span className="sjMini">{x.nota}</span></> : null}</td>
                      <td>{diretoria && x.status === "pendente" ? <div className="opAcoes" style={{ justifyContent: "flex-start" }}><BotaoAcao onClick={() => decidir(x.id, true)}>Aprovar</BotaoAcao><BotaoAcao perigo onClick={() => decidir(x.id, false)}>Recusar</BotaoAcao></div> : <span className="sjMini">{x.decididoPorEmail || "—"}</span>}</td>
                    </tr>
                  )) : <tr><td colSpan={6} className="sjMini">Nenhuma solicitação.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
          <Cartao titulo="Contatos cadastrados">
            <div className="sjRole"><h3>Contatos cadastrados</h3><span className="opLinhaAcoes" style={{ marginTop: 0 }}><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionados}>🗑 Apagar selecionados</button><span className="sjMini">{statusLista}</span></span></div>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>Nome</th><th>Categoria</th><th>Telefone</th><th>Observação</th><th>Status</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar todos" checked={contatos.length > 0 && contatos.every((c) => sel.has(c.id))} onChange={(e) => setSel(e.target.checked ? new Set(contatos.map((c) => c.id)) : new Set())} /></th></tr></thead>
                <tbody>
                  {contatos.length ? contatos.map((c) => (
                    <tr key={c.id}>
                      <td>{textoDe(c.nome)}</td><td className="sjMini">{textoDe(c.categoria) || "—"}</td><td>{textoDe(c.telefone) ? <a href={telHref(c.telefone)} style={{ color: "inherit" }}>{textoDe(c.telefone)}</a> : "—"}</td><td className="sjMini">{textoDe(c.observacao) || "—"}</td>
                      <td>{c.ativo ? <Badge nivel="g">Ativo</Badge> : <Badge nivel="y">Inativo</Badge>}</td>
                      <td><div className="opAcoes" style={{ justifyContent: "flex-start" }}><BotaoAcao onClick={() => setEditando(c)}>Editar</BotaoAcao><BotaoAcao perigo onClick={async () => { if (await apagar(c.id)) aoMudar(); }}>Apagar</BotaoAcao></div></td>
                      <td><input type="checkbox" className="opCheck" checked={sel.has(c.id)} onChange={(e) => setSel((a) => { const n = new Set(a); if (e.target.checked) n.add(c.id); else n.delete(c.id); return n; })} /></td>
                    </tr>
                  )) : <tr><td colSpan={7} className="sjMini">Nenhum contato cadastrado ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
