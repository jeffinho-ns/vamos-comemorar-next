"use client";

import { useMemo, useState } from "react";
import { DuvidasBox } from "../marketing/DuvidasBox";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import "./area.css";
import {
  brl, employeeBonus, entriesFieldSeries, lastNByDate, mapasZig, pct, todayStr,
  type EntriesPayload, type FreelancerPayload, type MonthClosuresPayload, type RevenueOverviewPayload, type SalariesPayload, type ZigRevenuePayload, monthKeyLabel,
} from "./comum";
import { calcularMaster } from "./master";
import { avisosDre, faturamentoDoMes, kpisFinanceiro, valoresDaDre, type DrePayload } from "./indicadores";
import { Alertas, BarrasCusto, Collapse, Kpi, Sparkline } from "./ui";
import { FinanceiroForm } from "./FinanceiroForm";
import { UltimosEnvios } from "./UltimosEnvios";

/** Página pronta: cópia da aba Financeiro do painel do Renato lendo o espelho da planilha. */
export const PRONTA = true;

const CHAVES_FIXAS = [
  "getEntries:financeiro", "getEntries:marketing", "getEntries:rh", "getEntries:operacao", "getEntries:cmv",
  "getRevenueOverview", "getZigRevenue", "getDreBase", "getDreFaturamentoHistorico", "getMonthClosures:financeiro",
  "getFreelancerRequests", "getSalaries", "getDuvidas",
];

export function FinanceiroPagina({ onSalvo }: PaginaEspelhoProps) {
  const [mes, setMes] = useState(() => todayStr().slice(0, 7));
  const chaves = useMemo(() => [...CHAVES_FIXAS, `getDreParaMes:${mes}`], [mes]);
  const { dados, erro, carregando, recarregar } = usePlanilha(chaves);

  const entradasFin = useMemo(() => payloadDe<EntriesPayload>(dados, "getEntries:financeiro")?.docs || [], [dados]);
  const overview = payloadDe<RevenueOverviewPayload>(dados, "getRevenueOverview");
  const zig = useMemo(() => mapasZig(payloadDe<ZigRevenuePayload>(dados, "getZigRevenue")), [dados]);
  const closures = payloadDe<MonthClosuresPayload>(dados, "getMonthClosures:financeiro")?.items || [];
  const freelancers = payloadDe<FreelancerPayload>(dados, "getFreelancerRequests")?.items || null;
  const salaries = payloadDe<SalariesPayload>(dados, "getSalaries")?.rows || null;
  const dreMes = payloadDe<DrePayload>(dados, `getDreParaMes:${mes}`);
  const dreBase = payloadDe<DrePayload>(dados, "getDreBase");
  const dre = dreMes && dreMes.ok ? dreMes : dreBase;

  const master = useMemo(() => calcularMaster(overview, {
    financeiro: entradasFin,
    marketing: payloadDe<EntriesPayload>(dados, "getEntries:marketing")?.docs,
    rh: payloadDe<EntriesPayload>(dados, "getEntries:rh")?.docs,
    operacao: payloadDe<EntriesPayload>(dados, "getEntries:operacao")?.docs,
    cmv: payloadDe<EntriesPayload>(dados, "getEntries:cmv")?.docs,
  }, freelancers), [dados, entradasFin, overview, freelancers]);

  const envioDoMes = entradasFin.find((d) => d.date.slice(0, 7) === mes) || null;
  const faturamento = faturamentoDoMes(zig, mes);
  const valores = useMemo(() => valoresDaDre(dre, faturamento, envioDoMes), [dre, faturamento, envioDoMes]);
  const k = kpisFinanceiro(master, valores);
  const avisos = avisosDre(dre, monthKeyLabel(mes));
  const avisoDreMes = !dreMes || !dreMes.ok
    ? `A DRE de ${monthKeyLabel(mes)} ainda não foi copiada no banco — mostrando a base mais recente da DRE.`
    : "";
  const recentes = entradasFin.slice(0, 12);
  const bonus = salaries ? brl(employeeBonus("financeiro", master.margin, k.fnScore, salaries)) : "🔒";

  function salvo() {
    recarregar();
    onSalvo();
  }

  return (
    <div className="sjStage">
      {erro ? <p className="sjNota">{erro}</p> : null}
      <div className="sjGrid">
        <DuvidasBox area="gestores" dados={dados} onSalvo={salvo} />
        <Kpi label="Faturamento do mês" sub={overview ? `ZigPay ${brl(overview.monthRevenueZig)} + Eventos ${brl(overview.monthRevenueEventos)} = ${brl(overview.monthRevenue)}` : ""} spark={<Sparkline valores={lastNByDate(zig.revenue, 30)} cor="#c96736" />}>
          {carregando && !overview ? "Carregando…" : brl(k.rFn)}
        </Kpi>
        <Kpi label="Custos Financeiro" spark={<Sparkline valores={entriesFieldSeries(recentes, ["fnRent", "fnEnergy", "fnWater", "fnGas", "fnDisposable", "fnSecurity", "fnAdminFixed", "fnFinanceOther"])} cor="#f76e7c" />}>{brl(k.financeAbs)}</Kpi>
        <Kpi label="Economia vs meta" tip={<><b>Meta de custo − custo real do Financeiro.</b> Meta = aluguel + maior entre R$ 18 mil ou 3% do faturamento + descartáveis/segurança (% saudável do faturamento) + administrativo fixo + financeiro extraordinário (valores de referência). Positivo = abaixo da meta; negativo = estourou.</>}>
          <span className={k.fnImpact >= 0 ? "sjPos" : "sjNeg"}>{brl(k.fnImpact)}</span>
        </Kpi>
        <Kpi label="Utilidades" spark={<Sparkline valores={entriesFieldSeries(recentes, ["fnEnergy", "fnWater", "fnGas"])} cor="#f5b942" />}>{brl(k.fnUtil)}</Kpi>
        <Kpi label="Cartões" spark={<Sparkline valores={entriesFieldSeries(recentes, "fnCard")} cor="#a78bfa" />}>{pct(k.fnCard)}</Kpi>
        <Kpi label="Bônus projetado" tip="Meta anual do salário base × tempo de casa × trava pela margem da casa (0% se margem <8%, até 125% se ≥15%) × nota (50% desempenho da área + 30% margem da casa + 20% disciplina). Só aparece pro administrador do BI.">{bonus}</Kpi>

        <section className="sjCard sjBloco">
          <h3>Custo por categoria</h3>
          <BarrasCusto itens={k.barras} />
        </section>

        <FinanceiroForm
          mes={mes}
          onMes={setMes}
          faturamento={faturamento}
          valores={valores}
          avisoFallback={[avisoDreMes, avisos.fallback].filter(Boolean).join(" ")}
          avisoNaoAchados={avisos.naoAchados}
          carregandoDre={carregando && !dre}
          envioDoMes={envioDoMes}
          closures={closures}
          onSalvo={salvo}
        />

        <Alertas titulo="Alertas Financeiro" alertas={k.alertas} />

        <Collapse titulo="Últimos envios • Financeiro">
          <UltimosEnvios
            area="financeiro"
            rotuloArea="Financeiro"
            docs={entradasFin}
            closures={closures}
            caminhoApagar="/api/bi/justino/financeiro/apagar"
            onAtualizar={recarregar}
            onEditar={(doc) => setMes(doc.date.slice(0, 7))}
            onSalvo={salvo}
            stats={(doc) => {
              const v = doc.values || {};
              return [
                { label: "Faturamento", val: brl(zig.revenue[doc.date]) },
                { label: "Impostos", val: v.fnTax != null ? pct(Number(v.fnTax)) : "—" },
                { label: "Cartão", val: v.fnCard != null ? pct(Number(v.fnCard)) : "—" },
                { label: "Aluguel", val: brl(Number(v.fnRent) || 0) },
              ];
            }}
            totals={(docs) => {
              const soma = (c: string) => docs.reduce((s, e) => s + (Number(e.values?.[c]) || 0), 0);
              const fat = docs.reduce((s, e) => s + (zig.revenue[e.date] || 0), 0);
              return [
                { label: "Envios", val: String(docs.length) },
                { label: "Faturamento", val: brl(fat) },
                { label: "Aluguel", val: brl(soma("fnRent")) },
              ];
            }}
          />
        </Collapse>
      </div>
    </div>
  );
}
