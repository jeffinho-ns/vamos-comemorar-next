"use client";

import { useState } from "react";
import type { ZigAoVivo } from "../zigValor";
import { mensagemErro, postArea } from "./apiArea";
import { Badge, BotaoAcao, Cartao } from "./Cartao";
import { brl, fmtData, fmtDma, hojeSp } from "./formato";
import { MOTIVO, PAGAMENTO, SETOR, TURNOS, setorLabel, type PedidoFreelancer } from "./freelancerTipos";

type Dia = NonNullable<NonNullable<ZigAoVivo["escala"]>["dias"]>[number];

function diaPara(zig: ZigAoVivo | null, date: string): Dia | null {
  const base = zig?.escala?.dias || [];
  const exato = base.find((d) => d.date === date);
  if (exato) return exato;
  const nome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date(`${date}T12:00:00`).getDay()];
  const modelo = base.find((d) => d.dia === nome);
  return modelo ? { ...modelo, date } : null;
}

/** "Solicitação de freelancers (avulsa)" — formulário real + lista com presença/apagar (submitFreelancerRequest, markFreelancerAttendance, deleteFreelancerRequest). */
export function FreelancerAvulsa({ zig, pedidos, aoSalvar, recarregar }: { zig: ZigAoVivo | null; pedidos: PedidoFreelancer[]; aoSalvar: () => void; recarregar: () => void }) {
  const [data, setData] = useState(hojeSp());
  const [setor, setSetor] = useState("salao");
  const [motivo, setMotivo] = useState("demanda");
  const [turno, setTurno] = useState(8);
  const [aus, setAus] = useState(0);
  const [qtd, setQtd] = useState(1);
  const [nota, setNota] = useState("");
  const [status, setStatus] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [statusLote, setStatusLote] = useState("");
  const dia = diaPara(zig, data);
  const visiveis = pedidos.slice(0, 80);

  async function solicitar() {
    if (!data) { setStatus("Escolha uma data."); return; }
    const s = dia?.setores.find((x) => x.chave === setor);
    if (s?.limite) {
      const clt = Math.max(0, s.fixa - aus);
      const ja = pedidos.filter((p) => p.date === data && p.sector === setor && p.status !== "recusado" && p.attendance !== "faltou").reduce((t, p) => t + (Number(p.qty) || 0), 0);
      if (clt + ja + qtd > s.limite) { setStatus(`Acima do limite de brigada: ${setorLabel(setor)} tem limite de ${s.limite} pessoas ao mesmo tempo (hoje ${clt} fixos + ${ja} freelancer(s) já pedidos).`); return; }
    }
    setStatus("Enviando…");
    const r = await postArea("/justino/operacao/freelancers/solicitar", { date: data, sector: setor, reason: motivo, shiftHours: turno, qty: qtd, note: nota });
    if (r.ok) { setStatus("Solicitado — aguardando aprovação do RH."); setQtd(1); setNota(""); aoSalvar(); recarregar(); } else setStatus(mensagemErro(r.error, "Não consegui enviar."));
  }
  async function presenca(id: string, attended: boolean) {
    if (!window.confirm(attended ? "Confirmar que o freelancer compareceu?" : "Confirmar que o freelancer FALTOU? Isso tira o custo dele da conta.")) return;
    const r = await postArea("/justino/operacao/freelancers/presenca", { id, attended });
    if (r.ok) { aoSalvar(); recarregar(); } else setStatusLote(mensagemErro(r.error, "Não consegui registrar a presença."));
  }
  async function apagar(id: string) {
    if (!window.confirm("Apagar essa solicitação de freelancer? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return;
    const r = await postArea("/justino/operacao/freelancers/apagar", { id });
    if (r.ok) { aoSalvar(); recarregar(); } else setStatusLote(mensagemErro(r.error, "Não consegui apagar."));
  }
  async function apagarSelecionados() {
    const ids = Array.from(selecionados);
    if (!ids.length) { setStatusLote("Marque pelo menos uma solicitação."); return; }
    if (!window.confirm(`Apagar ${ids.length} solicitação(ões) selecionada(s)? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    let ok = 0;
    for (const id of ids) {
      setStatusLote(`Apagando… (${ok}/${ids.length})`);
      const r = await postArea("/justino/operacao/freelancers/apagar", { id });
      if (r.ok) ok += 1;
    }
    setSelecionados(new Set());
    setStatusLote(`${ok} apagada(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`);
    aoSalvar(); recarregar();
  }
  function alternar(id: string, marcado: boolean) {
    setSelecionados((a) => { const n = new Set(a); if (marcado) n.add(id); else n.delete(id); return n; });
  }

  return (
    <Cartao titulo="Solicitação de freelancers (avulsa)">
      <div className="sjRole"><h3>Solicitação de freelancers (avulsa)</h3><span><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button> <span className="sjBadgeP">APROVAÇÃO RH</span></span></div>
      <p className="sjNote"><b>Use esta só pra reforço de última hora</b> — pro planejamento normal da semana, use a &quot;Solicitação semanal de freelancers&quot; (Operação). Peça um freelancer específico, por dia, setor e turno — cada pedido vai pra aprovação do RH. Depois que o dia passar, confirme aqui quem realmente compareceu: isso é o que conta no custo (falta não entra na conta). Quando o dia ainda não tem reserva lançada, a sugestão usa a média histórica daquele dia da semana (marcado &quot;méd. hist.&quot; na tabela abaixo) em vez de sair zerada.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Data<input className="sjInput" type="date" value={data} onChange={(e) => setData(e.target.value)} /></label></div>
        <div className="sjTb"><label>Setor<select className="sjInput" value={setor} onChange={(e) => setSetor(e.target.value)}>{Object.entries(SETOR).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label></div>
        <div className="sjTb"><label>Motivo<select className="sjInput" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{Object.entries(MOTIVO).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label></div>
        <div className="sjTb"><label>Turno<select className="sjInput" value={turno} onChange={(e) => setTurno(Number(e.target.value))}>{TURNOS.map((h) => <option key={h} value={h}>{h}h — R$ {PAGAMENTO[h]}</option>)}</select></label></div>
        <div className="sjTb"><label>CLT ausente hoje (folga/férias/falta)<input className="sjInput" type="number" min={0} value={aus} onChange={(e) => setAus(Math.max(0, Number(e.target.value) || 0))} /></label></div>
        <div className="sjTb"><label>Quantidade<input className="sjInput" type="number" min={1} value={qtd} onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))} /></label></div>
        <button type="button" className="sjAnaliseBtn" onClick={solicitar}>Solicitar</button>
        <span className="sjMini">{status}</span>
      </div>
      <h3 className="sjFormTitulo" style={{ fontSize: 14 }}>Sugestão de extras por setor — quadro mínimo do RH × reservas do dia ({data ? fmtDma(data) : "escolha uma data"})</h3>
      <p className="sjMini" style={{ marginBottom: 6 }}>Linha destacada = setor selecionado acima, usando o &quot;CLT ausente hoje&quot; informado. Nos demais setores a ausência é considerada 0 — troque o setor pra ajustar ausência de outra equipe.</p>
      {dia && !dia.fechado ? <p className="sjAlertG">Público esperado nesse dia: {dia.pax.toLocaleString("pt-BR")} pessoas{dia.fonte.includes("média") ? " (méd. hist.)" : ""}.</p> : null}
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr><th>Brigada padrão</th><th>Setor</th><th>Necessário no pico</th><th>Equipe fixa hoje</th><th>Ausências</th><th>Freelancers a contratar</th></tr></thead>
          <tbody>
            {dia && !dia.fechado ? dia.setores.map((s) => {
              const marcado = s.chave === setor;
              const a = marcado ? aus : 0;
              const ajustado = s.manual ? 0 : Math.max(0, Math.max(s.necessario, s.brigada) - Math.max(0, s.fixa - a));
              return <tr key={s.chave} className={marcado ? "sjLinhaSel" : undefined}><td>{s.brigada}</td><td>{s.label}{marcado ? " ▶" : ""}</td><td>{s.necessario}</td><td>{Math.max(0, s.fixa - a)}</td><td>{a}</td><td><b>{ajustado}</b></td></tr>;
            }) : <tr><td colSpan={6} className="sjMini">{dia?.fechado ? "Casa fechada nesse dia (Manual)." : "Escolha data e setor acima."}</td></tr>}
          </tbody>
        </table>
      </div>
      <label className="sjFormBloco"><b>Observação (opcional)</b><textarea className="sjInput" rows={2} placeholder="Motivo, evento, cobertura de folga, etc." value={nota} onChange={(e) => setNota(e.target.value)} /></label>
      <div className="opLinhaAcoes" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0, background: "#3a1620", borderColor: "#5c2530" }} onClick={apagarSelecionados}>🗑 Apagar selecionados</button>
        <span className="sjMini">{statusLote}</span>
      </div>
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr><th>Data</th><th>Setor</th><th>Motivo</th><th>Turno</th><th>Qtd</th><th>Custo</th><th>Status</th><th>Presença</th><th>Ação</th><th><input type="checkbox" className="opCheck" title="Selecionar todos" checked={visiveis.length > 0 && visiveis.every((p) => selecionados.has(p.id))} onChange={(e) => setSelecionados(e.target.checked ? new Set(visiveis.map((p) => p.id)) : new Set())} /></th></tr></thead>
          <tbody>
            {visiveis.length ? visiveis.map((p) => (
              <tr key={p.id}>
                <td>{fmtData(p.date)}</td><td>{setorLabel(p.sector)}</td><td className="sjMini">{MOTIVO[p.reason] ?? p.reason ?? "—"}</td><td>{p.shiftHours}h</td><td>{p.qty}</td><td>{brl(p.totalCost)}</td>
                <td><Badge nivel={p.status === "aprovado" ? "g" : p.status === "recusado" ? "r" : "y"}>{p.status}</Badge></td>
                <td>{p.status !== "aprovado" ? <span className="sjMini">—</span> : p.attendance ? <Badge nivel={p.attendance === "compareceu" ? "g" : "r"}>{p.attendance}</Badge> : <span className="opAcoes" style={{ justifyContent: "flex-start" }}><BotaoAcao onClick={() => presenca(p.id, true)}>Compareceu</BotaoAcao><BotaoAcao perigo onClick={() => presenca(p.id, false)}>Faltou</BotaoAcao></span>}</td>
                <td><BotaoAcao perigo onClick={() => apagar(p.id)}>Apagar</BotaoAcao></td>
                <td><input type="checkbox" className="opCheck" checked={selecionados.has(p.id)} onChange={(e) => alternar(p.id, e.target.checked)} /></td>
              </tr>
            )) : <tr><td colSpan={10} className="sjMini">Nenhuma solicitação ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}
