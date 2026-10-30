"use client";

import { useMemo, useState } from "react";
import type { ZigAoVivo } from "../zigValor";
import { mensagemErro, postArea } from "./apiArea";
import { Cartao } from "./Cartao";
import { brl, datasDaSemana, deslocarDias, diaSemana, fmtDma, hojeSp, segundaDe, MES_ABREV } from "./formato";
import { PAGAMENTO, TURNOS, type PedidoFreelancer } from "./freelancerTipos";

type Dia = NonNullable<NonNullable<ZigAoVivo["escala"]>["dias"]>[number];
type Setor = Dia["setores"][number];
type Rascunho = { qty: number; turno: number; aus: number };

const NOME_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const WG_DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function semanaEscolhida(segunda: string, base: Dia[]): Dia[] {
  return datasDaSemana(segunda).map((date) => {
    const nome = NOME_DIA[diaSemana(date)];
    const modelo = base.find((dia) => dia.dia === nome);
    if (!modelo) return { date, dia: nome, fechado: true, pax: 0, fonte: "Casa fechada", presentesPico: 0, setores: [] };
    return { ...modelo, date, dia: nome };
  });
}

function rotuloSemana(segunda: string) {
  const [ano, mes, dia] = segunda.split("-").map(Number);
  const fim = deslocarDias(segunda, 6);
  return `${Math.ceil(dia / 7)} sem.${MES_ABREV[mes - 1].toUpperCase()}/${String(ano).slice(2)} (${fmtDma(segunda).slice(0, 5)} a ${fmtDma(fim).slice(0, 5)})`;
}

function semanasDoMes(mesKey: string, segundaSel: string, hoje: string) {
  const [ano, mes] = mesKey.split("-").map(Number);
  const primeiro = `${mesKey}-01`;
  const volta = diaSemana(primeiro) === 0 ? 6 : diaSemana(primeiro) - 1;
  const inicio = deslocarDias(primeiro, -volta);
  return Array.from({ length: 6 }, (_, s) => {
    const monday = deslocarDias(inicio, s * 7);
    const days = datasDaSemana(monday).map((iso) => ({ iso, n: Number(iso.slice(8, 10)), fora: Number(iso.slice(5, 7)) !== mes || Number(iso.slice(0, 4)) !== ano, hoje: iso === hoje }));
    return { monday, days, on: monday === segundaSel };
  });
}

/** "Solicitação semanal de freelancers" — grade dia × setor com envio em lote ao RH (submitFreelancerRequestsBatch). */
export function SemanalFreelancers({ zig, pedidos, aoSalvar }: { zig: ZigAoVivo | null; pedidos: PedidoFreelancer[]; aoSalvar: () => void }) {
  const baseDias = useMemo(() => zig?.escala?.dias || [], [zig?.escala?.dias]);
  const hoje = hojeSp();
  const [segunda, setSegunda] = useState(() => segundaDe(baseDias[0]?.date || hoje));
  const [calAberto, setCalAberto] = useState(false);
  const [mesCal, setMesCal] = useState(() => segunda.slice(0, 7));
  const dias = useMemo(() => semanaEscolhida(segunda, baseDias), [segunda, baseDias]);
  const [data, setData] = useState(() => dias.find((d) => !d.fechado && d.date >= hoje)?.date || dias.find((d) => !d.fechado)?.date || dias[0]?.date || "");
  const [rascunho, setRascunho] = useState<Record<string, Rascunho>>({});
  const [status, setStatus] = useState("");
  const [conferindo, setConferindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const dia = dias.find((d) => d.date === data) || dias.find((d) => !d.fechado) || dias[0];

  const chave = (date: string, setor: string) => `${date}|${setor}`;
  const ler = (date: string, setor: Setor): Rascunho => rascunho[chave(date, setor.chave)] || { qty: 0, turno: setor.turno, aus: 0 };
  const gravar = (date: string, setor: string, proximo: Rascunho) => setRascunho((a) => ({ ...a, [chave(date, setor)]: proximo }));
  const sugestao = (setor: Setor, aus: number) => (setor.manual ? 0 : setor.sugerido + Math.min(aus, setor.fixa));

  function carregarSemana(monday: string) {
    setSegunda(monday);
    const novos = semanaEscolhida(monday, baseDias);
    setData(novos.find((d) => !d.fechado && d.date >= hoje)?.date || novos.find((d) => !d.fechado)?.date || monday);
    setCalAberto(false);
    setStatus("Semana carregada com o público e o horário da ZigPay.");
  }
  function sugerirDia() {
    if (!dia || dia.fechado) { setStatus("Casa fechada nesse dia (Manual) — nada pra sugerir."); return; }
    let n = 0;
    const proximo = { ...rascunho };
    dia.setores.forEach((setor) => {
      const aus = ler(dia.date, setor).aus;
      const qty = sugestao(setor, aus);
      proximo[chave(dia.date, setor.chave)] = { qty, turno: setor.turno, aus };
      if (qty > 0) n += 1;
    });
    setRascunho(proximo);
    setStatus(n ? `${n} setor(es) com sugestão (turno ótimo de 8 a 12h em cada um)` : "Nenhum setor precisa de reforço nesse dia.");
  }
  function zerarDia() {
    if (!dia) return;
    const proximo = { ...rascunho };
    dia.setores.forEach((setor) => { proximo[chave(dia.date, setor.chave)] = { qty: 0, turno: setor.turno, aus: ler(dia.date, setor).aus }; });
    setRascunho(proximo);
  }

  const linhasEnvio = useMemo(() => dias.flatMap((d) => d.setores.flatMap((setor) => {
    const item = rascunho[chave(d.date, setor.chave)];
    if (!item || item.qty <= 0) return [];
    return Array.from({ length: item.qty }, () => ({ date: d.date, sector: setor.chave, shiftHours: item.turno, qty: 1, reason: "demanda", label: setor.label, abre: d.abre, fecha: d.fecha }));
  })), [dias, rascunho]);
  const totalQ = linhasEnvio.length;
  const totalV = linhasEnvio.reduce((t, l) => t + (PAGAMENTO[l.shiftHours] || 0), 0);
  const cmo = zig?.escala?.cmo;
  const cmoEnviado = pedidos.filter((p) => datasDaSemana(segunda).includes(p.date) && p.status !== "recusado" && p.attendance !== "faltou").reduce((t, p) => t + (Number(p.totalCost) || 0), 0);
  const cmoTotal = cmoEnviado + totalV;
  const cmoPct = cmo?.faturamento ? (cmoTotal / cmo.faturamento) * 100 : null;
  const cmoStatus = cmoPct == null ? "semBase" : cmoPct > 8 ? "acima" : cmoPct > 6.8 ? "atencao" : "ok";

  async function enviar() {
    if (!totalQ) { setStatus("Nenhum extra solicitado ainda nesta semana."); return; }
    if (!window.confirm(`Enviar ${totalQ} freelancer(s) (${brl(totalV)}) ao RH pra aprovação?`)) return;
    setEnviando(true);
    setStatus("Enviando semana ao RH…");
    const r = await postArea("/justino/operacao/freelancers/solicitar-lote", { items: linhasEnvio.map(({ date, sector, shiftHours, qty, reason }) => ({ date, sector, shiftHours, qty, reason })) });
    setEnviando(false);
    if (r.ok) { setStatus(`${r.count ?? totalQ} pedido(s) enviado(s) ao RH — aguardando aprovação.`); setRascunho({}); setConferindo(false); aoSalvar(); } else setStatus(mensagemErro(r.error, "Não consegui enviar a semana."));
  }

  return (
    <Cartao titulo="Solicitação semanal de freelancers">
      <div className="sjRole"><h3>Solicitação semanal de freelancers</h3><span className="sjBadgeP">PREENCHIMENTO RÁPIDO</span></div>
      <p className="sjNote"><b>Um quadro só:</b> escolha a semana, clique no dia e ajuste os extras de cada setor com <b>−</b> e <b>+</b> ao lado da quantidade sugerida (a sugestão usa o mapa de calor da Zig e as reservas por horário). Antes de enviar, a <b>escala completa</b> — equipe fixa + <b>1 freelancer por linha</b>, com o horário sugerido de cada um — abre para conferência. <b>Use esta para o planejamento normal da semana</b>; a &quot;Solicitação de freelancers (avulsa)&quot; é para reforço de última hora.</p>
      <div className="sjToolbar">
        <div className="sjTb" style={{ position: "relative" }}>
          <label>Semana<button type="button" className="sjSemanaBtn" onClick={() => setCalAberto((a) => !a)}>{rotuloSemana(segunda)}</button></label>
          {calAberto ? (
            <div className="sjCalPop">
              <div className="sjCalNav">
                <button type="button" onClick={() => setMesCal(deslocarDias(`${mesCal}-01`, -1).slice(0, 7))}>‹</button>
                <span>{MES_ABREV[Number(mesCal.slice(5, 7)) - 1]}/{mesCal.slice(2, 4)}</span>
                <button type="button" onClick={() => setMesCal(deslocarDias(`${mesCal}-01`, 32).slice(0, 7))}>›</button>
              </div>
              <div className="sjCalHead"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div>
              {semanasDoMes(mesCal, segunda, hoje).map((s) => (
                <div key={s.monday} className={s.on ? "sjCalWeek on" : "sjCalWeek"} onClick={() => carregarSemana(s.monday)}>
                  {s.days.map((d) => <span key={d.iso} className={`sjCalDay${d.fora ? " fora" : ""}${d.hoje ? " hoje" : ""}`}>{d.n}</span>)}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" className="sjAnaliseBtn" onClick={() => carregarSemana(segunda)}>Carregar semana</button>
        <span className="sjMini">{status}</span>
      </div>
      <div className="sjSubs opSubsLocal">
        {dias.map((item) => {
          const qd = item.setores.reduce((t, s) => t + ler(item.date, s).qty, 0);
          return (
            <button key={item.date} type="button" className={dia?.date === item.date ? "on" : ""} onClick={() => setData(item.date)}>
              {WG_DIAS[diaSemana(item.date)]} {fmtDma(item.date).slice(0, 5)}{item.fechado ? <span className="sjMini"> fechado</span> : null}{qd ? <span className="sjBadgeG">{qd}</span> : null}
            </button>
          );
        })}
      </div>
      {dia && !dia.fechado ? (
        <p className="sjPaxBar">Pax esperado nesse dia: <b>{dia.pax.toLocaleString("pt-BR")}</b> pessoas{dia.fonte.includes("média") ? <span className="sjMini"> (méd. hist.)</span> : null}<span className="sjMini sjPaxSub">Presentes no pico: ~{Math.round(dia.presentesPico)}.</span></p>
      ) : null}
      <div className="sjToolbar">
        <button type="button" className="sjAnaliseBtn" style={{ background: "#233a1f", borderColor: "#3a5c30" }} onClick={sugerirDia} title="Preenche de uma vez a sugestão de todos os setores do dia escolhido">✨ Sugerir solicitação do dia</button>
        <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620", borderColor: "#5c2530" }} onClick={zerarDia}>Zerar o dia</button>
        <label className="sjMini" style={{ display: "flex", alignItems: "center", gap: 6 }}>Permanência do cliente (h)<input className="sjInput" type="number" min={1} max={8} step={0.1} value={zig?.escala?.permanenciaH || 3.9} style={{ width: 64 }} readOnly /></label>
        <button type="button" className="sjAnaliseBtn" style={{ background: { ok: "#1f3a26", atencao: "#4a3a14", acima: "#4a1c24", semBase: "#2a2420" }[cmoStatus] }} title="CMO dos freelancers da semana contra o teto de 8% do faturamento">
          {cmoStatus === "acima" ? "⚠ " : "💰 "}CMO freelancers: {brl(cmoTotal)}{cmoPct != null ? ` • ${cmoPct.toFixed(1).replace(".", ",")}% do faturamento (teto 8%)` : " • sem faturamento de referência"}
        </button>
      </div>
      {cmoStatus === "acima" && cmo?.faturamento ? <div className="sjAlert r" style={{ margin: "6px 0" }}><b>⚠ CMO de freelancers acima do teto de 8%:</b> {brl(cmoTotal)} ({cmoPct?.toFixed(1).replace(".", ",")}% do faturamento da semana, estimado em {brl(cmo.faturamento)}). Teto = {brl(cmo.faturamento * 0.08)} — reduza <b>{brl(cmoTotal - cmo.faturamento * 0.08)}</b> antes de enviar.</div> : null}
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr><th>Setor</th><th title="Mínimo de referência do setor">Brigada padrão</th><th title="Máximo de pessoas do setor ao mesmo tempo">Limite de brigada</th><th title="Pico de necessidade pelo mapa de calor e reservas">Necessário no pico</th><th title="CLT + INT + PJ escalados hoje">Equipe fixa hoje</th><th>Ausências</th><th>Sugerido</th><th title="Quantos freelancers extras solicitar">Extras a solicitar</th><th>Turno</th><th>Custo</th></tr></thead>
          <tbody>
            {dia && !dia.fechado ? dia.setores.map((setor) => {
              const item = ler(dia.date, setor);
              const sug = sugestao(setor, item.aus);
              const cor = setor.manual ? undefined : item.qty > sug ? "#e2a33d" : item.qty < sug ? "#a78bfa" : undefined;
              return (
                <tr key={setor.chave} className={item.qty > 0 ? "opSel" : undefined}>
                  <td><b>{setor.label}</b>{setor.manual ? <span className="sjBadge" title="Só entra por solicitação manual (+)"> só manual</span> : null}{setor.limite != null ? <span className="sjMini"> (máx. {setor.limite})</span> : null}</td>
                  <td>{setor.brigada}</td><td>{setor.limite == null ? "—" : <b>{setor.limite}</b>}</td><td>{setor.necessario}</td>
                  <td>{Math.max(0, setor.fixa - item.aus)}{setor.referencia ? <span className="sjMini"> ref.</span> : null}</td>
                  <td><input className="sjInput sjAus" type="number" min={0} value={item.aus} style={{ width: 58 }} onChange={(e) => gravar(dia.date, setor.chave, { ...item, aus: Math.max(0, Number(e.target.value) || 0) })} /></td>
                  <td>{setor.manual ? "—" : <><b>{sug}</b>{sug > 0 ? <span className="sjMini"> ({setor.turno}h)</span> : null}</>}</td>
                  <td>
                    <div className="sjQty" style={{ color: cor }}>
                      <button type="button" onClick={() => gravar(dia.date, setor.chave, { ...item, qty: Math.max(0, item.qty - 1) })}>−</button>
                      <input className="sjInput" type="number" min={0} max={40} value={item.qty} onChange={(e) => gravar(dia.date, setor.chave, { ...item, qty: Math.max(0, Math.min(setor.limite ?? 40, Number(e.target.value) || 0)) })} />
                      <button type="button" onClick={() => gravar(dia.date, setor.chave, { ...item, qty: Math.min(setor.limite ?? 40, item.qty + 1) })}>+</button>
                    </div>
                  </td>
                  <td>{item.qty > 0 ? <select className="sjInput" value={item.turno} onChange={(e) => gravar(dia.date, setor.chave, { ...item, turno: Number(e.target.value) })}>{TURNOS.map((h) => <option key={h} value={h}>{h}h — R$ {PAGAMENTO[h]}</option>)}</select> : "—"}</td>
                  <td>{item.qty > 0 ? brl(item.qty * (PAGAMENTO[item.turno] || 0)) : "—"}</td>
                </tr>
              );
            }) : <tr><td colSpan={10} className="sjMini">{baseDias.length ? "Casa fechada nesse dia (Manual)." : "Carregue uma semana primeiro."}</td></tr>}
          </tbody>
        </table>
      </div>
      {totalQ ? (
        <div style={{ margin: "6px 0" }}><b>Total da semana: {totalQ} freelancer(s) • {brl(totalV)}</b></div>
      ) : <p className="sjMini" style={{ margin: "6px 0" }}>Nenhum extra solicitado ainda nesta semana. Use <b>✨ Sugerir solicitação do dia</b> ou os botões <b>+</b> e <b>−</b>.</p>}
      {conferindo && totalQ ? (
        <div className="sjTableInner opTabela" style={{ marginTop: 8 }}>
          <table>
            <thead><tr><th>Dia</th><th>Setor</th><th>Turno</th><th>Horário sugerido</th><th>Custo</th></tr></thead>
            <tbody>{linhasEnvio.map((l, i) => <tr key={`${l.date}-${l.sector}-${i}`}><td>{fmtDma(l.date)}</td><td>{l.label}</td><td>{l.shiftHours}h</td><td>{l.abre && l.fecha ? `${l.abre} – ${l.fecha}` : "—"}</td><td>{brl(PAGAMENTO[l.shiftHours] || 0)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      <div className="sjFormAcoes">
        <button type="button" className="sjAnaliseBtn" onClick={() => setConferindo((c) => !c)} title="Escala completa com o horário de cada freelancer, sem enviar">🔍 Visualizar escala completa</button>
        <button type="button" className="sjAnaliseBtn" style={{ background: "#8a4423" }} onClick={enviar} disabled={enviando} title="Envia ao RH pra aprovação">Enviar semana ao RH</button>
      </div>
    </Cartao>
  );
}
