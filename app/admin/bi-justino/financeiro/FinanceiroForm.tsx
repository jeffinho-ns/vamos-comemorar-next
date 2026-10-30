"use client";

import { useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Badge, Campo, ItemBarra } from "./ui";
import { brl, brl2, fmtTime, monthKeyLabel, pct2, type EntryDoc, type MonthClosure, isMonthClosedFor } from "./comum";
import { CAMPOS_DRE, type CampoFin, type ValorDre } from "./indicadores";

const AJUDA_EXTRA: Partial<Record<CampoFin, string>> = {
  fnCard: " • saudável ≤ 2,1% do faturamento",
  fnEnergy: " • compartilhado com a Operação (leitura).",
  fnWater: " • compartilhado com a Operação (leitura).",
  fnGas: " • compartilhado com a Operação (leitura).",
  fnDisposable: " • sensível a solicitação operacional; alerta por % da receita.",
  fnSecurity: " • quantidade vem da operação, valor financeiro é validado aqui.",
  fnAdminFixed: " • saudável ≤ R$ 25 mil",
  fnFinanceOther: " • saudável ≤ R$ 3 mil",
};

/**
 * Quadro "Financeiro • EDIÇÃO DA ÁREA" do painel do Renato: mês de referência, enviado por, faturamento
 * acumulado (ZigPay) e os 12 campos lidos da DRE (somente leitura), com envio do registro do mês.
 */
export function FinanceiroForm({
  mes,
  onMes,
  faturamento,
  valores,
  avisoFallback,
  avisoNaoAchados,
  carregandoDre,
  envioDoMes,
  closures,
  onSalvo,
}: {
  mes: string;
  onMes: (mk: string) => void;
  faturamento: number;
  valores: Record<CampoFin, ValorDre | null>;
  avisoFallback: string;
  avisoNaoAchados: string;
  carregandoDre: boolean;
  envioDoMes: EntryDoc | null;
  closures: MonthClosure[];
  onSalvo: () => void;
}) {
  const [enviadoPor, setEnviadoPor] = useState("");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fechado = isMonthClosedFor(closures, "financeiro", mes);
  const rotuloMes = monthKeyLabel(mes);
  const statusMes = envioDoMes
    ? `Editando envio de ${rotuloMes} — salvar substitui esse mês.${envioDoMes.submittedAt ? ` Último envio ${fmtTime(envioDoMes.submittedAt)}${envioDoMes.submittedByName ? ` por ${envioDoMes.submittedByName}` : ""}.` : ""}`
    : `Nenhum envio ainda pra ${rotuloMes} — confira os valores e clique em Enviar.`;

  async function enviar() {
    const values: Record<string, number> = {};
    CAMPOS_DRE.forEach((c) => { values[c.campo] = valores[c.campo]?.valor ?? 0; });
    if (!Object.values(values).some((v) => v !== 0)) {
      setStatus("Registro do mês em branco — a DRE desse mês ainda não trouxe nenhum valor.");
      return;
    }
    setEnviando(true);
    setStatus("Enviando…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/envio/financeiro", { date: mes, values, submittedByName: enviadoPor.trim() });
    setEnviando(false);
    if (r.ok) {
      setStatus(`Enviado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
      onSalvo();
    } else if (r.json?.error === "month_closed") {
      setStatus("🔒 Mês fechado — peça pro diretor reabrir.");
    } else {
      setStatus("Falha ao enviar, tenta de novo.");
    }
  }

  function limpar() {
    if (!window.confirm("Apagar os dados digitados nesta aba? Isso não apaga um envio que já foi enviado antes, só limpa o formulário na tela.")) return;
    setEnviadoPor("");
    setStatus("Dados digitados apagados.");
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>Financeiro</h3><Badge nivel="p">EDIÇÃO DA ÁREA</Badge></div>
      <div className="sjFaixaMes">Mês de referência: {rotuloMes}</div>
      {carregandoDre ? <span className="sjAviso">⏳ Buscando DRE de {rotuloMes}…</span> : null}
      {avisoFallback ? <div className="sjAviso">{avisoFallback}</div> : null}
      {avisoNaoAchados ? <div className="sjAviso">{avisoNaoAchados}</div> : null}
      <div className="sjToolbar">
        <ItemBarra rotulo="Mês de referência"><input type="month" className="sjInput" value={mes} onChange={(e) => e.target.value && onMes(e.target.value)} /></ItemBarra>
        <ItemBarra rotulo="Enviado por"><input type="text" className="sjInput" placeholder="Seu nome" value={enviadoPor} onChange={(e) => setEnviadoPor(e.target.value)} /></ItemBarra>
        <button type="button" className="sjBtn sjBtnAccent" disabled={enviando} onClick={enviar}>Enviar registro do mês</button>
        <button type="button" className="sjBtn sjBtnR" onClick={limpar}>🗑 Apagar dados digitados</button>
        <span className="sjMini">{status || statusMes}</span>
        {fechado ? <span className="sjMini sjAvisoRed">🔒 {rotuloMes} está fechado em Financeiro — só o diretor consegue enviar.</span> : null}
      </div>
      <hr className="sjSep" />
      <Campo titulo="Faturamento bruto (acumulado do mês)" ajuda={<>Soma automática dos dias já capturados pela ZigPay no mês da data selecionada — Financeiro não digita mais isso. Média ≈ R$ 526 mil/mês • saudável ≥ R$ 600 mil/mês</>}>
        <input className="sjInput sjInputRo" type="text" readOnly value={brl2(faturamento)} />
      </Campo>
      {CAMPOS_DRE.map((c) => {
        const v = valores[c.campo];
        const extra = AJUDA_EXTRA[c.campo] || "";
        return (
          <Campo
            key={c.campo}
            titulo={c.rotulo}
            ajuda={c.pct
              ? <>Valor na DRE (mês de referência): <b>{v ? brl(v.valorDre) : "—"}</b> • representa <b>{v && v.pctFaturamento != null ? pct2(v.pctFaturamento) : "—"}</b> do faturamento do mês{extra}</>
              : <>Valor na DRE (mês de referência): <b>{v ? brl(v.valorDre) : "—"}</b>{extra}</>}
          >
            <input className="sjInput sjInputRo" type="text" readOnly placeholder="R$ 0,00" value={v ? (c.pct ? brl2(v.valorDre) : brl2(v.valor)) : ""} />
          </Campo>
        );
      })}
    </section>
  );
}
