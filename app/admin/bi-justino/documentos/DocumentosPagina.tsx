"use client";

import { useEffect, useState } from "react";
import { CONTEUDO } from "../conteudo";
import { enviarArquivoArea, mensagemErro, postArea } from "../operacao/apiArea";
import { Badge, BotaoAcao, Cartao, Nota } from "../operacao/Cartao";
import { fmtData, hojeSp } from "../operacao/formato";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import "../operacao/operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

interface Documento { id: string; tipo: string; tipoOutro: string; nome: string; numero: string; orgaoEmissor: string; dataEmissao: string; dataValidade: string; observacao: string; arquivoUrl: string; arquivoNome: string }

const CHAVES = ["getDocumentacoes"];
const TIPO_LABEL: Record<string, string> = { alvara: "Alvará de funcionamento", licencaSanitaria: "Licença sanitária", licencaBombeiros: "Licença do corpo de bombeiros", seguro: "Seguro", contratoAluguel: "Contrato de aluguel", outro: "Outro" };
const DIAS_ALERTA = 30;
type Form = Record<string, string>;
const VAZIO: Form = { tipo: "alvara", tipoOutro: "", nome: "", numero: "", orgaoEmissor: "", dataEmissao: "", dataValidade: "", observacao: "" };

export function diasParaVencer(dataValidade: string, hoje: string) {
  if (!dataValidade) return null;
  const [y1, m1, d1] = hoje.split("-").map(Number);
  const [y2, m2, d2] = dataValidade.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function Situacao({ dataValidade, hoje }: { dataValidade: string; hoje: string }) {
  const dias = diasParaVencer(dataValidade, hoje);
  if (dias == null) return <span className="sjMini">sem vencimento</span>;
  if (dias < 0) return <Badge nivel="r">venceu há {Math.abs(dias)}d</Badge>;
  if (dias <= DIAS_ALERTA) return <Badge nivel="y">vence em {dias}d</Badge>;
  return <Badge nivel="g">em dia</Badge>;
}

export function DocumentosPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.documentos ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const hoje = hojeSp();
  const docs = payloadDe<{ items?: Documento[] }>(dados, "getDocumentacoes")?.items ?? [];
  const [editando, setEditando] = useState<Documento | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [status, setStatus] = useState("");
  const [statusLista, setStatusLista] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [statusArquivo, setStatusArquivo] = useState("");
  useEffect(() => { setForm(editando ? { tipo: editando.tipo || "outro", tipoOutro: editando.tipoOutro || "", nome: editando.nome || "", numero: editando.numero || "", orgaoEmissor: editando.orgaoEmissor || "", dataEmissao: editando.dataEmissao || "", dataValidade: editando.dataValidade || "", observacao: editando.observacao || "" } : VAZIO); if (editando) setAberto(true); }, [editando]);
  const set = (c: string, v: string) => setForm((a) => ({ ...a, [c]: v }));
  const vencendo = docs.filter((d) => d.dataValidade && (diasParaVencer(d.dataValidade, hoje) ?? 999) <= DIAS_ALERTA).sort((a, b) => (diasParaVencer(a.dataValidade, hoje) ?? 0) - (diasParaVencer(b.dataValidade, hoje) ?? 0));
  const aoMudar = () => { onSalvo(); recarregar(); };

  async function enviarAnexo(id: string) {
    if (!arquivo) return true;
    setStatusArquivo("Enviando arquivo…");
    const up = await enviarArquivoArea("/justino/documentos/arquivo", { id }, arquivo);
    if (up.ok) { setStatusArquivo("Arquivo anexado."); setArquivo(null); return true; }
    setStatusArquivo(mensagemErro(up.error, "Não consegui anexar o arquivo."));
    return false;
  }

  async function salvar() {
    if (!form.nome.trim()) { setStatus("Preencha o nome do documento."); return; }
    setStatus("Salvando…");
    const r = await postArea("/justino/documentos/salvar", { ...form, id: editando?.id });
    if (!r.ok) { setStatus(mensagemErro(r.error, "Não consegui salvar o documento.")); return; }
    const id = r.id || editando?.id;
    if (id) await enviarAnexo(id);
    setStatus("Documento salvo.");
    setEditando(null);
    setForm(VAZIO);
    aoMudar();
  }
  async function apagar(id: string, confirmar = true) {
    if (confirmar && !window.confirm("Apagar este documento (e o anexo, se tiver)? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return false;
    const r = await postArea("/justino/documentos/apagar", { id });
    if (!r.ok) setStatusLista(mensagemErro(r.error, "Não consegui apagar."));
    return r.ok;
  }
  async function apagarSelecionados() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatusLista("Marque pelo menos um documento."); return; }
    if (!window.confirm(`Apagar ${ids.length} documento(s)? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagar(id, false)) ok += 1; setStatusLista(`Apagando… (${ok}/${ids.length})`); }
    setSel(new Set()); setStatusLista(`${ok} apagado(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`); aoMudar();
  }

  return (
    <>
      {abas.length > 1 ? <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div> : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="documentos" className="sjStage">
        <div className="sjGrid">
          <Nota><b>Documentações legais da casa</b> — alvará, licença sanitária/bombeiros, seguro, contrato de aluguel etc., com validade e alerta de vencimento.</Nota>
          {vencendo.length ? (
            <div className="sjAlert r opFull"><span className="sjAlertIcon">!</span><div><b>⚠️ {vencendo.length} documento(s) vencido(s) ou vencendo em até {DIAS_ALERTA} dias:</b><ul style={{ margin: "6px 0 0 18px" }}>{vencendo.map((d) => { const dias = diasParaVencer(d.dataValidade, hoje) ?? 0; return <li key={d.id}>{d.nome} — {dias < 0 ? `venceu há ${Math.abs(dias)} dia(s)` : `vence em ${dias} dia(s)`} ({fmtData(d.dataValidade)})</li>; })}</ul></div></div>
          ) : null}
          <details className="sjCollapse" open={aberto} onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
            <summary><span className="sjChev">▸</span>{editando ? "Editar documento" : "+ Novo documento"}<span className="sjHint">clique para abrir</span></summary>
            <div className="sjCard sjBloco sjCollapseBody">
              <div className="opForm">
                <label><b>Tipo</b><select className="sjInput" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>{Object.entries(TIPO_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                {form.tipo === "outro" ? <label><b>Qual (se &quot;Outro&quot;)</b><input className="sjInput" value={form.tipoOutro} onChange={(e) => set("tipoOutro", e.target.value)} /></label> : null}
                <label><b>Nome/descrição</b><input className="sjInput" placeholder="ex.: Alvará de funcionamento 2026" value={form.nome} onChange={(e) => set("nome", e.target.value)} /></label>
                <label><b>Número</b><input className="sjInput" value={form.numero} onChange={(e) => set("numero", e.target.value)} /></label>
                <label><b>Órgão emissor</b><input className="sjInput" value={form.orgaoEmissor} onChange={(e) => set("orgaoEmissor", e.target.value)} /></label>
                <label><b>Data de emissão</b><input className="sjInput" type="date" value={form.dataEmissao} onChange={(e) => set("dataEmissao", e.target.value)} /></label>
                <label><b>Data de validade</b><input className="sjInput" type="date" value={form.dataValidade} onChange={(e) => set("dataValidade", e.target.value)} /><span className="help">Deixe em branco se não vencer.</span></label>
                <label className="opLargo"><b>Observação</b><textarea className="sjInput" rows={2} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} /></label>
                <div className="opCampo opLargo">
                  <b>Arquivo</b>
                  <span className="help">PDF, foto do documento etc. Reenviar substitui o anexo anterior.{!editando?.id && arquivo ? " O arquivo sobe depois de salvar o documento." : ""}</span>
                  <div className="opLinhaAcoes">
                    <input type="file" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
                    {editando?.id ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => enviarAnexo(editando.id)}>📎 Enviar arquivo</button> : null}
                    {editando?.arquivoUrl ? <a className="sjMini" href={editando.arquivoUrl} target="_blank" rel="noreferrer">Ver anexo atual</a> : null}
                    <span className="sjMini">{statusArquivo}</span>
                  </div>
                </div>
              </div>
              <div className="opLinhaAcoes">
                <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={salvar}>Salvar documento</button>
                {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => { setEditando(null); setForm(VAZIO); setStatus(""); setArquivo(null); setStatusArquivo(""); }}>Cancelar edição</button> : null}
                <span className="sjMini">{status}</span>
              </div>
            </div>
          </details>
          <Cartao titulo="Documentos cadastrados">
            <div className="sjRole"><h3>Documentos cadastrados</h3><span className="opLinhaAcoes" style={{ marginTop: 0 }}><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionados}>🗑 Apagar selecionados</button><span className="sjMini">{statusLista}</span></span></div>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>Nome</th><th>Tipo</th><th>Número</th><th>Órgão</th><th>Validade</th><th>Situação</th><th>Arquivo</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar todos" checked={docs.length > 0 && docs.every((d) => sel.has(d.id))} onChange={(e) => setSel(e.target.checked ? new Set(docs.map((d) => d.id)) : new Set())} /></th></tr></thead>
                <tbody>
                  {docs.length ? docs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.nome}</td><td className="sjMini">{d.tipo === "outro" ? (d.tipoOutro || "Outro") : (TIPO_LABEL[d.tipo] ?? d.tipo)}</td><td className="sjMini">{d.numero || "—"}</td><td className="sjMini">{d.orgaoEmissor || "—"}</td>
                      <td>{d.dataValidade ? fmtData(d.dataValidade) : "—"}</td><td><Situacao dataValidade={d.dataValidade} hoje={hoje} /></td>
                      <td>{d.arquivoUrl ? <a href={d.arquivoUrl} target="_blank" rel="noreferrer">{d.arquivoNome || "ver"}</a> : <span className="sjMini">—</span>}</td>
                      <td><div className="opAcoes"><BotaoAcao onClick={() => setEditando(d)}>Editar</BotaoAcao><BotaoAcao perigo onClick={async () => { if (await apagar(d.id)) aoMudar(); }}>Apagar</BotaoAcao></div></td>
                      <td><input type="checkbox" className="opCheck" checked={sel.has(d.id)} onChange={(e) => setSel((a) => { const n = new Set(a); if (e.target.checked) n.add(d.id); else n.delete(d.id); return n; })} /></td>
                    </tr>
                  )) : <tr><td colSpan={9} className="sjMini">Nenhum documento cadastrado ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
