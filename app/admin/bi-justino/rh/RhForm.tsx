"use client";

import { useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Badge, Campo, ItemBarra } from "../financeiro/ui";
import { brl, brl2, fmtTime, isMonthClosedFor, mesAnterior, monthKeyLabel, parseBRL, type EntryDoc, type MapasZig, type MonthClosure } from "../financeiro/comum";
import type { Employee } from "./rhTipos";
import { horasExtrasDoMes, resumoAtivos, servicoDoMes } from "./rhCalc";

/** Campos digitados (texto cru, igual ao input do HTML); convertidos com parseBRL na hora de usar. */
export interface RascunhoRh {
  rhCore: string;
  rhExtras: string;
  rhHead: string;
  rhServicoDesconto: string;
}
export const RASCUNHO_VAZIO: RascunhoRh = { rhCore: "", rhExtras: "", rhHead: "", rhServicoDesconto: "" };

/**
 * Quadro "RH estrutural carregado • EDIÇÃO DA ÁREA": mês de referência, enviado por, RH estrutural (soma automática
 * dos colaboradores ativos), extras, HE + adicional noturno, colaboradores ativos, serviço do mês, Editar/Salvar e Fechar mês.
 */
export function RhForm({
  mes,
  onMes,
  employees,
  zig,
  envioDoMes,
  closures,
  freelancerCost,
  rascunho,
  onRascunho,
  editando,
  onEditando,
  onSalvo,
}: {
  mes: string;
  onMes: (mk: string) => void;
  employees: Employee[];
  zig: MapasZig;
  envioDoMes: EntryDoc | null;
  closures: MonthClosure[];
  freelancerCost: number;
  rascunho: RascunhoRh;
  onRascunho: (r: RascunhoRh) => void;
  editando: boolean;
  onEditando: (on: boolean) => void;
  onSalvo: () => void;
}) {
  const [enviadoPor, setEnviadoPor] = useState("");
  const [status, setStatus] = useState("");
  const [statusSalvar, setStatusSalvar] = useState("");
  const [statusMes, setStatusMes] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const ativos = resumoAtivos(employees);
  const automatico = ativos.quantidade > 0 && !editando;
  const he = horasExtrasDoMes(employees, mes);
  const desconto = Math.max(0, parseBRL(rascunho.rhServicoDesconto));
  const servico = servicoDoMes(zig, mes, desconto);
  const fechado = isMonthClosedFor(closures, "rh", mes);
  const anterior = mesAnterior(mes);
  const anteriorPendente = !isMonthClosedFor(closures, "rh", anterior);
  const fechados = closures.filter((c) => c.area === "rh").sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
  const rhCore = automatico ? ativos.total : parseBRL(rascunho.rhCore);
  const rhHead = automatico ? ativos.quantidade : Math.max(0, Math.round(Number(rascunho.rhHead) || 0));

  function campo(nome: keyof RascunhoRh, valor: string) {
    onRascunho({ ...rascunho, [nome]: valor });
  }

  async function salvar() {
    const values = { rhCore, rhExtras: parseBRL(rascunho.rhExtras), rhHead, rhServicoDesconto: desconto };
    if (!Object.values(values).some((v) => v !== 0)) {
      setStatusSalvar("Falta preencher para enviar.");
      return;
    }
    setOcupado(true);
    setStatusSalvar("Salvando…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/envio/rh", { date: mes, values, submittedByName: enviadoPor.trim() });
    setOcupado(false);
    if (r.ok) {
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setStatus(`Enviado às ${hora}`);
      setStatusSalvar(`Salvo às ${hora}.`);
      onEditando(false);
      onSalvo();
    } else {
      const msg = r.json?.error === "month_closed" ? "🔒 Mês fechado — peça pro diretor reabrir." : "Falha ao enviar, tenta de novo.";
      setStatus(msg);
      setStatusSalvar(msg);
    }
  }

  function limpar() {
    if (!window.confirm("Apagar os dados digitados nesta aba? Isso não apaga um envio que já foi enviado antes, só limpa o formulário na tela.")) return;
    onRascunho(RASCUNHO_VAZIO);
    setEnviadoPor("");
    setStatus("Dados digitados apagados.");
  }

  async function fecharMes(acao: "fechar" | "reabrir", monthKey: string) {
    if (acao === "fechar" && isMonthClosedFor(closures, "rh", monthKey)) {
      setStatusMes(`${monthKeyLabel(monthKey)} já está fechado.`);
      return;
    }
    const pergunta = acao === "fechar"
      ? `Fechar ${monthKeyLabel(monthKey)} em RH? Ninguém (menos o diretor) vai conseguir enviar, editar ou apagar envio desse mês até alguém reabrir.`
      : `Reabrir ${monthKeyLabel(monthKey)} em RH? A equipe volta a poder enviar/editar/apagar esse mês.`;
    if (!window.confirm(pergunta)) return;
    setStatusMes(acao === "fechar" ? "Fechando…" : "Reabrindo…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/rh/mes", { acao, monthKey });
    if (r.ok) {
      setStatusMes(`${monthKeyLabel(monthKey)} ${acao === "fechar" ? "fechado" : "reaberto"} em RH.`);
      onSalvo();
    } else {
      setStatusMes(r.json?.error === "forbidden" ? "Só o diretor pode reabrir um mês." : `Não consegui ${acao} o mês.`);
    }
  }

  const statusPadrao = envioDoMes
    ? `Enviado em ${monthKeyLabel(mes)} às ${fmtTime(envioDoMes.submittedAt)}${envioDoMes.submittedByName ? ` por ${envioDoMes.submittedByName}` : ""}`
    : "Ainda não enviado esse mês";

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>RH estrutural carregado</h3><Badge nivel="p">EDIÇÃO DA ÁREA</Badge></div>
      <div className="sjFaixaMes">Mês de referência: {monthKeyLabel(mes)}</div>
      {anteriorPendente ? (
        <div className="sjAviso">⚠️ <b>{monthKeyLabel(anterior)}</b> ainda não foi fechado em RH — confira os dados desse mês e feche antes de seguir preenchendo {monthKeyLabel(mes)}.</div>
      ) : null}
      <div className="sjToolbar">
        <ItemBarra rotulo="Mês de referência"><input type="month" className="sjInput" value={mes} onChange={(e) => e.target.value && onMes(e.target.value)} /></ItemBarra>
        <ItemBarra rotulo="Enviado por"><input type="text" className="sjInput" placeholder="Seu nome" value={enviadoPor} onChange={(e) => setEnviadoPor(e.target.value)} /></ItemBarra>
        <button type="button" className="sjBtn sjBtnR" onClick={limpar}>🗑 Apagar dados digitados</button>
        <span className="sjMini">{status || statusPadrao}</span>
        {fechado ? <span className="sjMini sjAvisoRed">🔒 {monthKeyLabel(mes)} está fechado em RH — só o diretor consegue enviar.</span> : null}
      </div>

      <Campo titulo="RH estrutural carregado" ajudaTitulo={<>Salários + PJ + encargos + benefícios, sem comissão, segurança e extras. <b>Soma automática</b> dos colaboradores ativos.</>} ajuda={<>Média DRE usada: <b>R$ 104,7 mil</b> • saudável até <b>15% da receita</b></>}>
        <input className={`sjInput${automatico ? " sjInputRo" : ""}`} type="text" inputMode="decimal" readOnly={automatico} value={automatico ? brl2(ativos.total) : rascunho.rhCore} placeholder="0,00" onChange={(e) => campo("rhCore", e.target.value)} title={automatico ? `Soma automática do Valor Total de ${ativos.quantidade} colaborador(es) ativo(s) — edite em Colaboradores.` : undefined} />
      </Campo>
      <Campo titulo="Extras / freelancers" ajuda={<>Média DRE ≈ <b>R$ 26,4 mil</b> • saudável ≤ <b>4% da receita</b><br />{freelancerCost ? <span>+ {brl(freelancerCost)} de freelancers aprovados este mês (somado automático no total, sem precisar digitar)</span> : null}</>}>
        <input className="sjInput" type="text" inputMode="decimal" value={rascunho.rhExtras} placeholder="0,00" onChange={(e) => campo("rhExtras", e.target.value)} />
      </Campo>
      <Campo titulo="Horas extras + adicional noturno" ajudaTitulo={<>Valor pago no fechamento do mês de referência, vindo da ficha de cada colaborador. <b>Automático</b>.</>} ajuda={he.quantidade
        ? `Horas extras ${brl(he.he)} + adicional noturno ${brl(he.an)} • ${he.quantidade} colaborador${he.quantidade === 1 ? "" : "es"} com ficha de ${monthKeyLabel(mes)}${he.semMes ? ` • ${he.semMes} sem mês de referência não entraram` : ""} • já incluído no RH estrutural.`
        : `Nenhuma ficha de colaborador com mês de referência ${monthKeyLabel(mes)} ainda${he.semMes ? ` (${he.semMes} sem mês de referência)` : ""}.`}>
        <input className="sjInput sjInputRo" type="text" readOnly placeholder="R$ 0,00" value={he.quantidade ? brl(he.he + he.an) : "—"} />
      </Campo>
      <Campo titulo="Colaboradores ativos" ajuda={automatico ? `${ativos.detalhe} — contagem automática dos ativos em Colaboradores.` : "Contagem automática de todos os ativos cadastrados em Colaboradores (CLT, INT e PJ)."}>
        <input className={`sjInput${automatico ? " sjInputRo" : ""}`} type="number" step={1} readOnly={automatico} value={automatico ? String(ativos.quantidade) : rascunho.rhHead} onChange={(e) => campo("rhHead", e.target.value)} />
      </Campo>
      <Campo titulo="Serviço do mês" ajudaTitulo="Taxa de serviço cobrada no mês de referência da ZigPay, e desconto a abater." ajuda={servico.dias
        ? `Puxado da ZigPay, mês de referência ${servico.mk.slice(5)}/${servico.mk.slice(0, 4)} (${servico.dias} dia(s), até ${servico.ultimoDia}/${servico.mk.slice(5)})${servico.ref ? " — mês de referência ainda sem captura, usando o mais recente" : ""}. O robô atualiza todo dia às 8h.${desconto ? ` Líquido após desconto: ${brl(servico.liquido)}.` : ""}`
        : "Sem taxa de serviço capturada ainda."}>
        <div className="sjCampoInline">
          <input className="sjInput sjInputRo" type="text" readOnly title="Serviço do mês (ZigPay, automático)" placeholder="Serviço" value={servico.dias ? servico.bruto.toFixed(2) : ""} />
          <input className="sjInput" type="text" inputMode="decimal" title="Desconto sobre o serviço (R$)" placeholder="Desconto (R$)" value={rascunho.rhServicoDesconto} onChange={(e) => campo("rhServicoDesconto", e.target.value)} />
        </div>
      </Campo>
      <div className="sjLinhaAcoes">
        {editando
          ? <button type="button" className="sjBtn sjBtnR" onClick={() => { onEditando(false); setStatusSalvar(""); }}>Cancelar edição</button>
          : <button type="button" className="sjBtn" onClick={() => { onEditando(true); onRascunho({ ...rascunho, rhCore: ativos.total.toFixed(2), rhHead: String(ativos.quantidade) }); setStatusSalvar("Editando — ajuste os valores e clique em Salvar."); }}>✏️ Editar</button>}
        <button type="button" className="sjBtn sjBtnAccent" disabled={ocupado} onClick={salvar}>💾 Salvar</button>
        <span className="sjMini">{statusSalvar}</span>
      </div>
      <hr className="sjSep" />
      <div className="sjToolbar">
        <button type="button" className="sjBtn sjBtnLaranja" onClick={() => fecharMes("fechar", mes)}>📅 Fechar mês ({monthKeyLabel(mes)})</button>
        <span className="sjMini">{statusMes}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {fechados.length ? fechados.map((c) => (
          <div key={c.id} className="sjMini" style={{ padding: "2px 0" }}>
            🔒 <b>{monthKeyLabel(c.monthKey)}</b> — fechado por {c.closedByEmail} em {fmtTime(c.closedAt)}{" "}
            <button type="button" className="sjBtn sjBtnP sjBtnLaranja" onClick={() => fecharMes("reabrir", c.monthKey)}>🔓 Reabrir</button>
          </div>
        )) : <span className="sjMini">Nenhum mês fechado ainda.</span>}
      </div>
    </section>
  );
}
