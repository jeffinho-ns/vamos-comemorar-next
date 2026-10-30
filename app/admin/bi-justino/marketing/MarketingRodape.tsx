"use client";

import type { ZigAoVivo } from "../zigValor";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const QUEDA_CRITICA = -20;

function reais(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function reaisDelta(valor: number) {
  const texto = Math.abs(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (valor > 0) return `+${texto}`;
  if (valor < 0) return `-${texto}`;
  return texto;
}

function pct(atual: number | null | undefined, base: number | null | undefined) {
  if (atual == null || base == null || !Number.isFinite(atual) || !Number.isFinite(base) || base === 0) return null;
  return ((atual - base) / Math.abs(base)) * 100;
}

function tem(valor: number | null | undefined): valor is number {
  return valor != null && Number.isFinite(valor);
}

function diaCurto(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano.slice(2)}`;
}

function mesCurto(mes: string | null | undefined) {
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return "";
  const [ano, ordem] = mes.split("-");
  return `${MESES[Number(ordem) - 1] || ordem}/${ano.slice(2)}`;
}

function notaFinanceiro(zig: ZigAoVivo | null) {
  const data = zig?.projecao?.envios?.financeiro;
  if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split("-");
    return `último envio: ${dia}/${mes}/${ano}`;
  }
  return "Financeiro ainda não enviou — usando valor de referência";
}

export function MarketingRodape({ zig }: { zig: ZigAoVivo | null }) {
  const bilheteria = [...(zig?.bilheteria || [])].sort((a, b) => b.mes.localeCompare(a.mes));
  const atual = bilheteria[0];
  const anterior = bilheteria[1];
  const fat = zig?.faturamentoMes;
  const projetado = zig?.projetadoMes;
  const semana = zig?.semanaFaturado;
  const semanaPlano = zig?.semanaProjetado;
  const periodo = zig?.semanaInicio && zig?.semanaFim
    ? `(${diaCurto(zig.semanaInicio)} até ${diaCurto(zig.semanaFim)})${zig.semanaAnterior ? " • semana anterior" : ""}`
    : "";
  const diffMes = tem(fat) && tem(projetado) && projetado > 0 ? fat - projetado : null;
  const diffSemana = tem(semana) && tem(semanaPlano) && semanaPlano > 0 ? semana - semanaPlano : null;

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjMkTopo">
          <div>
            <b>Faturamento do mês (Financeiro)</b>{" "}
            <span className="sjMini">{notaFinanceiro(zig)}</span>
          </div>
          <div className="sjMkTopoValor">
            <div className="v">{reais(fat)}</div>
            <p className="sjMini">{zig?.zigMes == null && zig?.eventosMes == null ? "—" : `ZigPay ${reais(zig?.zigMes)} + Eventos ${reais(zig?.eventosMes)}`}</p>
          </div>
        </div>
        <hr className="sjMkSep" />
        <div className="sjMkGrade">
          <Mini rotulo="Mês vs mesmo mês ano anterior" valor={reais(zig?.mesmoMesAnoAnterior)} variacao={pct(fat, zig?.mesmoMesAnoAnterior)} />
          <Mini
            rotulo="Projetado do mês × realizado"
            valor={diffMes == null ? "—" : reaisDelta(diffMes)}
            variacao={pct(fat, projetado)}
            critico
            nota={tem(projetado) && projetado > 0 ? `Projetado ${reais(projetado)} • Realizado ${reais(fat)}` : tem(fat) ? `Realizado ${reais(fat)}` : undefined}
          />
          <Mini
            rotulo="Semana: projetado × realizado"
            valor={diffSemana == null ? "—" : reaisDelta(diffSemana)}
            variacao={pct(semana, semanaPlano)}
            critico
            nota={tem(semanaPlano) && semanaPlano > 0 ? `Projetado ${reais(semanaPlano)} • Realizado ${reais(semana)}${periodo ? ` ${periodo}` : ""}` : tem(semana) || periodo ? `Realizado ${reais(semana)}${periodo ? ` ${periodo}` : ""}` : undefined}
          />
          <Mini rotulo="Semana vs mesma semana ano anterior" valor={reais(zig?.semanaAnoAnterior)} variacao={pct(semana, zig?.semanaAnoAnterior)} />
          <Mini rotulo="Ticket médio • semana (vs ano anterior)" valor={reais(zig?.ticketSemana)} nota="sem o ticket do ano anterior neste painel" />
          <Mini rotulo="Ticket médio • mês (vs ano anterior)" valor={reais(zig?.ticketMes)} nota="sem o ticket do ano anterior neste painel" />
          <Mini rotulo="Ticket médio • ano (vs ano anterior)" valor={reais(zig?.ticketAno)} nota="sem o ticket do ano anterior neste painel" />
        </div>
      </section>
      <section className="sjCard sjBloco">
        <div className="sjMkTopo">
          <div>
            <b>Receita de entrada (Bilheteria)</b>{" "}
            <span className="sjMini">{atual ? `(${mesCurto(atual.mes)})` : ""}</span>
          </div>
          <div className="sjMkTopoValor"><div className="v">{atual ? reais(atual.receita) : "—"}</div></div>
        </div>
        <p className="sjMini">Faturamento de entrada (bilheteria), direto da tela Relatórios de Bilheteria do ZigPay — captura mensal pelo robô, não diária.</p>
        <hr className="sjMkSep" />
        <div className="sjMkGrade">
          <Mini
            rotulo="Mês vs mês anterior"
            valor={anterior ? reais(anterior.receita) : "—"}
            variacao={atual && anterior ? pct(atual.receita, anterior.receita) : null}
            nota={anterior ? mesCurto(anterior.mes) : undefined}
          />
          <Mini rotulo="Entradas vendidas no mês" valor={atual ? atual.entradasQtd.toLocaleString("pt-BR") : "—"} delta={false} />
          <Mini rotulo="Público do mês (ZigPay)" valor={atual ? atual.publicoMes.toLocaleString("pt-BR") : "—"} delta={false} />
          <Mini rotulo="% clientes × entradas" valor={pctEntrada(atual?.pctClientesEntradas)} delta={false} nota="entradas vendidas ÷ público do mês" />
        </div>
      </section>
    </>
  );
}

function pctEntrada(valor: number | null | undefined) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function Mini({
  rotulo,
  valor,
  variacao = null,
  delta = true,
  critico = false,
  nota,
}: {
  rotulo: string;
  valor: string;
  variacao?: number | null;
  delta?: boolean;
  critico?: boolean;
  nota?: string;
}) {
  const classe = variacao == null || variacao === 0 ? "sjMini" : variacao < 0 ? "sjMkDown" : "sjMkUp";
  const texto = variacao == null ? "—" : `${variacao > 0 ? "+" : ""}${variacao.toFixed(1).replace(".", ",")}%`;
  const selo = critico && variacao != null && variacao < QUEDA_CRITICA;
  return (
    <article className="sjMkMini">
      <small>{rotulo}</small>
      <div className="v">{valor}</div>
      {delta ? <span className={classe}>{texto}{selo ? <span className="sjMkSelo">CRÍTICO</span> : null}</span> : null}
      {nota ? <p className="sjMini">{nota}</p> : null}
    </article>
  );
}
