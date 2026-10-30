"use client";

import { useMemo, useState } from "react";
import type { ZigAoVivo } from "../zigValor";

type Nivel = "g" | "y" | "r";
type Plano = { data: string; trafego: number; outros: number; atracoes: number; publico: number; ticket: number; nota: string };
type Leitura = { titulo: string; valor: string; nivel: Nivel; selo: string; detalhe: string };
type LinhaZig = Record<string, number | string | null>;

const SEMANA = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const NOME: Record<Nivel, string> = { g: "SAUDÁVEL", y: "ATENÇÃO", r: "CRÍTICO" };

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function somarDias(iso: string, dias: number) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

function numero(texto: string) {
  const limpo = texto.trim();
  if (!limpo) return 0;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

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

function pct(valor: number) {
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const nome = SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()] || "";
  return `${nome} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

function numCampo(linha: LinhaZig | undefined, chave: string) {
  const valor = linha?.[chave];
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function faixaDe(valor: number, saudavel: number, atencao: number): Nivel {
  if (valor <= saudavel) return "g";
  if (valor <= atencao) return "y";
  return "r";
}

function leituras(receita: number, gasto: number, trafego: number, atracoes: number, roas: number): Leitura[] {
  if (!receita) {
    return [{ titulo: "Preencha público esperado e ticket médio", valor: "Sem faturamento projetado para comparar com o gasto", nivel: "y", selo: "ATENÇÃO", detalhe: "" }];
  }
  const faixa = Math.max(4500, receita * 0.00855) + 4500 + receita * 0.08;
  const atracaoPct = (atracoes / receita) * 100;
  const trafegoPct = (trafego / receita) * 100;
  const nivelGasto = faixaDe(gasto, faixa, faixa * 1.15);
  const nivelAtracao = faixaDe(atracaoPct, 8, 9.2);
  const nivelTrafego = faixaDe(trafegoPct, 0.855, 0.855 * 1.4);
  const nivelRoas: Nivel = roas >= 15 ? "g" : roas >= 8 ? "y" : "r";
  const condiz: Nivel = gasto <= faixa * 1.15 && roas >= 15 && atracaoPct <= 9.2 ? "g" : roas >= 8 && gasto <= faixa * 1.4 ? "y" : "r";
  return [
    { titulo: "Veredito", valor: `${reais(gasto)} de gasto para ${reais(receita)} de faturamento esperado`, nivel: condiz, selo: condiz === "g" ? "CONDIZENTE" : condiz === "y" ? "ATENÇÃO" : "NÃO CONDIZENTE", detalhe: "Condizente exige gasto, ROAS e atrações saudáveis. Atenção aceita ROAS de pelo menos 8x com gasto até 40% acima da faixa." },
    { titulo: "Gasto total vs faixa saudável para esse faturamento", valor: `${reais(gasto)} • referência ${reais(faixa)}`, nivel: nivelGasto, selo: NOME[nivelGasto], detalhe: "Faixa = maior entre R$ 4.500 e 0,855% do faturamento (tráfego) + R$ 4.500 (outros) + 8% do faturamento (atrações)." },
    { titulo: "ROAS esperado", valor: `${roas.toFixed(1).replace(".", ",")}x`, nivel: nivelRoas, selo: nivelRoas === "g" ? "SAUDÁVEL" : nivelRoas === "y" ? "ATENÇÃO" : "CRÍTICO", detalhe: "Faturamento projetado ÷ gasto total. Saudável a partir de 15x. Abaixo de 8x é crítico." },
    { titulo: "Atrações vs faturamento esperado", valor: pct(atracaoPct), nivel: nivelAtracao, selo: NOME[nivelAtracao], detalhe: "Teto saudável: 8% do faturamento esperado. Atenção até 9,2%." },
    { titulo: "Tráfego pago vs faturamento esperado", valor: pct(trafegoPct), nivel: nivelTrafego, selo: NOME[nivelTrafego], detalhe: "Saudável até 0,855% do faturamento. Atenção até cerca de 1,2%." },
  ];
}

export function MarketingProjecaoPainel({ zig }: { zig: ZigAoVivo | null }) {
  const [data, setData] = useState(() => somarDias(hojeSp(), 1));
  const [trafego, setTrafego] = useState("");
  const [outros, setOutros] = useState("");
  const [atracoes, setAtracoes] = useState("");
  const [publico, setPublico] = useState("");
  const [ticket, setTicket] = useState("");
  const [nota, setNota] = useState("");
  const [status, setStatus] = useState("");
  const [planos, setPlanos] = useState<Plano[]>([]);
  const trafegoN = numero(trafego);
  const outrosN = numero(outros);
  const atracoesN = numero(atracoes);
  const publicoN = numero(publico);
  const ticketN = numero(ticket);
  const gasto = trafegoN + outrosN + atracoesN;
  const faturamento = publicoN * ticketN;
  const roas = gasto > 0 ? faturamento / gasto : 0;
  const cac = publicoN > 0 ? gasto / publicoN : 0;
  const checks = leituras(faturamento, gasto, trafegoN, atracoesN, roas);

  const linhas = useMemo(() => comparar(planos, zig, hojeSp()), [planos, zig]);

  function salvar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setStatus("Escolha uma data.");
      return;
    }
    if (!trafegoN && !outrosN && !atracoesN && !publicoN && !ticketN) {
      setStatus("Informe ao menos um valor para salvar.");
      return;
    }
    const plano: Plano = { data, trafego: trafegoN, outros: outrosN, atracoes: atracoesN, publico: publicoN, ticket: ticketN, nota: nota.trim() };
    setPlanos((lista) => [plano, ...lista.filter((item) => item.data !== data)]);
    setStatus(`Projeção guardada nesta tela para ${dataCurta(data)}.`);
  }

  function limpar() {
    setTrafego("");
    setOutros("");
    setAtracoes("");
    setPublico("");
    setTicket("");
    setNota("");
    setStatus("Campos limpos. A projeção já guardada nesta tela continua.");
  }

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole"><h3>Projeção de gastos • agendamento futuro</h3><span className="sjBadgeP">PLANEJAMENTO</span></div>
        <div className="sjToolbar">
          <div className="sjTb"><label>Data<input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Tráfego projetado<input className="sjInput" inputMode="decimal" value={trafego} onChange={(evento) => setTrafego(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Outros projetado<input className="sjInput" inputMode="decimal" value={outros} onChange={(evento) => setOutros(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Atrações projetado<input className="sjInput" inputMode="decimal" value={atracoes} onChange={(evento) => setAtracoes(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Público esperado<input className="sjInput" inputMode="numeric" value={publico} onChange={(evento) => setPublico(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Ticket médio esperado<input className="sjInput" inputMode="decimal" value={ticket} onChange={(evento) => setTicket(evento.target.value)} /></label></div>
          <button type="button" className="sjAnaliseBtn" onClick={salvar}>Salvar projeção</button>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={limpar}>Apagar dados digitados</button>
          <span className="sjMini" role="status">{status}</span>
        </div>
        <p className="sjMini">A projeção fica nesta tela. O painel ainda não grava esse agendamento na planilha.</p>
        <label className="sjFormBloco">
          <b>Observação da projeção</b>
          <textarea className="sjInput" rows={2} value={nota} onChange={(evento) => setNota(evento.target.value)} />
          <p className="sjMini">Contexto: evento especial, campanha sazonal, etc.</p>
        </label>
      </section>
      <div className="sjMkKpis">
        <article className="sjCard"><small>Faturamento projetado</small><div className="v">{reais(faturamento)}</div><span className="sjMini">público × ticket médio</span></article>
        <article className="sjCard"><small>Gasto total projetado</small><div className="v">{reais(gasto)}</div><span className="sjMini">tráfego + outros + atrações</span></article>
        <article className="sjCard"><small>ROAS esperado</small><div className="v">{gasto > 0 ? `${roas.toFixed(1).replace(".", ",")}x` : "—"}</div><span className="sjMini">faturamento ÷ gasto</span></article>
        <article className="sjCard"><small>CAC esperado</small><div className="v">{publicoN > 0 ? reais(cac) : "—"}</div><span className="sjMini">gasto ÷ público</span></article>
      </div>
      <section className="sjCard sjBloco">
        <div className="sjRole"><h3>Vale a pena abrir nesse dia?</h3><span className="sjBadgeP">MARGEM DE CONTRIBUIÇÃO</span></div>
        <p className="sjNote">Custo fixo médio por dia de abertura (aluguel, RH, administrativo, utilidades) vem do último envio real do Financeiro/RH, rateado pelos dias que a casa abre no mês (sem segunda-feira). Custo variável médio (impostos + cartão + fee de administração + CMV real) vem do histórico e é aplicado sobre o faturamento projetado. Você só preenche o que é seu: tráfego, atrações, outros e a expectativa de público/ticket, lá em cima.</p>
        <div className="sjCampos">
          <div className="sjCampo"><small>Custo fixo médio por dia de abertura</small><div className="v">—</div></div>
          <div className="sjCampo"><small>Custo variável médio (% da receita)</small><div className="v">—</div></div>
          <div className="sjCampo"><small>Custo variável estimado do dia</small><div className="v">—</div></div>
          <div className="sjCampo"><small>Seu custo estimado (Marketing)</small><div className="v">{reais(gasto)}</div><span className="sjMini">mesmo valor do gasto projetado acima</span></div>
          <div className="sjCampo"><small>Margem de contribuição do dia</small><div className="v">—</div><span className="sjMini">faturamento − custo fixo − custo variável − marketing</span></div>
        </div>
        <p className="sjMini">O painel não traz custo fixo nem custo variável por dia. Sem esses números, a margem fica em branco.</p>
      </section>
      <section className="sjCard sjBloco">
        <h3>A atração e os gastos são condizentes com o faturamento esperado?</h3>
        <p className="sjMini">O teto saudável da atração é 8% do faturamento projetado.</p>
        <div className="sjAlerts">
          {checks.map((item) => (
            <article key={item.titulo} className={`sjAlert ${item.nivel}`}>
              <span className="sjAlertIcon" aria-hidden="true">{item.nivel === "g" ? "✓" : "!"}</span>
              <div>
                <b>{item.titulo} • {item.selo}</b>
                <div>{item.valor}</div>
                {item.detalhe ? <p className="sjMini">{item.detalhe}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
      <details className="sjCollapse">
        <summary><span className="sjChev">▸</span>Projetado × Realizado<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <h3>Projetado × Realizado</h3>
          <p className="sjMini">O realizado entra quando a data da projeção bate com a Zig (faturamento do dia) ou com um lançamento de marketing (gasto). Dia futuro não conta como realizado zerado.</p>
          <div className="sjTableInner">
            <table>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Faturamento projetado</th>
                  <th scope="col">Faturamento realizado</th>
                  <th scope="col">Diferença (faturamento)</th>
                  <th scope="col">Gasto projetado</th>
                  <th scope="col">Gasto realizado</th>
                  <th scope="col">Diferença (gasto)</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.length ? linhas.map((linha) => (
                  <tr key={linha.data}>
                    <td>{dataCurta(linha.data)}</td>
                    <td>{linha.fatPlan == null ? "—" : reais(linha.fatPlan)}</td>
                    <td>{linha.fatReal == null ? "—" : reais(linha.fatReal)}</td>
                    <td className={classeDelta(linha.diffFat)}>{linha.diffFat == null ? "—" : reaisDelta(linha.diffFat)}</td>
                    <td>{linha.gastoPlan == null ? "—" : reais(linha.gastoPlan)}</td>
                    <td>{linha.gastoReal == null ? "—" : reais(linha.gastoReal)}</td>
                    <td className={classeDelta(linha.diffGasto)}>{linha.diffGasto == null ? "—" : reaisDelta(linha.diffGasto)}</td>
                    <td>{linha.diffGasto == null ? "—" : linha.diffGasto >= 0 ? <span className="sjBadge g">DENTRO DO PLANO</span> : <span className="sjBadge r">ACIMA DO PLANO</span>}</td>
                    <td>{linha.temPlano ? <button type="button" className="sjAnaliseBtn" onClick={() => setPlanos((lista) => lista.filter((item) => item.data !== linha.data))}>Apagar</button> : "—"}</td>
                  </tr>
                )) : <tr><td colSpan={9}>Sem projeção nem envio ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </details>
    </>
  );
}

function classeDelta(valor: number | null) {
  if (valor == null || valor === 0) return "";
  return valor > 0 ? "sjMkUp" : "sjMkDown";
}

function comparar(planos: Plano[], zig: ZigAoVivo | null, hoje: string) {
  const porPlano = new Map(planos.map((plano) => [plano.data, plano]));
  const porGasto = new Map<string, LinhaZig>();
  for (const linha of zig?.lancamentos?.marketing || []) {
    const dia = String(linha.date || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dia)) porGasto.set(dia, linha);
  }
  const porFat = new Map((zig?.serieMes || []).map((ponto) => [ponto.dia, (ponto.zig || 0) + (ponto.eventos || 0)]));
  const datas = new Set<string>([...porPlano.keys(), ...porGasto.keys()]);
  porFat.forEach((valor, dia) => {
    if (valor > 0) datas.add(dia);
  });
  return [...datas].sort((a, b) => b.localeCompare(a)).slice(0, 60).map((dia) => {
    const plano = porPlano.get(dia);
    const fatPlan = plano ? plano.publico * plano.ticket : null;
    const gastoPlan = plano ? plano.trafego + plano.outros + plano.atracoes : null;
    const passou = dia <= hoje;
    const fatReal = passou && porFat.has(dia) ? porFat.get(dia) ?? null : null;
    const gastoLinha = passou ? porGasto.get(dia) : undefined;
    const gastoReal = gastoLinha ? (numCampo(gastoLinha, "mkTraffic") || 0) + (numCampo(gastoLinha, "mkOther") || 0) + (numCampo(gastoLinha, "mkAttractions") || 0) : null;
    return {
      data: dia,
      temPlano: Boolean(plano),
      fatPlan,
      fatReal,
      diffFat: fatPlan != null && fatReal != null ? fatReal - fatPlan : null,
      gastoPlan,
      gastoReal,
      diffGasto: gastoPlan != null && gastoReal != null ? gastoPlan - gastoReal : null,
    };
  });
}
