"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import { CONTEUDO } from "../conteudo";
import { DuvidasBox } from "../marketing/DuvidasBox";
import { GraficoLinha } from "../marketing/GraficoLinha";
import { textoTendencia } from "../marketing/numeros";
import "../financeiro/area.css";
import {
  brl, employeeBonus, entriesFieldSeries, fmtDate, freelancerMonthlyApprovedCost, isMonthClosedFor, mapasZig, mesesIso, numero, parseBRL, pct, todayStr,
  type EntriesPayload, type FreelancerPayload, type MonthClosuresPayload, type RevenueOverviewPayload, type SalariesPayload, type ZigRevenuePayload,
} from "../financeiro/comum";
import { calcularMaster } from "../financeiro/master";
import { Alertas, Badge, Collapse, Kpi, Sparkline } from "../financeiro/ui";
import { UltimosEnvios } from "../financeiro/UltimosEnvios";
import { RhForm, RASCUNHO_VAZIO, type RascunhoRh } from "./RhForm";
import { RhAprovacaoFreelancers, RhHorarioFuncionamento } from "./RhAprovacaoFreelancers";
import { RhQuadroMinimo } from "./RhQuadroMinimo";
import { RhColaboradores } from "./RhColaboradores";
import { RhColaboradorForm } from "./RhColaboradorForm";
import { kpisRh, paxPorData, resumoAtivos, servicoDoMes, servicoLiquidoDoMes } from "./rhCalc";
import { fichaVazia, type Employee, type EmployeesMonthPayload, type EmployeesPayload, type FichaMes, type ReservationsPayload, type SectorBasePayload } from "./rhTipos";

/** Página pronta: cópia da aba RH do painel do Renato lendo o espelho da planilha. */
export const PRONTA = true;

const MESES_FICHA = mesesIso(2);
const CHAVES_FIXAS = [
  "getEntries:rh", "getEntries:financeiro", "getEntries:marketing", "getEntries:operacao", "getEntries:cmv",
  "getRevenueOverview", "getZigRevenue", "getEmployees", "getSalaries", "getSectorBase", "getFreelancerRequests",
  "getMonthClosures:rh", "getReservations", "getDailyAttendance", "getDuvidas",
  ...MESES_FICHA.map((mk) => `getEmployeesMonth:${mk}`),
];

export function RhPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.rh;
  const aba = subId === "colab" ? "colab" : "daily";
  const [mes, setMes] = useState(() => todayStr().slice(0, 7));
  const [mesFiltro, setMesFiltro] = useState("");
  const [rascunho, setRascunho] = useState<RascunhoRh>(RASCUNHO_VAZIO);
  const [editando, setEditando] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<Employee | null>(null);
  const chaves = useMemo(() => (mesFiltro ? [...CHAVES_FIXAS, `getEmployeesMonth:${mesFiltro}`] : CHAVES_FIXAS), [mesFiltro]);
  const { dados, erro, carregando, recarregar } = usePlanilha(chaves);

  const entradasRh = useMemo(() => payloadDe<EntriesPayload>(dados, "getEntries:rh")?.docs || [], [dados]);
  const overview = payloadDe<RevenueOverviewPayload>(dados, "getRevenueOverview");
  const zig = useMemo(() => mapasZig(payloadDe<ZigRevenuePayload>(dados, "getZigRevenue")), [dados]);
  const employees = useMemo(() => payloadDe<EmployeesPayload>(dados, "getEmployees")?.items || [], [dados]);
  const salaries = payloadDe<SalariesPayload>(dados, "getSalaries")?.rows || null;
  const sectorBase = payloadDe<SectorBasePayload>(dados, "getSectorBase")?.bySector || {};
  const freelancers = useMemo(() => payloadDe<FreelancerPayload>(dados, "getFreelancerRequests")?.items || [], [dados]);
  const closures = payloadDe<MonthClosuresPayload>(dados, "getMonthClosures:rh")?.items || [];
  const paxReservas = useMemo(() => paxPorData(payloadDe<ReservationsPayload>(dados, "getReservations")?.docs), [dados]);
  const mesPayload = mesFiltro ? payloadDe<EmployeesMonthPayload>(dados, `getEmployeesMonth:${mesFiltro}`) : null;
  const snaps = useMemo(() => {
    const saida: Record<string, FichaMes> = {};
    (mesPayload?.items || []).forEach((x) => { saida[x.employeeId] = x.snapshot; });
    return saida;
  }, [mesPayload]);

  const master = useMemo(() => calcularMaster(overview, {
    financeiro: payloadDe<EntriesPayload>(dados, "getEntries:financeiro")?.docs,
    marketing: payloadDe<EntriesPayload>(dados, "getEntries:marketing")?.docs,
    rh: entradasRh,
    operacao: payloadDe<EntriesPayload>(dados, "getEntries:operacao")?.docs,
    cmv: payloadDe<EntriesPayload>(dados, "getEntries:cmv")?.docs,
  }, freelancers), [dados, entradasRh, overview, freelancers]);

  const envioDoMes = entradasRh.find((d) => d.date.slice(0, 7) === mes) || null;
  const ultimo = entradasRh[0] || null;

  // autoloadEntryForDate: trocar o mês carrega o envio já gravado (ou limpa o rascunho). Reage só a mês/envio novo,
  // não a cada recarga do espelho — senão apagaria o que a pessoa está digitando.
  const chaveEnvio = envioDoMes ? `${envioDoMes.date}|${envioDoMes.submittedAt || ""}` : "";
  useEffect(() => {
    const v = envioDoMes?.values;
    setRascunho(v ? {
      rhCore: v.rhCore != null ? String(v.rhCore) : "",
      rhExtras: v.rhExtras != null ? String(v.rhExtras) : "",
      rhHead: v.rhHead != null ? String(v.rhHead) : "",
      rhServicoDesconto: v.rhServicoDesconto != null ? String(v.rhServicoDesconto) : "",
    } : RASCUNHO_VAZIO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, chaveEnvio]);

  const ativos = resumoAtivos(employees);
  const automatico = ativos.quantidade > 0 && !editando;
  const rhCore = automatico ? ativos.total : parseBRL(rascunho.rhCore);
  const rhHead = automatico ? ativos.quantidade : Math.round(Number(rascunho.rhHead) || 0);
  const rhExtrasNow = rascunho.rhExtras !== "" ? parseBRL(rascunho.rhExtras) : numero(ultimo?.values?.rhExtras);
  const descontoNow = rascunho.rhServicoDesconto !== "" ? Math.max(0, parseBRL(rascunho.rhServicoDesconto)) : Math.max(0, numero(ultimo?.values?.rhServicoDesconto));
  const freelancerCost = freelancerMonthlyApprovedCost(freelancers, mes);
  const servicoRh = servicoDoMes(zig, mes, descontoNow);
  // base do CMO: faturamento do mês menos o serviço líquido do mês de referência do Financeiro (mês atual)
  const k = kpisRh(master, rhCore, rhExtrasNow, freelancerCost, servicoLiquidoDoMes(zig, todayStr().slice(0, 7), descontoNow));
  const recentes = entradasRh.slice(0, 12);
  const cronologicos = [...recentes].reverse();
  const bonus = salaries ? brl(employeeBonus("rh", master.margin, k.rhScore, salaries)) : "🔒";

  function salvo() {
    recarregar();
    onSalvo();
  }

  const subAbas = (
    <div className="sjSubs">
      {abas.map((item) => (
        <button key={item.id} type="button" className={item.id === aba ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>
      ))}
    </div>
  );

  if (aba === "colab") {
    return (
      <>
        {subAbas}
        <div key="colab" className="sjStage">
          {erro ? <p className="sjNota">{erro}</p> : null}
          <div className="sjGrid">
            <Collapse titulo="Quadro mínimo por setor" aberto>
              <RhQuadroMinimo sectorBase={sectorBase} employees={employees} onAtualizar={recarregar} onSalvo={salvo} />
            </Collapse>
            <Collapse titulo="Colaboradores" aberto>
              <RhColaboradores
                employees={employees}
                mesFiltro={mesFiltro}
                onMesFiltro={setMesFiltro}
                snaps={snaps}
                mesFechado={Boolean(mesPayload?.closed) || (mesFiltro ? isMonthClosedFor(closures, "rh", mesFiltro) : false)}
                temCopiaDoMes={!mesFiltro || Boolean(mesPayload)}
                onAtualizar={recarregar}
                onEditar={(e) => setFichaAberta(e)}
                onNovo={() => setFichaAberta(fichaVazia(todayStr().slice(0, 7)))}
                onSalvo={salvo}
              />
            </Collapse>
            {fichaAberta ? (
              <RhColaboradorForm
                key={fichaAberta.id || "novo"}
                ficha={fichaAberta}
                mesInicial={mesFiltro}
                snaps={snaps}
                mesFechado={(mk) => isMonthClosedFor(closures, "rh", mk)}
                onFechar={() => setFichaAberta(null)}
                onSalvo={salvo}
              />
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {subAbas}
        <div key="daily" className="sjStage">
          {erro ? <p className="sjNota">{erro}</p> : null}
          <div className="sjGrid">
            <DuvidasBox area="rh" dados={dados} onSalvo={salvo} />
            <Kpi label="RH estrutural" spark={<Sparkline valores={entriesFieldSeries(recentes, "rhCore")} cor="#c96736" />}>{carregando && !employees.length && !entradasRh.length ? "Carregando…" : brl(rhCore)}</Kpi>
          <Kpi label="Extras">{brl(k.extrasTotal)}</Kpi>
          <Kpi label="CMO / receita (sem taxa de serviço)" tip={<>
            <b>Definição do CMO:</b> percentual do faturamento (sem a taxa de serviço, que é repassada à equipe) usado para pagar a folha regular — salários base, encargos (INSS/FGTS), provisões de 13º/férias, benefícios e extras/freelancers.
            <div className="sjKpiTipRow"><span>🟢 ≤ 19%</span><span>🟡 até 23%</span><span>🔴 acima de 23%</span></div>
            <div>Meta = 15% RH estrutural + 4% extras do faturamento. Atenção = mesma folga usada nos alertas de RH estrutural (até 18%) e Extras (até 5%) somada.</div>
            <div>Como estamos: <b>{pct(k.rhRate)}</b> <Badge nivel={k.cmoStatus[0]}>{k.cmoStatus[1]}</Badge></div>
          </>}>{pct(k.rhRate)}</Kpi>
          <Kpi label="Economia vs meta" tip={<><b>Meta de custo − custo real de pessoal.</b> Meta = 19% do faturamento do mês, sem a taxa de serviço (15% RH estrutural + 4% extras). Custo real = RH estrutural + extras + freelancers aprovados no mês. Positivo = abaixo da meta; negativo = estourou.</>}>
            <span className={k.rhImpact >= 0 ? "sjPos" : "sjNeg"}>{brl(k.rhImpact)}</span>
          </Kpi>
          <Kpi label="Colaboradores ativos" sub={ativos.quantidade ? ativos.detalhe : "CLT + INT + PJ"}>{rhHead}</Kpi>
          <Kpi label="Serviço do mês" sub={servicoRh.dias ? (descontoNow ? `${brl(servicoRh.bruto)} − desconto ${brl(descontoNow)} • ref. ${servicoRh.mk.slice(5)}/${servicoRh.mk.slice(0, 4)}` : `taxa de serviço, ZigPay • ref. ${servicoRh.mk.slice(5)}/${servicoRh.mk.slice(0, 4)}`) : "taxa de serviço, ZigPay"}>{servicoRh.dias ? brl(servicoRh.liquido) : "—"}</Kpi>
          <Kpi label="Bônus RH" tip="Meta anual do salário base × tempo de casa × trava pela margem da casa (0% se margem <8%, até 125% se ≥15%) × nota (50% desempenho da área + 30% margem da casa + 20% disciplina). Só aparece pro administrador do BI.">{bonus}</Kpi>

          <section className="sjCard sjBloco">
            <h3>RH estrutural — envios recentes</h3>
            <GraficoLinha
              rotulos={cronologicos.map((d) => fmtDate(d.date))}
              series={[{ nome: "RH estrutural", cor: "#c96736", area: true, valores: entriesFieldSeries(recentes, "rhCore") }]}
              aria="RH estrutural por envio"
              analise={textoTendencia("RH estrutural", cronologicos.map((d) => fmtDate(d.date)), entriesFieldSeries(recentes, "rhCore").map((v) => v ?? 0))}
              vazio="Sem envios suficientes ainda."
            />
          </section>

          <Collapse titulo="Aprovação de freelancers">
            <RhAprovacaoFreelancers pedidos={freelancers} sectorBase={sectorBase} employees={employees} zig={zig} paxReservas={paxReservas} onAtualizar={recarregar} onSalvo={salvo} />
          </Collapse>
          <Collapse titulo="Horário de funcionamento">
            <RhHorarioFuncionamento />
          </Collapse>

          <RhForm
            mes={mes}
            onMes={setMes}
            employees={employees}
            zig={zig}
            envioDoMes={envioDoMes}
            closures={closures}
            freelancerCost={freelancerCost}
            rascunho={rascunho}
            onRascunho={setRascunho}
            editando={editando}
            onEditando={setEditando}
            onSalvo={salvo}
          />

          <section className="sjCard sjBloco">
            <h3>Regra de bônus</h3>
            <p className="sjNote">
              <b>Gatilho por margem da casa:</b><br />• &lt; 8%: 0%<br />• 8–10%: 25%<br />• 10–12%: 60%<br />• 12–15%: 100%<br />• ≥15%: 125% (teto)<br /><br />
              <b>Peso:</b> 50% desempenho da área + 30% resultado da casa + 20% disciplina de preenchimento.<br /><br />
              <b>Elegibilidade:</b> precisa estar ativo no fechamento do ciclo, com pró-rata pelos dias no ciclo. Salário e admissão vêm exclusivamente da seção &quot;Elegibilidade do bônus&quot; da Diretoria.
            </p>
          </section>

          <Alertas titulo="Alertas RH" alertas={k.alertas} />

          <Collapse titulo="Últimos envios • RH">
            <UltimosEnvios
              area="rh"
              rotuloArea="RH"
              docs={entradasRh}
              closures={closures}
              caminhoApagar="/api/bi/justino/rh/apagar"
              onAtualizar={recarregar}
              onEditar={(doc) => setMes(doc.date.slice(0, 7))}
              onSalvo={salvo}
              stats={(doc) => {
                const v = doc.values || {};
                const freel = numero(v.freelancerApprovedCost);
                const extras = numero(v.rhExtras) + freel;
                return [
                  { label: "RH estrutural", val: brl(numero(v.rhCore)) },
                  { label: "Extras", val: brl(extras) + (freel ? ` (freel.: ${brl(freel)})` : "") },
                  { label: "Colaboradores ativos", val: v.rhHead != null ? String(v.rhHead) : "—" },
                ];
              }}
              totals={(docs) => {
                const soma = (c: string) => docs.reduce((s, e) => s + numero(e.values?.[c]), 0);
                const extras = docs.reduce((s, e) => s + numero(e.values?.rhExtras) + numero(e.values?.freelancerApprovedCost), 0);
                return [
                  { label: "Envios", val: String(docs.length) },
                  { label: "RH estrutural", val: brl(soma("rhCore")) },
                  { label: "Extras", val: brl(extras) },
                ];
              }}
            />
          </Collapse>
        </div>
      </div>
    </>
  );
}
