"use client";

import { useCallback, useEffect, useState } from "react";
import { enviarArquivoArea, getArea, mensagemErro, postArea } from "../operacao/apiArea";
import { Badge, BotaoAcao } from "../operacao/Cartao";
import type { FechamentoMes } from "../operacao/FecharMes";
import { mesFechado } from "../operacao/FecharMes";
import { fmtDataHora, monthKeyLabel, parseBrl } from "../operacao/formato";
import { AUOP_PRIORIDADE_LABEL, AUOP_SETORES, AUOP_STATUS_LABEL, AUOP_TIPO_LABEL, auopSetorLabel, type Evidencia, type ItemAuditoriaOp } from "./auditoriaOpTipos";

type Form = Record<string, string>;
const VAZIO: Form = { dataIdentificacao: "", setor: "manutencao", tipoServico: "manutencao", descricaoProblema: "", impactoOperacional: "", responsavelInterno: "", empresaExecutora: "", necessitaAprovacao: "0", valorEstimado: "", prioridade: "media", prazo: "", dataInicio: "", dataConclusao: "", status: "aberto", observacao: "" };

function deItem(it: ItemAuditoriaOp): Form {
  return { dataIdentificacao: it.dataIdentificacao || "", setor: it.setor || "manutencao", tipoServico: it.tipoServico || "outros", descricaoProblema: it.descricaoProblema || "", impactoOperacional: it.impactoOperacional || "", responsavelInterno: it.responsavelInterno || "", empresaExecutora: it.empresaExecutora || "", necessitaAprovacao: it.necessitaAprovacao ? "1" : "0", valorEstimado: it.valorEstimado ? String(it.valorEstimado) : "", prioridade: it.prioridade || "media", prazo: it.prazo || "", dataInicio: it.dataInicio || "", dataConclusao: it.dataConclusao || "", status: it.status || "aberto", observacao: it.observacao || "" };
}

/** Evidências (fotos) de um item — lista sob demanda + upload multipart. */
function Evidencias({ itemId }: { itemId: string | null }) {
  const [lista, setLista] = useState<Evidencia[]>([]);
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState<"antes" | "depois">("antes");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const carregar = useCallback(async (forcar: boolean) => {
    if (!itemId) { setLista([]); return; }
    const r = await getArea<{ ok: boolean; items?: Evidencia[] }>(`/justino/auditoria-op/evidencias/${encodeURIComponent(itemId)}${forcar ? "?forcar=1" : ""}`);
    setLista(r.json?.items ?? []);
  }, [itemId]);
  useEffect(() => { carregar(false); }, [carregar]);
  async function enviar() {
    if (!itemId) { setStatus("Salve o item primeiro."); return; }
    if (!arquivo) { setStatus("Escolha uma foto."); return; }
    setStatus("Enviando…");
    const r = await enviarArquivoArea("/justino/auditoria-op/evidencias/enviar", { itemId, antesDepois: tipo, descricao }, arquivo);
    if (r.ok) { setStatus("Enviado."); setArquivo(null); setDescricao(""); carregar(true); } else setStatus(mensagemErro(r.error, "Não consegui anexar a foto."));
  }
  async function apagar(id: string) {
    if (!window.confirm("Apagar esta foto? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return;
    const r = await postArea("/justino/auditoria-op/evidencias/apagar", { id });
    if (r.ok) carregar(true); else setStatus(mensagemErro(r.error, "Não consegui apagar."));
  }
  return (
    <div className="opCampo opLargo">
      <b>Evidências (fotos)</b>
      <span className="opHelp">Antes/depois. Salve o item primeiro pra poder anexar.</span>
      <div className="opLinhaAcoes" style={{ flexWrap: "wrap" }}>
        <input type="file" accept="image/*" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        <select className="sjInput" style={{ maxWidth: 110 }} value={tipo} onChange={(e) => setTipo(e.target.value === "depois" ? "depois" : "antes")}><option value="antes">Antes</option><option value="depois">Depois</option></select>
        <input className="sjInput" style={{ maxWidth: 220 }} placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={enviar} disabled={!itemId}>📎 Enviar foto</button>
        <span className="sjMini">{status}</span>
      </div>
      <div className="sjTableInner opTabela" style={{ marginTop: 8 }}>
        <table>
          <thead><tr><th>Foto</th><th>Quando</th><th>Descrição</th><th>Enviado por</th><th></th></tr></thead>
          <tbody>
            {!itemId ? <tr><td colSpan={5} className="sjMini">Salve o item primeiro.</td></tr> : !lista.length ? <tr><td colSpan={5} className="sjMini">Nenhuma foto anexada ainda.</td></tr> : lista.map((ev) => (
              <tr key={ev.id}>
                <td><Badge nivel={ev.antesDepois === "depois" ? "g" : "y"}>{ev.antesDepois === "depois" ? "Depois" : "Antes"}</Badge> <a href={ev.url} target="_blank" rel="noreferrer">{ev.fileName || "ver"}</a></td>
                <td className="sjMini">{fmtDataHora(ev.uploadedAt)}</td><td className="sjMini">{ev.descricao || "—"}</td><td className="sjMini">{ev.uploadedByEmail || "—"}</td>
                <td><BotaoAcao perigo onClick={() => apagar(ev.id)}>Apagar</BotaoAcao></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** "+ Novo item / Editar item" (saveAuditoriaOpItemUI). */
export function AuditoriaOpForm({ editando, fechamentos, diretoria, aoSalvar, aoCancelar }: { editando: ItemAuditoriaOp | null; fechamentos: FechamentoMes[]; diretoria: boolean; aoSalvar: () => void; aoCancelar: () => void }) {
  const [form, setForm] = useState<Form>(VAZIO);
  const [status, setStatus] = useState("");
  const [aberto, setAberto] = useState(false);
  useEffect(() => { setForm(editando ? deItem(editando) : VAZIO); setStatus(""); if (editando) setAberto(true); }, [editando]);
  const set = (campo: string, valor: string) => setForm((a) => ({ ...a, [campo]: valor }));
  const travado = !diretoria && Boolean(form.dataIdentificacao) && mesFechado(fechamentos, form.dataIdentificacao);

  async function salvar() {
    if (!form.descricaoProblema.trim()) { setStatus("Descreva o problema."); return; }
    setStatus("Salvando…");
    const r = await postArea("/justino/auditoria-op/salvar", { ...form, id: editando?.id, necessitaAprovacao: form.necessitaAprovacao === "1", valorEstimado: parseBrl(form.valorEstimado) });
    if (r.ok) { setStatus("Item salvo."); setForm(VAZIO); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui salvar o item."));
  }

  return (
    <details className="sjCollapse" open={aberto} onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary><span className="sjChev">▸</span>{editando ? "Editar item" : "+ Novo item"}<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="opForm">
          <label><b>Data de identificação</b><input className="sjInput" type="date" value={form.dataIdentificacao} onChange={(e) => set("dataIdentificacao", e.target.value)} /></label>
          <label><b>Setor</b><select className="sjInput" value={form.setor} onChange={(e) => set("setor", e.target.value)}>{AUOP_SETORES.map((s) => <option key={s} value={s}>{auopSetorLabel(s)}</option>)}</select></label>
          <label><b>Tipo de serviço</b><select className="sjInput" value={form.tipoServico} onChange={(e) => set("tipoServico", e.target.value)}>{Object.entries(AUOP_TIPO_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className="opLargo"><b>Descrição do problema</b><textarea className="sjInput" rows={2} placeholder="ex.: fiação exposta no estoque da cozinha" value={form.descricaoProblema} onChange={(e) => set("descricaoProblema", e.target.value)} /></label>
          <label className="opLargo"><b>Impacto operacional</b><textarea className="sjInput" rows={2} placeholder="Opcional — o que isso afeta no dia a dia" value={form.impactoOperacional} onChange={(e) => set("impactoOperacional", e.target.value)} /></label>
          <label><b>Responsável interno</b><input className="sjInput" value={form.responsavelInterno} onChange={(e) => set("responsavelInterno", e.target.value)} /></label>
          <label><b>Empresa executora</b><input className="sjInput" placeholder="Opcional — prestador externo" value={form.empresaExecutora} onChange={(e) => set("empresaExecutora", e.target.value)} /></label>
          <label><b>Necessita aprovação?</b><select className="sjInput" value={form.necessitaAprovacao} onChange={(e) => { set("necessitaAprovacao", e.target.value); if (e.target.value === "1") set("status", "aguardandoAprovacao"); }}><option value="0">Não</option><option value="1">Sim</option></select></label>
          <label><b>Valor estimado</b><input className="sjInput" inputMode="decimal" placeholder="0,00" value={form.valorEstimado} onChange={(e) => set("valorEstimado", e.target.value)} /></label>
          <label><b>Prioridade</b><select className="sjInput" value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)}>{Object.entries(AUOP_PRIORIDADE_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label><b>Prazo</b><input className="sjInput" type="date" value={form.prazo} onChange={(e) => set("prazo", e.target.value)} /></label>
          <label><b>Data de início</b><input className="sjInput" type="date" value={form.dataInicio} onChange={(e) => set("dataInicio", e.target.value)} /></label>
          <label><b>Data de conclusão</b><input className="sjInput" type="date" value={form.dataConclusao} onChange={(e) => set("dataConclusao", e.target.value)} /></label>
          <label><b>Status</b><select className="sjInput" value={form.status} onChange={(e) => set("status", e.target.value)}>{Object.entries(AUOP_STATUS_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className="opLargo"><b>Observação</b><textarea className="sjInput" rows={2} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} /></label>
          <Evidencias itemId={editando?.id ?? null} />
        </div>
        <div className="opLinhaAcoes">
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={salvar} disabled={travado}>Salvar item</button>
          {editando ? <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={() => { setForm(VAZIO); aoCancelar(); }}>Cancelar edição</button> : null}
          <span className="sjMini">{status}</span>
          {travado ? <span className="sjMini opWarn">🔒 {monthKeyLabel(form.dataIdentificacao.slice(0, 7))} fechado — peça pro diretor reabrir.</span> : null}
        </div>
      </div>
    </details>
  );
}
