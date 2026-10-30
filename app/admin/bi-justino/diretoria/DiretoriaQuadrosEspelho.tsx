"use client";

import { useState, type ReactNode } from "react";
import { AlertasFlow } from "../DiretoriaQuadros";
import type { AuditoriaOpItem } from "../marketing/espelhoTipos";
import { reais } from "../marketing/numeros";
import { chamarBi } from "../usePlanilha";
import { AREA_DE_CUSTO, bonusColaborador, CHAVES_CUSTO, LABEL_AREA, scoreArea, statusCost, type Consolidado } from "./consolidado";
import { fmtDate, pct, type AlertaDiretoria } from "./diretoriaCalculo";

function Campo({ titulo, ajuda, valor, rodape }: { titulo: string; ajuda?: string; valor: string; rodape?: ReactNode }) {
  return (
    <div className="sjField">
      <div><b>{titulo}</b>{ajuda ? <p className="sjMini">{ajuda}</p> : null}</div>
      <div className="v">{valor}</div>
      {rodape ? <p className="sjMini">{rodape}</p> : null}
    </div>
  );
}

/** "Projeção consolidada do mês (última data enviada por área)" — campos somente leitura, mesmos textos de ajuda. */
export function ProjecaoConsolidadaEspelho({ c, onAtualizar }: { c: Consolidado | null; onAtualizar: () => void }) {
  const carregando = "Carregando…";
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Projeção consolidada do mês (última data enviada por área)</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>🔄 Atualizar</button>
      </div>
      <Campo titulo="Faturamento bruto mensal" ajuda="Vem do último envio do Financeiro." valor={c ? reais(c.r) : carregando} rodape={<>Média histórica aproximada: <b>R$ 526 mil/mês</b> • <span className="sjOk">meta saudável ≥ R$ 600 mil</span></>} />
      <Campo titulo="CMV real consolidado" ajuda="Vem do último envio de Márcio / CMV." valor={c ? pct(c.cmvReal) : carregando} rodape={<>Média usada no BI: <b>20,09%</b> • <span className="sjOk">saudável ≤ 22%</span></>} />
      <Campo titulo="Custos controláveis acumulados" valor={c ? reais(c.controlado) : carregando} rodape="Soma dos custos atribuídos aos gestores, sem duplicar impostos/fees." />
      <Campo titulo="Custos estruturais + variáveis" valor={c ? reais(c.estrutural) : carregando} rodape="Inclui impostos, cartões, fee, IR/CSLL, aluguel e demais blocos não duplicados." />
    </section>
  );
}

export function AlertasDiretoriaEspelho({ alertas, carregando }: { alertas: AlertaDiretoria[]; carregando: boolean }) {
  if (carregando) {
    return <section className="sjCard sjBloco"><h3>Alertas de diretoria</h3><p className="sjMini">Carregando dados da planilha…</p></section>;
  }
  return <AlertasFlow titulo="Alertas de diretoria" alertas={alertas} />;
}

// Mesmos rótulos do painel (FREELANCER_SECTOR_LABEL + areaExterna, AUOP_TIPO_LABEL, AUOP_PRIORIDADE_LABEL).
const SETOR_LABEL: Record<string, string> = { salao: "Garçom", cumim: "Cumim", bar: "Bar", cozinha: "Cozinha", limpeza: "Limpeza", seguranca: "Segurança", caixa: "Caixa/Hostess", runner: "Runner/RP", manutencao: "Manutenção", estoquista: "Estoquista", areaExterna: "Área Externa" };
const TIPO_LABEL: Record<string, string> = { manutencao: "Manutenção", organizacao: "Organização", obra: "Obra", limpeza: "Limpeza", aquisicao: "Aquisição", outros: "Outros" };
const PRIO_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

function Pendente({ item, onSalvo }: { item: AuditoriaOpItem; onSalvo: () => void }) {
  const [obs, setObs] = useState("");
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function decidir(acao: "aprovar" | "negar") {
    setOcupado(true);
    setStatus(acao === "aprovar" ? "Aprovando…" : "Negando…");
    const r = await chamarBi<{ ok?: boolean; error?: string }>(`/api/bi/justino/diretoria/auditoria/${acao}`, { id: item.id, observacao: obs.trim() });
    setOcupado(false);
    if (!r.ok) {
      setStatus(r.json?.error === "forbidden" ? "Só o dono do BI pode aprovar ou negar." : `Não consegui ${acao}.`);
      return;
    }
    setStatus(acao === "aprovar" ? "Item aprovado." : "Item negado.");
    onSalvo();
  }
  return (
    <article className="sjCard sjBloco">
      <div className="sjRole">
        <div><b>{item.descricaoProblema}</b><p className="sjMini">{SETOR_LABEL[item.setor] || item.setor} • {TIPO_LABEL[item.tipoServico] || item.tipoServico} • {PRIO_LABEL[item.prioridade] || item.prioridade}{item.empresaExecutora ? ` • ${item.empresaExecutora}` : ""}</p></div>
        <div style={{ textAlign: "right" }}><div className="v" style={{ fontSize: 18, margin: 0 }}>{reais(item.valorEstimado)}</div><p className="sjMini">{item.prazo ? `Prazo: ${fmtDate(item.prazo)}` : ""}</p></div>
      </div>
      {item.impactoOperacional ? <p className="sjMini">Impacto: {item.impactoOperacional}</p> : null}
      <label className="sjFormBloco"><b className="sjMini">Observação (opcional, vai pro item em Auditoria Operacional)</b><textarea className="sjInput" rows={2} placeholder="Motivo, condição pra aprovar, etc." value={obs} onChange={(e) => setObs(e.target.value)} /></label>
      <div className="sjToolbar">
        <button type="button" className="sjAnaliseBtn" style={{ background: "#1e5b3e" }} disabled={ocupado} onClick={() => { void decidir("aprovar"); }}>✓ Aprovar</button>
        <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} disabled={ocupado} onClick={() => { void decidir("negar"); }}>✕ Negar</button>
        {status ? <span className="sjMini" role="status">{status}</span> : null}
      </div>
    </article>
  );
}

/** "Aprovações pendentes • Auditoria Operacional" (renderDiretoriaAprovacoes). */
export function AprovacoesPendentes({ itens, carregando, onSalvo }: { itens: AuditoriaOpItem[]; carregando: boolean; onSalvo: () => void }) {
  return (
    <section className="sjCard sjBloco">
      <h3>Aprovações pendentes • Auditoria Operacional</h3>
      {carregando ? <p className="sjMini">Carregando…</p> : !itens.length ? <p className="sjMini">Nenhum item aguardando aprovação no momento.</p> : itens.map((item) => <Pendente key={item.id} item={item} onSalvo={onSalvo} />)}
    </section>
  );
}

/** "Responsabilidade por área e impacto no resultado" (areaTable do computeMaster). */
export function ResponsabilidadeEspelho({ c }: { c: Consolidado | null }) {
  const temSalarios = Boolean(c && c.salarios.length);
  return (
    <details className="sjCollapse">
      <summary><span className="sjChev">▸</span> Responsabilidade por área e impacto no resultado<span className="sjHint">clique para abrir</span></summary>
      <section className="sjCard sjBloco sjCollapseBody">
        <h3>Responsabilidade por área e impacto no resultado</h3>
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Área</th><th>Meta de custo</th><th>Real/previsto</th><th>Economia / excesso</th><th>Status</th><th>Bônus projetado</th></tr></thead>
            <tbody>
              {!c ? <tr><td colSpan={6} className="sjMini">Carregando…</td></tr> : CHAVES_CUSTO.map((k) => {
                const area = AREA_DE_CUSTO[k];
                const imp = c.healthy[k] - c.actual[k];
                const st = statusCost(c.actual[k], c.healthy[k], c.healthy[k] * 1.15);
                const entry = c.ultimo[area];
                const bonus = temSalarios ? bonusColaborador(area, c.margin, scoreArea(c, k), c.salarios) : null;
                return (
                  <tr key={k}>
                    <td>
                      {LABEL_AREA[area]}
                      {!entry ? <p className="sjMini" style={{ color: "var(--yellow)" }}>sem envio — usando referência</p> : entry.date !== c.hoje ? <p className="sjMini" style={{ color: "var(--yellow)" }}>último envio: {fmtDate(entry.date)}</p> : null}
                    </td>
                    <td>{reais(c.healthy[k])}</td>
                    <td>{reais(c.actual[k])}</td>
                    <td className={imp >= 0 ? "sjPos" : "sjNeg"}>{reais(imp)}</td>
                    <td><span className={st[0] === "g" ? "sjBadgeG" : st[0] === "y" ? "sjBadgeY" : "sjBadgeR"}>{st[1]}</span></td>
                    <td>{bonus == null ? "🔒" : reais(bonus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </details>
  );
}
