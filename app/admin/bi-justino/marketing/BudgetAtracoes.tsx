"use client";

import { useState } from "react";
import { rotuloMes, type ZigAoVivo } from "../zigValor";
import { montarBudget, type BudgetVista } from "./budgetConta";
import { ddMm, inteiro, pctTeto, reais } from "./numeros";

type Tom = "verde" | "ambar" | "rosa";

function tomDe(pct: number): Tom {
  if (pct > 100) return "rosa";
  if (pct > 85) return "ambar";
  return "verde";
}

function classeTom(tom: Tom) {
  if (tom === "rosa") return "sjMkNumRosa";
  if (tom === "ambar") return "sjMkNumAmbar";
  return "sjMkNumVerde";
}

function faixaClasse(tom: Tom) {
  if (tom === "rosa") return "sjMkFaixaRosa";
  if (tom === "ambar") return "sjMkFaixaAmbar";
  return "sjMkFaixaVerde";
}

function pctCheio(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

function Mini({
  titulo,
  valor,
  nota,
  destaque,
  tom,
}: {
  titulo: string;
  valor: string;
  nota: string;
  destaque?: boolean;
  tom?: Tom;
}) {
  return (
    <article className={destaque ? "sjCampo sjMkDestaque" : "sjCampo"}>
      <small>{titulo}</small>
      <div className={tom ? `v ${classeTom(tom)}` : "v"}>{valor}</div>
      <p className="sjMini">{nota}</p>
    </article>
  );
}

function Barra({ pct, tom }: { pct: number; tom: Tom }) {
  return (
    <div className="sjMkBarraUso" aria-hidden="true">
      <div className={faixaClasse(tom)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function fonteBase(vista: BudgetVista) {
  if (!vista.fonteBase) return "";
  if (!vista.cresc) return vista.fonteBase;
  const pct = (vista.cresc * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return `${vista.fonteBase} • ${vista.cresc > 0 ? "+" : ""}${pct}%`;
}

function notaB(vista: BudgetVista) {
  if (vista.fatB == null || vista.part == null || vista.ticketUsado == null || vista.paxSem == null) {
    return (vista.paxSem ?? 0) > 0 ? "falta ticket ou % de reservas" : "sem reservas lançadas";
  }
  return `${inteiro(vista.paxSem)} pax ÷ ${pctCheio(vista.part)} × ticket ${reais(vista.ticketUsado)} = ${reais(vista.fatB)}`;
}

export function BudgetAtracoes({ zig, onSalvo }: { zig: ZigAoVivo | null; onSalvo: () => void }) {
  const [teto, setTeto] = useState("8");
  const [cresc, setCresc] = useState("0");
  const [mes, setMes] = useState("");
  const [semana, setSemana] = useState("");
  const [baseManual, setBaseManual] = useState("");
  const [ticket, setTicket] = useState("");
  const [pax, setPax] = useState("");
  const [part, setPart] = useState("");
  const vista = montarBudget(zig, { teto, cresc, mes, semana, baseManual, ticket, pax, part });
  const usadoMes = vista.budgetMes ? (vista.realizadoMes / vista.budgetMes) * 100 : 0;
  const tomMes = tomDe(usadoMes);
  const usadoSem = vista.recomendado ? (vista.realizadoSem / vista.recomendado) * 100 : 0;
  const tomSem = tomDe(usadoSem);
  const atracaoReal = vista.fatRealMes > 0 ? (vista.realizadoMes / vista.fatRealMes) * 100 : 0;
  const autos = [
    !ticket.trim() && vista.ticketAuto != null ? `ticket médio ${reais(vista.ticketAuto)}` : "",
    !part.trim() && vista.partAuto != null ? `reservas = ${pctCheio(vista.partAuto)} do público` : "",
  ].filter(Boolean);

  function limpar() {
    setTeto("8");
    setCresc("0");
    setMes("");
    setSemana("");
    setBaseManual("");
    setTicket("");
    setPax("");
    setPart("");
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Budget de atrações • bandas, DJs e voz e violão</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
      </div>
      <p className="sjNote">
        Cruza o faturamento do mesmo mês do ano anterior (DRE), as reservas da semana e o ticket médio para dar o teto de investimento em atrações, mensal e semanal, sem passar do percentual definido (padrão 8% do faturamento). Tudo é ajustável: campo vazio = valor automático.
      </p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Teto de atrações (% do faturamento)<input className="sjInput" type="number" min={1} max={30} step={0.5} value={teto} onChange={(evento) => setTeto(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Crescimento esperado vs ano anterior (%)<input className="sjInput" type="number" step={1} value={cresc} onChange={(evento) => setCresc(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Mês<input className="sjInput" type="month" value={mes} onChange={(evento) => setMes(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Semana (qualquer dia dela)<input className="sjInput" type="date" value={semana} onChange={(evento) => setSemana(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Faturamento-base do mês (R$) — vazio = DRE<input className="sjInput" inputMode="decimal" placeholder="automático" value={baseManual} onChange={(evento) => setBaseManual(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Ticket médio (R$) — vazio = últimas 8 semanas<input className="sjInput" inputMode="decimal" placeholder="automático" value={ticket} onChange={(evento) => setTicket(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Reservas da semana (pax) — vazio = lançadas<input className="sjInput" type="number" min={0} placeholder="automático" value={pax} onChange={(evento) => setPax(evento.target.value)} /></label></div>
        <div className="sjTb"><label>Reservas como % do público — vazio = histórico<input className="sjInput" type="number" min={1} max={100} placeholder="automático" value={part} onChange={(evento) => setPart(evento.target.value)} /></label></div>
      </div>
      <p className="sjMini">
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={limpar}>Voltar tudo ao automático</button>
        {autos.length ? <span> Automático: {autos.join(" • ")}</span> : null}
      </p>
      <h4 className="sjMkH4">Budget do mês</h4>
      <p className="sjMini">Mês {rotuloMes(vista.mes)}</p>
      {vista.baseAjustada == null || vista.budgetMes == null ? (
        <p className="sjNote">Não achei o faturamento de {vista.mesAnterior} na DRE. Informe o faturamento-base manualmente no campo acima.</p>
      ) : (
        <>
          <div className="sjCampos">
            <Mini titulo="Faturamento-base" valor={reais(vista.baseAjustada)} nota={fonteBase(vista)} />
            <Mini titulo={`Budget do mês (${pctTeto(vista.teto)})`} valor={reais(vista.budgetMes)} nota="teto de atrações" />
            <Mini titulo="Realizado no mês" valor={reais(vista.realizadoMes)} tom={tomMes} nota={`${pctCheio(usadoMes)} do budget • saldo ${reais(vista.budgetMes - vista.realizadoMes)}`} />
            <Mini titulo="Projetado lançado" valor="—" nota="a projeção de gastos não veio no painel" />
          </div>
          <Barra pct={usadoMes} tom={tomMes} />
          {vista.fatRealMes > 0 ? (
            <p className="sjMini sjMkNota">
              Sobre o faturamento real do mês até agora ({reais(vista.fatRealMes)}): atrações = <b className={atracaoReal > vista.teto * 100 ? "sjMkNumRosa" : "sjMkNumVerde"}>{atracaoReal.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</b> (teto {pctTeto(vista.teto)}).
            </p>
          ) : null}
        </>
      )}
      <h4 className="sjMkH4">Budget da semana</h4>
      <p className="sjMini">Semana de <b>{ddMm(vista.seg)}</b> a <b>{ddMm(vista.dom)}</b></p>
      <div className="sjCampos">
        <Mini titulo="(A) Pelo ano anterior" valor={vista.budA == null ? "—" : reais(vista.budA)} nota={vista.fatA == null ? "sem base do ano anterior" : `faturamento esperado ${reais(vista.fatA)}`} />
        <Mini titulo="(B) Pelas reservas" valor={vista.budB == null ? "—" : reais(vista.budB)} nota={notaB(vista)} />
        <Mini titulo="Budget recomendado" valor={vista.recomendado == null ? "—" : reais(vista.recomendado)} destaque nota={vista.bases === 2 ? "o menor entre A e B" : vista.bases === 1 ? "só uma base disponível" : "sem base"} />
        <Mini titulo="Realizado / projetado" valor={reais(vista.realizadoSem)} nota="projetado lançado —" />
      </div>
      {vista.recomendado != null ? (
        <>
          <Barra pct={usadoSem} tom={tomSem} />
          <p className="sjMini sjMkNota">
            {vista.realizadoSem > 0 ? (
              vista.realizadoSem > vista.recomendado
                ? <b className="sjMkNumRosa">Acima do recomendado em {reais(vista.realizadoSem - vista.recomendado)}</b>
                : <>Dentro do recomendado — saldo {reais(vista.recomendado - vista.realizadoSem)}</>
            ) : "Nada lançado na semana ainda."}
            {" "}(considera o realizado; a projeção de gastos não veio no painel)
          </p>
        </>
      ) : null}
      {vista.divergencia ? <p className="sjMkAviso">As bases A e B divergem mais de 30%: revise o ticket médio, as reservas da semana ou o crescimento esperado.</p> : null}
      {!vista.reservasNoPainel ? <p className="sjMkAviso">As reservas da semana não vieram no painel. A base B usa só o que você digitar em Reservas da semana.</p> : null}
      <h4 className="sjMkH4">Quanto cabe por dia e por atração (semana escolhida)</h4>
      {vista.dias.length ? (
        <div className="sjTableInner">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>% do faturamento</th>
                <th>Budget do dia</th>
                <th>Reservas (pax)</th>
                <th>Atrações</th>
                <th>Máx. por atração</th>
              </tr>
            </thead>
            <tbody>
              {vista.dias.map((dia) => (
                <tr key={dia.data}>
                  <td><b>{dia.nome}</b> <span className="sjMini">{ddMm(dia.data)}</span></td>
                  <td>{pctCheio(dia.pesoPct)}</td>
                  <td>{reais(dia.budget)}</td>
                  <td>{dia.pax == null ? "—" : inteiro(dia.pax)}</td>
                  <td>{dia.atracoes}</td>
                  <td><b>{reais(dia.maximo)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="sjMini">Sem base suficiente pra dividir por dia.</p>}
      {vista.origemPeso === "padrao" ? <p className="sjMkAviso">A divisão por dia usou o padrão semanal do painel, porque não havia faturamento dia a dia das últimas 8 semanas.</p> : null}
      <p className="sjMini sjMkNota">
        <b>Como é calculado:</b> mês = teto % × faturamento do mesmo mês do ano anterior × (1 + crescimento). Semana tem 2 bases: (A) esse faturamento ajustado pelo crescimento, dividido pelos dias do mês × 7 × teto; (B) reservas da semana ÷ (reservas como % do público) × ticket médio × teto. O recomendado é o menor dos dois. As reservas da semana são as lançadas até agora e sobem até o fim da semana — antes disso a base B é um piso. Realizado = soma do campo Gastos com atrações do registro de Marketing. Projetado = soma da projeção de gastos, que ainda não vem neste painel. A divisão por dia segue o faturamento médio de cada dia nas últimas 8 semanas, e o número de atrações segue sexta 2, sábado 3 e demais 1 — é uma conta de apoio, não uma regra.
      </p>
    </section>
  );
}
