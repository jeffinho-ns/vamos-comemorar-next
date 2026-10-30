"use client";

import { useState, type ReactNode } from "react";
import { Badge, Cartao } from "../operacao/Cartao";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { calcularCrm, crmCor, crmFmt, crmPct, linhasCrm } from "./crmCalculo";
import { CrmSaudePlano } from "./CrmSaudePlano";
import { CRM_META, type CrmConfigLeitura, type CrmFunil } from "./tipos";

const COR = { r: "var(--red)", y: "var(--yellow)", g: "var(--green)", "": undefined } as const;

function Tb({ cab, linhas }: { cab: string[]; linhas: ReactNode[][] }) {
  return (
    <div className="sjTableInner opTabela">
      <table>
        <thead><tr>{cab.map((x) => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{linhas.map((l, i) => <tr key={i}>{l.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Cor({ v, meta, menor }: { v: number | null; meta: number; menor: boolean }) {
  return <span style={{ color: COR[crmCor(v, meta, menor)] }}>{crmFmt(v, 0)}</span>;
}

function Barra({ t, v, ref, cor }: { t: string; v: number; ref: number; cor: string }) {
  const p = ref > 0 ? Math.min(100, (v / ref) * 100) : 0;
  return (
    <div className="opBarra">
      <div className="opBarraLabel">{t}</div>
      <div className="opBarraTrilho"><div className="opBarraFill" style={{ width: `${p}%`, background: cor }} /></div>
      <div className="opBarraVal"><b>{Number(v).toLocaleString("pt-BR")}</b> <span className="sjMini" style={{ display: "inline" }}>{crmFmt(crmPct(v, ref))}</span></div>
    </div>
  );
}

/** "📈 Conversão e perdas de reservas • Dionísio CRM" (loadCrm/crmRender). */
export function CrmDionisio({ dados, recarregar }: { dados: DadosPlanilha; recarregar: () => void }) {
  const [dias, setDias] = useState(90);
  const [painel, setPainel] = useState<"" | "saude" | "plano">("");
  const resPayload = payloadDe<{ cols?: string[]; rows?: unknown[]; atualizadoEm?: string }>(dados, "getCrmReservas");
  const rows = linhasCrm(resPayload);
  const atualizadoEm = resPayload?.atualizadoEm || "";
  const funil = (payloadDe<{ rows?: CrmFunil[] }>(dados, "getCrmFunil")?.rows ?? [])[0];
  const cfgRows = payloadDe<{ rows?: CrmConfigLeitura[] }>(dados, "getCrmConfig")?.rows ?? [];
  const r = calcularCrm(rows, funil, dias, atualizadoEm);
  const horasAtras = atualizadoEm ? (Date.now() - new Date(atualizadoEm).getTime()) / 3600000 : null;

  return (
    <Cartao titulo={<>Conversão e perdas • Dionísio CRM<span className="sjMini" style={{ marginLeft: 8, display: "inline" }}>robô atualiza às 10h, 15h e 18h</span></>}>
      <div className="sjRole"><h3>📈 Conversão e perdas de reservas • Dionísio CRM</h3><Badge nivel={horasAtras != null && horasAtras > 9 ? "r" : "p"}>{atualizadoEm ? `atualizado ${new Date(atualizadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "sem atualização"}</Badge></div>
      <p className="sjNote">Reservas do atendimento por IA (WhatsApp, Instagram, Meta Ads, portal e equipe). Dados <b>sem nome, telefone nem e-mail</b>; o robô lê 100% das reservas do último ano a cada rodada.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Reservas criadas nos últimos<select className="sjInput" value={dias} onChange={(e) => setDias(Number(e.target.value))}><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option><option value={400}>todo o período</option></select></label></div>
        <button type="button" className="sjAnaliseBtn" onClick={recarregar}>↻ Atualizar tela</button>
        <button type="button" className="sjAnaliseBtn" style={painel === "saude" ? { outline: "2px solid #c9a227" } : undefined} onClick={() => setPainel((p) => (p === "saude" ? "" : "saude"))}>🩺 Saúde do atendimento</button>
        <button type="button" className="sjAnaliseBtn" style={painel === "plano" ? { outline: "2px solid #c9a227" } : undefined} onClick={() => setPainel((p) => (p === "plano" ? "" : "plano"))}>✅ Plano de ação</button>
      </div>
      {painel ? <CrmSaudePlano rows={cfgRows} qual={painel} /> : null}
      {!r ? <div className="sjAlert y">Ainda não há reservas do Dionísio no BI. O robô roda às 10h, 15h e 18h; para rodar agora: robo-zigpay\robo_dionisio.ps1.</div> : (
        <>
          <div className="opMiniKpis">
            <div className="opMiniKpi"><small>Reservas no período</small><div className="v">{r.n}</div><span className="sjMini">últimos {dias >= 400 ? "todo o período" : `${dias} dias`} • mediana {r.medPes ?? "—"} pessoas</span></div>
            <div className="opMiniKpi"><small>Compareceram</small><div className="v" style={{ color: COR[crmCor(r.compPct, CRM_META.comparece, false)] }}>{crmFmt(r.compPct)}</div><span className="sjMini">meta ≥ {CRM_META.comparece}% • {r.c.ok} de {r.c.ok + r.c.noshow}</span></div>
            <div className="opMiniKpi"><small>Cancelamento</small><div className="v" style={{ color: COR[crmCor(r.cancelPct, CRM_META.cancel, true)] }}>{crmFmt(r.cancelPct)}</div><span className="sjMini">meta ≤ {CRM_META.cancel}% • {r.c.cancel} reservas</span></div>
            <div className="opMiniKpi"><small>No-show</small><div className="v" style={{ color: COR[crmCor(r.nsPct, CRM_META.noshow, true)] }}>{crmFmt(r.nsPct)}</div><span className="sjMini">meta ≤ {CRM_META.noshow}% • {r.c.noshow} reservas</span></div>
            <div className="opMiniKpi"><small>Criadas pela IA</small><div className="v">{crmFmt(r.iaPct)}</div><span className="sjMini">atendidas por IA: {crmFmt(r.atIAPct, 0)}</span></div>
            <div className="opMiniKpi"><small>Antecedência (mediana)</small><div className="v">{r.medLead == null ? "—" : `${r.medLead} dia(s)`}</div><span className="sjMini">entre criar e visitar</span></div>
          </div>
          <h4 style={{ margin: "14px 0 4px" }}>Alertas automáticos</h4>
          {r.alertas.length ? r.alertas.map(([nivel, txt], i) => <div key={i} className={`sjAlert ${nivel}`} style={{ marginTop: 6 }}>{txt}</div>) : <div className="sjAlert g" style={{ marginTop: 6 }}>Sem alertas: cancelamento, no-show e origens dentro das metas.</div>}
          {funil ? (
            <>
              <h4 style={{ margin: "16px 0 4px" }}>Funil da IA • {funil.periodo || ""} <span className="sjMini" style={{ display: "inline" }}>(lido {new Date(funil.capturedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })})</span></h4>
              <Barra t="Conversas iniciadas" v={Number(funil.conversas) || 0} ref={Number(funil.conversas) || 0} cor="#a78bfa" />
              <Barra t="Tiraram dúvida / pediram informação" v={Number(funil.duvida) || 0} ref={Number(funil.conversas) || 0} cor="#8b6bd8" />
              <Barra t="Começaram pedido ou reserva" v={Number(funil.inicio) || 0} ref={Number(funil.conversas) || 0} cor="#c96736" />
              <Barra t="Finalizaram e pagaram" v={Number(funil.finalizaram) || 0} ref={Number(funil.conversas) || 0} cor="#34d399" />
              <p className="sjMini" style={{ marginTop: 6 }}>Dúvida → início de reserva: <b>{crmFmt(crmPct(Number(funil.inicio), Number(funil.duvida)))}</b> • Início → finalizou: <b>{crmFmt(crmPct(Number(funil.finalizaram), Number(funil.inicio)))}</b> • Resolução autônoma da IA: <b>{crmFmt(Number(funil.resolucaoPct))}</b> • Encaminhadas a humano: <b>{funil.handoff || "—"}</b> ({crmFmt(Number(funil.handoffPct))}) • Sessões: <b>{funil.sessoes || "—"}</b> ({Number(funil.sessoesVar) > 0 ? "+" : ""}{crmFmt(Number(funil.sessoesVar))}) • Meta Ads {funil.metaAds || 0} / WhatsApp {funil.whatsapp || 0} / Instagram {funil.instagram || 0}</p>
              <p className="sjMini">Separação: <b>tráfego pago</b> = Meta Ads (já separado acima). <b>Envio em massa pelo Dionísio = 0</b> (tela Disparos sem nenhum disparo criado e Disparos Inteligentes pausado em 23/10), então as conversas acima não vêm de disparo da plataforma. Os disparos de aniversário saem à mão pelo WhatsApp e ficam dentro de &quot;WhatsApp&quot; (sem rastreio; só uma exportação de conversas do Dionísio separa).</p>
            </>
          ) : null}
          <div className="opColunas">
            <div><h4>Por origem</h4><Tb cab={["Origem", "Reservas", "Compareceu", "Cancel.", "No-show"]} linhas={r.porOrigem.map(({ origem, x }) => [origem, x.n, crmFmt(crmPct(x.ok, x.n), 0), <Cor key="c" v={crmPct(x.ca, x.n)} meta={CRM_META.cancel} menor />, <Cor key="n" v={crmPct(x.ns, x.n)} meta={CRM_META.noshow} menor />])} /></div>
            <div><h4>Por dia da semana</h4><Tb cab={["Dia", "Marcadas p/ o dia", "%", "Feitas no dia", "%"]} linhas={r.porDia.map((d) => [d.dia, d.vis, crmFmt(crmPct(d.vis, r.n), 0), d.cri, crmFmt(crmPct(d.cri, r.n), 0)])} /></div>
            <div><h4>Antecedência × perda</h4><Tb cab={["Antecedência", "Reservas", "%", "Cancel.", "No-show"]} linhas={r.porLead.map((l) => [l.faixa, l.n, crmFmt(crmPct(l.n, r.n), 0), <Cor key="c" v={l.cancel} meta={CRM_META.cancel} menor />, crmFmt(l.noshow, 0)])} /></div>
            <div><h4>Mês de criação</h4><Tb cab={["Mês", "Reservas", "Pela IA", "Cancel.", "No-show"]} linhas={r.porMes.map((m) => [m.mes, m.n, crmFmt(m.ia, 0), crmFmt(m.cancel, 0), crmFmt(m.noshow, 0)])} /></div>
            <div><h4>Horário em que a reserva é criada</h4><Tb cab={["Faixa", "Reservas", "%"]} linhas={r.porHora.map((h) => [h.faixa, h.n, crmFmt(crmPct(h.n, r.n), 0)])} /></div>
          </div>
        </>
      )}
    </Cartao>
  );
}
