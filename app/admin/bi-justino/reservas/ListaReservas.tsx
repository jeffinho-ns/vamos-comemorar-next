"use client";

import { useState } from "react";
import { mensagemErro, postArea } from "../operacao/apiArea";
import { BotaoAcao, Cartao } from "../operacao/Cartao";
import type { FechamentoMes } from "../operacao/FecharMes";
import { mesFechado } from "../operacao/FecharMes";
import { fmtData, fmtHora } from "../operacao/formato";
import type { BiLiveData } from "../useBiLive";
import { celulaReserva } from "../tabelasReais";
import { RESERVA_FONTE_LABEL, RESERVA_ORIGEM_LABEL, RESERVATION_TIPO_LABEL, parseConvidados, reservaSoDionisio, type ReservaEntry } from "./tipos";

function abrirListaConvidados(e: ReservaEntry) {
  const nomes = parseConvidados(e.convidados);
  const w = window.open("", "_blank");
  if (!w) return "O navegador bloqueou a janela — libere pop-ups pra abrir a lista.";
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lista de convidados — ${esc(e.nomeCliente || "Reserva")}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h1{font-size:20px;margin-bottom:2px}.meta{color:#555;margin-bottom:18px;font-size:13px}ol{columns:2;column-gap:40px;font-size:15px;line-height:1.9}li{break-inside:avoid}button{margin-top:22px;padding:9px 16px;font-size:14px;cursor:pointer}@media print{button{display:none}}</style></head><body><h1>Lista de convidados</h1><div class="meta">${esc(e.nomeCliente || "—")} • ${fmtData(e.date)} • ${RESERVATION_TIPO_LABEL[e.tipo] ?? e.tipo} • ${nomes.length} nome(s), em ordem alfabética</div><ol>${nomes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol><button onclick="window.print()">🖨 Imprimir</button></body></html>`);
  w.document.close();
  return "";
}

/** Lista unificada: Dionísio + Agilizaiapp (`/admin/restaurant-reservations`), duplicata conta uma vez. */
export function ListaReservas({ entradas, fechamentos, diretoria, live, aoEditar, aoMudar, recarregar }: { entradas: ReservaEntry[]; fechamentos: FechamentoMes[]; diretoria: boolean; live: BiLiveData | null; aoEditar: (e: ReservaEntry) => void; aoMudar: () => void; recarregar: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const apagaveis = entradas.filter(reservaSoDionisio);

  async function apagar(id: string, confirmar = true) {
    if (confirmar && !window.confirm("Apagar essa reserva? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return false;
    const r = await postArea("/justino/reservas/apagar", { id });
    if (!r.ok) setStatus(mensagemErro(r.error, "Não consegui apagar."));
    return r.ok;
  }
  async function apagarSelecionadas() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatus("Marque pelo menos uma reserva do Dionísio."); return; }
    if (!window.confirm(`Apagar ${ids.length} reserva(s) do Dionísio? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagar(id, false)) ok += 1; setStatus(`Apagando… (${ok}/${ids.length})`); }
    setSel(new Set());
    setStatus(`${ok} apagada(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`);
    aoMudar();
  }
  const colunasBanco = ["Data", "Cliente", "Telefone", "Pax", "Tipo", "Hora", "Observação", "Enviado por"];
  const quando = live?.recentesEm === "hoje" ? "Hoje" : (live?.recentesEm ?? "—");

  return (
    <Cartao titulo="Lista de reservas" aberto={false}>
      <div className="sjRole">
        <h3>Lista de reservas</h3>
        <span className="opLinhaAcoes" style={{ marginTop: 0 }}>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={() => window.print()}>🖨 Imprimir</button>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionadas}>🗑 Apagar selecionadas</button>
          <span className="sjMini">{status}</span>
        </span>
      </div>
      <p className="sjNote">Junta as reservas do <b>Agilizaiapp</b> (página de reservas do restaurante) com as do <b>Dionísio</b>. Se a mesma pessoa estiver nos dois, conta uma vez (telefone + data). Edição e exclusão daqui só valem para o que ainda está só no Dionísio.</p>
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr><th>Fonte</th><th>Data</th><th>Cliente</th><th>Telefone</th><th>E-mail</th><th>Pax</th><th>Tipo</th><th>Observação</th><th>Enviado por</th><th>Hora</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar as do Dionísio" checked={apagaveis.length > 0 && apagaveis.every((e) => sel.has(e.id))} onChange={(e) => setSel(e.target.checked ? new Set(apagaveis.map((x) => x.id)) : new Set())} /></th></tr></thead>
          <tbody>
            {entradas.length ? entradas.map((e) => {
              const nomes = parseConvidados(e.convidados);
              const travada = !diretoria && mesFechado(fechamentos, e.date);
              const soDionisio = reservaSoDionisio(e);
              const fonte = e.fonte && RESERVA_FONTE_LABEL[e.fonte] ? RESERVA_FONTE_LABEL[e.fonte] : "Dionísio";
              return (
                <tr key={e.id}>
                  <td><span className="sjMini">{fonte}</span></td>
                  <td>{fmtData(e.date)}{e.hora ? <><br /><span className="sjMini">chega {e.hora}</span></> : null}</td>
                  <td>{e.nomeCliente || "—"}</td><td className="sjMini">{e.telefone || "—"}</td><td className="sjMini">{e.email || "—"}</td><td>{e.pax}</td>
                  <td>{RESERVATION_TIPO_LABEL[e.tipo] ?? e.tipo}{e.origem ? <><br /><span className="sjMini">{RESERVA_ORIGEM_LABEL[e.origem] ?? e.origem}</span></> : null}</td>
                  <td className="sjMini">{e.observacao || "—"}</td><td className="sjMini">{e.submittedByName || "—"}</td><td>{fmtHora(e.submittedAt)}</td>
                  <td><div className="opAcoes">
                    {nomes.length ? <BotaoAcao destaque onClick={() => { const m = abrirListaConvidados(e); if (m) setStatus(m); }}>👥 Lista ({nomes.length})</BotaoAcao> : null}
                    {soDionisio ? (travada ? <span className="sjMini">🔒 mês fechado</span> : <><BotaoAcao onClick={() => aoEditar(e)}>Editar</BotaoAcao><BotaoAcao perigo onClick={async () => { if (await apagar(e.id)) aoMudar(); }}>Apagar</BotaoAcao></>) : <span className="sjMini">{e.fonte === "ambos" ? "já no Agilizaiapp" : "gerida no Agilizaiapp"}</span>}
                  </div></td>
                  <td>{soDionisio ? <input type="checkbox" className="opCheck" checked={sel.has(e.id)} onChange={(ev) => setSel((a) => { const n = new Set(a); if (ev.target.checked) n.add(e.id); else n.delete(e.id); return n; })} /> : null}</td>
                </tr>
              );
            }) : <tr><td colSpan={12} className="sjMini">Sem reservas ainda.</td></tr>}
          </tbody>
        </table>
      </div>
      <h3 className="sjFormTitulo" style={{ fontSize: 14 }}>Check-in ao vivo no Agilizaiapp • {quando}</h3>
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr>{colunasBanco.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {live?.recentes?.length ? live.recentes.map((row) => <tr key={row.id}>{colunasBanco.map((c) => <td key={c}>{celulaReserva(c, row, quando)}</td>)}</tr>) : <tr><td colSpan={colunasBanco.length} className="sjMini">Ainda sem reservas recentes no banco.</td></tr>}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}
