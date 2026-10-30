"use client";

import { useMemo, useState } from "react";
import { CONTEUDO } from "../conteudo";
import { Badge, Cartao, Nota } from "../operacao/Cartao";
import { fmtData, fmtDataHora, fmtHora } from "../operacao/formato";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import "../operacao/operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

interface LinhaAudit { at: string; byEmail: string; action: string; area: string; kind: string; refId: string; summary: string }
interface LinhaDelecao { deletedAt: string; deletedByEmail: string; kind: string; refDate: string; area: string; summary: string; payload?: { email?: string } }
interface Usuario { email: string; role: "owner" | "user"; areas: string }

const CHAVES = ["getAuditLog", "getDeletionsLog", "getUsersList"];
const AUDIT_AREA_LABEL: Record<string, string> = { master: "Diretoria", marketing: "Marketing", financeiro: "Financeiro", rh: "RH", operacao: "Gerente Operador", cmv: "CMV", reservas: "Reservas", geral: "Geral" };
const AUDIT_ACTION_LABEL: Record<string, string> = { create: "Criar", update: "Editar/salvar", delete: "Apagar" };
const ACTION_BADGE: Record<string, "g" | "b" | "r"> = { create: "g", update: "b", delete: "r" };
const DELETION_KIND_LABEL: Record<string, string> = { entry: "Envio diário", mkplan: "Projeção marketing", user: "Acesso ao BI", freelancer: "Solicitação de freelancer", reservation: "Reservas do dia" };
const TAB_AREAS = ["master", "marketing", "financeiro", "rh", "operacao", "cmv", "reservas", "eventos", "documentos", "auditoria", "auditoriaop"];
const TAB_AREA_LABEL: Record<string, string> = { master: "Diretoria", marketing: "Marketing", financeiro: "Financeiro", rh: "RH", operacao: "Gerente Operador", cmv: "CMV", reservas: "Reservas", eventos: "Eventos", documentos: "Documentações", auditoria: "Histórico Sistema", auditoriaop: "Auditoria Operacional" };

export function AuditoriaSistemaPagina({ subId, onSub }: PaginaEspelhoProps) {
  const abas = CONTEUDO.auditoria ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const log = (payloadDe<{ items?: LinhaAudit[] }>(dados, "getAuditLog")?.items ?? []).slice(0, 300);
  const delecoes = payloadDe<{ items?: LinhaDelecao[] }>(dados, "getDeletionsLog")?.items ?? [];
  const usuarios = payloadDe<{ users?: Usuario[] }>(dados, "getUsersList")?.users ?? [];
  const [fArea, setFArea] = useState("");
  const [fAcao, setFAcao] = useState("");
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(6);
  const areas = useMemo(() => Array.from(new Set(log.map((x) => x.area).filter(Boolean))).sort(), [log]);
  const lista = log.filter((x) => (!fArea || x.area === fArea) && (!fAcao || x.action === fAcao));
  const totalPaginas = Math.max(1, Math.ceil(delecoes.length / tamanho));
  const pag = Math.min(pagina, totalPaginas - 1);
  const visiveis = delecoes.slice(pag * tamanho, pag * tamanho + tamanho);

  return (
    <>
      {abas.length > 1 ? <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div> : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="auditoria" className="sjStage">
        <div className="sjGrid">
          <Nota><b>Histórico Sistema</b> — trilha de quem criou, editou ou apagou o quê, em toda área do BI. Não é editável, só consulta.</Nota>
          <Cartao titulo="Log de auditoria">
            <div className="sjRole"><h3>Log de auditoria</h3><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button></div>
            <p className="sjNote">Toda ação de criar, editar ou apagar em qualquer área fica aqui — quem fez, quando, o quê. Só consulta, não dá pra editar/apagar um registro de auditoria por aqui. Mostra os 300 mais recentes. Pra ver só as exclusões, com paginação, use o &quot;Histórico de exclusões&quot; logo abaixo.</p>
            <div className="sjToolbar">
              <div className="sjTb"><label>Área<select className="sjInput" value={fArea} onChange={(e) => setFArea(e.target.value)}><option value="">Todas</option>{areas.map((a) => <option key={a} value={a}>{AUDIT_AREA_LABEL[a] ?? a}</option>)}</select></label></div>
              <div className="sjTb"><label>Ação<select className="sjInput" value={fAcao} onChange={(e) => setFAcao(e.target.value)}><option value="">Todas</option><option value="create">Criar</option><option value="update">Editar/salvar</option><option value="delete">Apagar</option></select></label></div>
            </div>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Área</th><th>Tipo</th><th>O que mudou</th></tr></thead>
                <tbody>
                  {lista.length ? lista.map((x, i) => (
                    <tr key={`${x.at}-${i}`}><td className="sjMini">{fmtDataHora(x.at)}</td><td className="sjMini">{x.byEmail || "—"}</td><td><Badge nivel={ACTION_BADGE[x.action] ?? "y"}>{AUDIT_ACTION_LABEL[x.action] ?? x.action}</Badge></td><td className="sjMini">{AUDIT_AREA_LABEL[x.area] ?? x.area ?? "—"}</td><td className="sjMini">{x.kind || "—"}</td><td>{x.summary || "—"}</td></tr>
                  )) : <tr><td colSpan={6} className="sjMini">Nenhum registro ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
          <Cartao titulo="Histórico de exclusões" aberto={false}>
            <div className="sjRole"><h3>Histórico de exclusões</h3><span className="opLinhaAcoes" style={{ marginTop: 0 }}><label className="sjMini">Por página <select className="sjInput" style={{ width: 70 }} value={tamanho} onChange={(e) => { setTamanho(Number(e.target.value)); setPagina(0); }}>{[6, 12, 24, 48].map((n) => <option key={n} value={n}>{n}</option>)}</select></label><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => setPagina(Math.max(0, pag - 1))}>‹</button><span className="sjMini">{delecoes.length ? `Página ${pag + 1} de ${totalPaginas} • ${delecoes.length} registro(s)` : "—"}</span><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => setPagina(Math.min(totalPaginas - 1, pag + 1))}>›</button></span></div>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>Quando</th><th>Quem</th><th>Tipo</th><th>Referência</th><th>Resumo</th></tr></thead>
                <tbody>
                  {visiveis.length ? visiveis.map((it, i) => (
                    <tr key={`${it.deletedAt}-${i}`}><td>{fmtHora(it.deletedAt)}</td><td>{it.deletedByEmail}</td><td>{DELETION_KIND_LABEL[it.kind] ?? it.kind}</td><td>{it.kind === "user" ? (it.payload?.email || "—") : it.refDate ? fmtData(it.refDate) : "—"}</td><td className="sjMini">{it.summary}</td></tr>
                  )) : <tr><td colSpan={5} className="sjMini">Nenhuma exclusão registrada ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
          <Cartao titulo="Acessos ao BI (somente leitura)" aberto={false}>
            <div className="sjRole"><h3>Acessos ao BI</h3><span className="sjMini">Criar, redefinir ou apagar acesso continua só no painel do Seu Justino — bloqueado de propósito aqui.</span></div>
            <div className="sjTableInner opTabela">
              <table>
                <thead><tr><th>E-mail</th><th>Perfil</th><th>Áreas</th></tr></thead>
                <tbody>
                  {usuarios.length ? usuarios.map((u) => {
                    const lista2 = u.areas === "all" ? TAB_AREAS : (u.areas ? u.areas.split(",").filter(Boolean) : []);
                    return <tr key={u.email}><td>{u.email}</td><td>{u.role === "owner" ? <Badge nivel="b">admin</Badge> : "user"}</td><td className="sjMini">{u.role === "owner" ? "todas (admin)" : lista2.map((a) => TAB_AREA_LABEL[a] ?? a).join(", ") || "—"}</td></tr>;
                  }) : <tr><td colSpan={3} className="sjMini">Nenhum acesso na cópia do banco.</td></tr>}
                </tbody>
              </table>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
