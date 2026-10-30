"use client";

import { useEffect, useMemo, useState } from "react";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { BUDGET_FORM_PADRAO, montarBudget, type BudgetForm, type BudgetVista } from "./budgetConta";
import { lerEntradas, lerZig, planosPorData } from "./espelhoDados";
import type { BudgetBaseResp, DreHistoricoResp } from "./espelhoTipos";
import { ddMm, inteiro, pctTeto, reais } from "./numeros";

type Tom = "verde" | "ambar" | "rosa";
const CHAVE_LOCAL = "sjBudgetAtracoes";

function tomDe(pct: number): Tom {
  if (pct > 100) return "rosa";
  if (pct > 85) return "ambar";
  return "verde";
}
function classeTom(tom: Tom) {
  return tom === "rosa" ? "sjMkNumRosa" : tom === "ambar" ? "sjMkNumAmbar" : "sjMkNumVerde";
}
function faixaClasse(tom: Tom) {
  return tom === "rosa" ? "sjMkFaixaRosa" : tom === "ambar" ? "sjMkFaixaAmbar" : "sjMkFaixaVerde";
}
function pctCheio(valor: number) {
  return `${valor.toFixed(0)}%`;
}

function lerForm(): BudgetForm {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    if (!bruto) return BUDGET_FORM_PADRAO;
    const salvo = JSON.parse(bruto) as Partial<BudgetForm>;
    return { ...BUDGET_FORM_PADRAO, ...Object.fromEntries(Object.entries(salvo).filter(([, v]) => typeof v === "string" && v !== "")) };
  } catch {
    return BUDGET_FORM_PADRAO;
  }
}

function Mini({ titulo, valor, nota, destaque, tom }: { titulo: string; valor: string; nota: React.ReactNode; destaque?: boolean; tom?: Tom }) {
  return (
    <article className={destaque ? "sjCampo sjMkDestaque" : "sjCampo"}>
      <small>{titulo}</small>
      <div className={tom ? `v ${classeTom(tom)}` : "v"}>{valor}</div>
      <p className="sjMini">{nota}</p>
    </article>
  );
}

function Barra({ pct, tom }: { pct: number; tom: Tom }) {
  return <div className="sjMkBarraUso" aria-hidden="true"><div className={faixaClasse(tom)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>;
}

function notaB(v: BudgetVista) {
  if (v.fatB == null || v.part == null || v.ticketUsado == null) return v.paxSem > 0 ? "falta ticket ou % de reservas" : "sem reservas lançadas";
  return `${inteiro(v.paxSem)} pax ÷ ${v.part.toFixed(0)}% × ticket ${reais(v.ticketUsado)} = ${reais(v.fatB)}`;
}

/** Card "💰 Budget de atrações • bandas, DJs e voz e violão" (baRender). */
export function BudgetAtracoes({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const [form, setForm] = useState<BudgetForm>(BUDGET_FORM_PADRAO);
  useEffect(() => {
    setForm(lerForm());
  }, []);
  const entrada = useMemo(() => {
    const base = payloadDe<BudgetBaseResp>(dados, "getBudgetAtracoesBase");
    const dre = payloadDe<DreHistoricoResp>(dados, "getDreFaturamentoHistorico");
    return {
      zig: lerZig(dados),
      serieDre: dre?.ok ? (dre.serie ?? []) : [],
      paxPorData: base?.paxPorData ?? {},
      temPax: Boolean(base?.ok),
      mkDocs: lerEntradas(dados, "marketing"),
      planos: planosPorData(dados),
    };
  }, [dados]);
  const v = montarBudget(entrada, form);
  const usadoMes = v.budgetMes ? (v.realizadoMes / v.budgetMes) * 100 : 0;
  const tomMes = tomDe(usadoMes);
  const ref2 = Math.max(v.realizadoSem, v.planSem);
  const usadoSem = v.recomendado ? (ref2 / v.recomendado) * 100 : 0;
  const tomSem = tomDe(usadoSem);
  const atracaoReal = v.fatRealMes > 0 ? (v.realizadoMes / v.fatRealMes) * 100 : 0;
  const autos = [
    v.ticketAuto && !form.ticket.trim() ? `ticket médio ${reais(v.ticketAuto)}` : "",
    v.partAuto && !form.part.trim() ? `reservas = ${v.partAuto.toFixed(0)}% do público` : "",
  ].filter(Boolean);

  function campo(chave: keyof BudgetForm, valor: string) {
    setForm((atual) => {
      const proximo = { ...atual, [chave]: valor };
      try {
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify(proximo));
      } catch {
        return proximo;
      }
      return proximo;
    });
  }

  function limpar() {
    setForm(BUDGET_FORM_PADRAO);
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(BUDGET_FORM_PADRAO));
    } catch {
      return;
    }
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>💰 Budget de atrações • bandas, DJs e voz e violão</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      <p className="sjNote">Cruza o <b>faturamento do mesmo mês do ano anterior</b> (DRE), as <b>reservas da semana</b> e o <b>ticket médio</b> para dar o teto de investimento em atrações, mensal e semanal, sem passar do percentual definido (padrão 8% do faturamento). Tudo é ajustável: campo vazio = valor automático.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Teto de atrações (% do faturamento)<input className="sjInput" type="number" min={1} max={30} step={0.5} value={form.teto} onChange={(e) => campo("teto", e.target.value)} /></label></div>
        <div className="sjTb"><label>Crescimento esperado vs ano anterior (%)<input className="sjInput" type="number" step={1} value={form.cresc} onChange={(e) => campo("cresc", e.target.value)} /></label></div>
        <div className="sjTb"><label>Mês<input className="sjInput" type="month" value={form.mes} onChange={(e) => campo("mes", e.target.value)} /></label></div>
        <div className="sjTb"><label>Semana (qualquer dia dela)<input className="sjInput" type="date" value={form.semana} onChange={(e) => campo("semana", e.target.value)} /></label></div>
        <div className="sjTb"><label>Faturamento-base do mês (R$) — vazio = DRE<input className="sjInput" inputMode="decimal" placeholder="automático" value={form.baseManual} onChange={(e) => campo("baseManual", e.target.value)} /></label></div>
        <div className="sjTb"><label>Ticket médio (R$) — vazio = últimas 8 semanas<input className="sjInput" inputMode="decimal" placeholder="automático" value={form.ticket} onChange={(e) => campo("ticket", e.target.value)} /></label></div>
        <div className="sjTb"><label>Reservas da semana (pax) — vazio = lançadas<input className="sjInput" type="number" min={0} placeholder="automático" value={form.pax} onChange={(e) => campo("pax", e.target.value)} /></label></div>
        <div className="sjTb"><label>Reservas como % do público — vazio = histórico<input className="sjInput" type="number" min={1} max={100} placeholder="automático" value={form.part} onChange={(e) => campo("part", e.target.value)} /></label></div>
      </div>
      <p className="sjMini">
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={limpar}>Voltar tudo ao automático</button>
        {autos.length ? <span> Automático: {autos.join(" • ")}</span> : null}
      </p>
      <h4 className="sjMkH4">Budget do mês</h4>
      {v.baseAjustada == null || v.budgetMes == null ? (
        <p className="sjNote">Não achei o faturamento de {v.mesAnteriorLabel} na DRE. Informe o faturamento-base manualmente no campo acima.</p>
      ) : (
        <>
          <div className="sjCampos">
            <Mini titulo="Faturamento-base" valor={reais(v.baseAjustada)} nota={`${v.fonteBase ?? ""}${v.cresc ? ` • ${v.cresc > 0 ? "+" : ""}${(v.cresc * 100).toFixed(0)}%` : ""}`} />
            <Mini titulo={`Budget do mês (${pctTeto(v.teto)})`} valor={reais(v.budgetMes)} nota="teto de atrações" />
            <Mini titulo="Realizado no mês" valor={reais(v.realizadoMes)} tom={tomMes} nota={`${pctCheio(usadoMes)} do budget • saldo ${reais(v.budgetMes - v.realizadoMes)}`} />
            <Mini titulo="Projetado lançado" valor={reais(v.planMes)} nota={v.planMes > v.budgetMes ? <b className="sjMkNumRosa">acima do budget</b> : "dentro do budget"} />
          </div>
          <Barra pct={usadoMes} tom={tomMes} />
          {v.fatRealMes > 0 ? (
            <p className="sjMini sjMkNota">Sobre o faturamento <b>real</b> do mês até agora ({reais(v.fatRealMes)}): atrações = <b className={atracaoReal > v.teto * 100 ? "sjMkNumRosa" : "sjMkNumVerde"}>{atracaoReal.toFixed(1).replace(".", ",")}%</b> (teto {pctTeto(v.teto)}).</p>
          ) : null}
        </>
      )}
      <h4 className="sjMkH4">Budget da semana</h4>
      <p className="sjMini">Semana de <b>{ddMm(v.seg)}</b> a <b>{ddMm(v.dom)}</b></p>
      <div className="sjCampos">
        <Mini titulo="(A) Pelo ano anterior" valor={v.budA == null ? "—" : reais(v.budA)} nota={v.fatA == null ? "sem base do ano anterior" : `faturamento esperado ${reais(v.fatA)}`} />
        <Mini titulo="(B) Pelas reservas" valor={v.budB == null ? "—" : reais(v.budB)} nota={notaB(v)} />
        <Mini titulo="Budget recomendado" valor={v.recomendado == null ? "—" : reais(v.recomendado)} destaque nota={v.bases === 2 ? "o menor entre A e B" : v.bases === 1 ? "só uma base disponível" : "sem base"} />
        <Mini titulo="Realizado / projetado" valor={reais(v.realizadoSem)} nota={`projetado lançado ${reais(v.planSem)}`} />
      </div>
      {v.recomendado != null ? (
        <>
          <Barra pct={usadoSem} tom={tomSem} />
          <p className="sjMini sjMkNota">
            {ref2 > 0 ? (usadoSem > 100 ? <b className="sjMkNumRosa">Acima do recomendado em {reais(ref2 - v.recomendado)}</b> : <>Dentro do recomendado — saldo {reais(v.recomendado - ref2)}</>) : "Nada lançado na semana ainda."}
            {" "}<span style={{ opacity: 0.7 }}>(considera o maior entre realizado e projetado)</span>
          </p>
        </>
      ) : null}
      {v.divergencia ? <p className="sjMkAviso">As bases A e B divergem mais de 30%: revise o ticket médio, as reservas da semana ou o crescimento esperado.</p> : null}
      {!v.temPax ? <p className="sjMkAviso">Não consegui ler as reservas. A base B usa só o que você digitar em &quot;Reservas da semana&quot;.</p> : null}
      <h4 className="sjMkH4">Quanto cabe por dia e por atração (semana escolhida)</h4>
      {v.dias.length ? (
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Dia</th><th>% do faturamento</th><th>Budget do dia</th><th>Reservas (pax)</th><th>Atrações</th><th>Máx. por atração</th></tr></thead>
            <tbody>
              {v.dias.map((dia) => (
                <tr key={dia.data}>
                  <td><b>{dia.nome}</b> <span className="sjMini">{ddMm(dia.data)}</span></td>
                  <td>{pctCheio(dia.pesoPct)}</td>
                  <td>{reais(dia.budget)}</td>
                  <td>{inteiro(dia.pax)}</td>
                  <td>{dia.atracoes}</td>
                  <td><b>{reais(dia.maximo)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="sjMini">Sem base suficiente pra dividir por dia.</p>}
      <p className="sjMini sjMkNota">
        <b>Como é calculado:</b> <b>mês</b> = teto % × faturamento do mesmo mês do ano anterior × (1 + crescimento). <b>Semana</b> tem 2 bases: (A) o faturamento do ano anterior dividido pelos dias do mês × 7; (B) reservas da semana ÷ (reservas como % do público) × ticket médio. O <b>recomendado é o menor dos dois</b>, para não passar do teto. As reservas da semana são as <b>lançadas até agora</b> e sobem até o fim da semana — antes disso a base B é um piso. <b>Realizado</b> = soma do campo &quot;Gastos com atrações&quot; do registro de Marketing; <b>projetado</b> = soma da Projeção de gastos. A divisão por dia segue o faturamento médio de cada dia da semana nas últimas 8 semanas, e o nº de atrações por dia segue a sugestão de horário (sexta 2, sábado 3, demais 1) — é uma conta de apoio, não uma regra.
      </p>
    </section>
  );
}
