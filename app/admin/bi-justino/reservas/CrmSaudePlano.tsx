"use client";

import { Badge } from "../operacao/Cartao";
import { crmCfgAvalia, crmNota, crmPlano } from "./crmSaude";
import type { CrmConfigLeitura } from "./tipos";

const CRM_COR = { r: "#f76e7c", y: "#f5b942", g: "#34d399" };
const CRM_ICO = { r: "🔴", y: "🟡", g: "🟢" };

/** Painéis "🩺 Saúde do atendimento por IA" e "✅ Plano de ação do atendimento" (crmCfgRender). */
export function CrmSaudePlano({ rows, qual }: { rows: CrmConfigLeitura[]; qual: "saude" | "plano" }) {
  const validas = rows.filter((r) => r && r.cfg && Object.keys(r.cfg).length >= 8);
  if (!validas.length) return <div className="sjAlert y" style={{ margin: "10px 0" }}>Ainda não há leitura da configuração do Dionísio. O robô lê às 10h, 15h e 18h (ou rode robo-zigpay\robo_dionisio.ps1). Se aparecer erro, cole o Code.gs novo no Apps Script.</div>;
  const cur = validas[0];
  const cap = Number(cur.capturedAt) || Date.parse(String(cur.capturedAt)) || null;
  const L = crmCfgAvalia(cur.cfg, cap);
  const quando = cap ? new Date(cap).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  const n = { r: 0, y: 0, g: 0 };
  L.forEach((x) => { n[x.e] += 1; });

  if (qual === "saude") {
    const a = crmNota(L);
    const ant = validas[1] ? crmNota(crmCfgAvalia(validas[1].cfg, null)).nota : null;
    const incompleta = a.lidos < 10;
    const cor = incompleta ? "var(--muted)" : (a.nota ?? 0) >= 80 ? "var(--green)" : (a.nota ?? 0) >= 50 ? "var(--yellow)" : "var(--red)";
    const faixa = incompleta ? "Provisória (leitura incompleta)" : (a.nota ?? 0) >= 80 ? "Bom" : (a.nota ?? 0) >= 50 ? "Atenção" : "Crítico";
    const dif = ant == null || a.nota == null ? "" : a.nota === ant ? ` • igual à leitura anterior (${ant}%)` : ` • ${a.nota > ant ? "+" : ""}${a.nota - ant} pontos vs leitura anterior (${ant}%)`;
    const ordem = { r: 0, y: 1, g: 2 };
    return (
      <div className="opGrupo" style={{ margin: "10px 0" }}>
        <div className="sjRole"><h3>🩺 Saúde do atendimento por IA</h3><Badge nivel="p">lido {quando}</Badge></div>
        <p className="sjNote">O robô lê, todo dia, as telas de configuração da IA do Dionísio e este quadro mostra o que está certo (🟢), pede atenção (🟡) ou está quebrando reservas (🔴).</p>
        {a.nota != null ? (
          <div className="sjAlert" style={{ borderLeft: `4px solid ${cor}`, marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }} title="Nota de atendimento geral. 🟢 vale 1 ponto, 🟡 vale 0,5 e 🔴 vale 0. A IA no WhatsApp pesa 3; regras da IA, follow-up, chamar humano e atendimentos travados pesam 2; os outros pesam 1. Itens não lidos ficam fora da conta. 80% ou mais = Bom • 50% a 79% = Atenção • abaixo de 50% = Crítico.">
            <div style={{ minWidth: 150 }}><div className="sjMini" style={{ fontWeight: 700 }}>Nota de atendimento geral ⓘ</div><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, color: cor }}>{a.nota}%</div><div className="sjMini"><b style={{ color: cor }}>{faixa}</b></div></div>
            <div style={{ flex: 1, minWidth: 220 }}><div style={{ background: "#221c17", borderRadius: 8, height: 14 }}><div style={{ width: `${a.nota}%`, background: cor, height: 14, borderRadius: 8 }} /></div><div className="sjMini" style={{ marginTop: 6 }}>{a.lidos} de {a.total} itens lidos entram na nota{incompleta ? " — poucos itens foram lidos, a nota ainda não é confiável" : ""}{dif}.</div></div>
          </div>
        ) : null}
        <div className="opMiniKpis">
          <div className="opMiniKpi"><small>Críticos</small><div className="v" style={{ color: "var(--red)" }}>{n.r}</div><span className="sjMini">atrapalham reservas hoje</span></div>
          <div className="opMiniKpi"><small>Atenção</small><div className="v" style={{ color: "var(--yellow)" }}>{n.y}</div><span className="sjMini">podem melhorar</span></div>
          <div className="opMiniKpi"><small>Em ordem</small><div className="v" style={{ color: "var(--green)" }}>{n.g}</div><span className="sjMini">dentro da meta</span></div>
        </div>
        {[...L].sort((x, y) => ordem[x.e] - ordem[y.e]).map((x) => (
          <div key={x.id} className="opAlertaLinha" style={{ borderLeftColor: CRM_COR[x.e] }} title={x.tip}>
            <div style={{ fontWeight: 800 }}>{CRM_ICO[x.e]} {x.t} ⓘ</div>
            <div style={{ margin: "3px 0" }}>{x.v}</div>
            <div className="sjMini">Meta: {x.meta}{x.e === "g" ? "" : <> • <b>O que fazer:</b> {x.acao}</>}</div>
          </div>
        ))}
      </div>
    );
  }

  const tarefas = crmPlano(L);
  const auto = tarefas.filter((t) => t.ok !== null);
  const feitas = auto.filter((t) => t.ok).length;
  let ult = "";
  return (
    <div className="opGrupo" style={{ margin: "10px 0" }}>
      <div className="sjRole"><h3>✅ Plano de ação do atendimento</h3><Badge nivel="p">{feitas} de {auto.length} conferidos</Badge></div>
      <p className="sjNote">O que fazer primeiro, em ordem. Cada item é conferido na próxima leitura do robô: quando a configuração no Dionísio muda, ele vira ✅ sozinho. Itens com ⚪ são manuais.</p>
      <div style={{ background: "#221c17", borderRadius: 8, height: 12, margin: "4px 0 6px" }}><div style={{ width: `${Math.round((feitas / Math.max(1, auto.length)) * 100)}%`, background: "#34d399", height: 12, borderRadius: 8 }} /></div>
      <p className="sjMini">{feitas} de {auto.length} itens conferidos automaticamente estão concluídos • leitura de {quando}</p>
      {tarefas.map((t, i) => {
        const cab = t.sem !== ult ? <h4 style={{ margin: "14px 0 4px" }}>{t.sem}</h4> : null;
        ult = t.sem;
        const ico = t.ok === null ? "⚪" : t.ok ? "✅" : t.parc ? "🟡" : "⬜";
        const est = t.ok === null ? "manual" : t.ok ? "concluído" : t.parc ? "em andamento" : "a fazer";
        const cor = t.ok ? "#34d399" : t.ok === null ? "#8a8178" : t.parc ? "#f5b942" : "#f76e7c";
        return (
          <div key={t.t}>
            {cab}
            <div className="opAlertaLinha" style={{ borderLeftColor: cor }}>
              <div style={{ fontWeight: 800 }}>{ico} {i + 1}. {t.t} <span className="sjMini" style={{ fontWeight: 400, display: "inline" }}>— {est}</span></div>
              <div className="sjMini" style={{ marginTop: 3 }}>{t.detalhe}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
