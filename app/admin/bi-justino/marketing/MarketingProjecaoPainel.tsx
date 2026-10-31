"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiUrl } from "../../../config/api";
import type { DadosPlanilha } from "../usePlanilha";
import type { ZigAoVivo } from "../zigValor";
import { lerEntradas, mkAtualPorData, planosPorData, type MkAtual } from "./espelhoDados";
import type { MkPlanDoc } from "./espelhoTipos";
import { margemDoDia } from "./margemDia";
import { comparar, ProjetadoRealizado, type Plano } from "./ProjetadoRealizado";

type Nivel = "g" | "y" | "r";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

function paraPlano(item: Pick<MkPlanDoc, "date" | "trafficPlan" | "otherPlan" | "attractionsPlan" | "publicPlan" | "ticketPlan" | "revenuePlan" | "note">): Plano {
  const publico = Number(item.publicPlan) || 0;
  const ticket = Number(item.ticketPlan) || 0;
  const receita = item.revenuePlan != null && Number.isFinite(Number(item.revenuePlan))
    ? Number(item.revenuePlan)
    : publico * ticket;
  return {
    data: item.date,
    trafego: Number(item.trafficPlan) || 0,
    outros: Number(item.otherPlan) || 0,
    atracoes: Number(item.attractionsPlan) || 0,
    publico,
    ticket,
    receita,
    nota: item.note || "",
  };
}

function planosDoEspelho(dados: DadosPlanilha, zig: ZigAoVivo | null): Plano[] {
  return Object.values(planosPorData(dados, zig?.mkPlans ?? [])).map(paraPlano);
}

function mkAtualUnido(dados: DadosPlanilha, zig: ZigAoVivo | null): Record<string, MkAtual> {
  const saida: Record<string, MkAtual> = {};
  for (const linha of zig?.lancamentos?.marketing ?? []) {
    const dia = String(linha.date || "").slice(0, 10);
    if (!dia) continue;
    const n = (chave: string) => Number(linha[chave]) || 0;
    saida[dia] = {
      spend: n("mkTraffic") + n("mkOther") + n("mkAttractions"),
      revenue: (n("mkShow") + n("mkWalkins")) * n("mkTicket"),
    };
  }
  return { ...saida, ...mkAtualPorData(lerEntradas(dados, "marketing")) };
}

async function chamar(caminho: string, corpo: Record<string, unknown>) {
  const acesso = token();
  if (!acesso) return { ok: false, error: "sem_login", planilha: false };
  const res = await fetch(`${getApiUrl()}${caminho}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${acesso}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json: unknown = await res.json().catch(() => null);
  const registro = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  return { ok: res.ok && registro.ok === true, error: typeof registro.error === "string" ? registro.error : "", planilha: registro.planilha === true };
}
type Leitura = { titulo: string; valor: string; nivel: Nivel; selo: string; detalhe: string };

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

function pct(valor: number) {
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const nome = SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()] || "";
  return `${nome} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
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

export function MarketingProjecaoPainel({
  dados,
  zig,
  onSalvo,
  onGastoProjetado,
}: {
  dados: DadosPlanilha;
  zig: ZigAoVivo | null;
  onSalvo: () => void;
  onGastoProjetado: (gasto: number) => void;
}) {
  const [data, setData] = useState(() => somarDias(hojeSp(), 1));
  const [trafego, setTrafego] = useState("");
  const [outros, setOutros] = useState("");
  const [atracoes, setAtracoes] = useState("");
  const [publico, setPublico] = useState("");
  const [ticket, setTicket] = useState("");
  const [nota, setNota] = useState("");
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [statusLote, setStatusLote] = useState("");
  const [locais, setLocais] = useState<Plano[]>([]);
  const [apagadas, setApagadas] = useState<string[]>([]);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const mkAtual = useMemo(() => mkAtualUnido(dados, zig), [dados, zig]);
  const planos = useMemo(() => {
    const mapa = new Map<string, Plano>();
    planosDoEspelho(dados, zig).forEach((plano) => mapa.set(plano.data, plano));
    locais.forEach((plano) => mapa.set(plano.data, plano));
    apagadas.forEach((dia) => mapa.delete(dia));
    return [...mapa.values()];
  }, [dados, zig, locais, apagadas]);
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
  // Fonte do CMV = BASE (DRE validada), decisão do Renato em 24/09 — não o envio ao vivo.
  const margem = margemDoDia(data, faturamento, gasto, null);

  useEffect(() => {
    onGastoProjetado(gasto);
  }, [gasto, onGastoProjetado]);

  const linhas = useMemo(() => comparar(planos, mkAtual, hojeSp()), [planos, mkAtual]);

  async function salvar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setStatus("Escolha uma data.");
      return;
    }
    if (!trafegoN && !outrosN && !atracoesN && !publicoN && !ticketN) {
      setStatus("Informe ao menos um valor para salvar.");
      return;
    }
    setOcupado(true);
    setStatus("Salvando…");
    try {
      const r = await chamar("/api/bi/justino/marketing/projecao", {
        date: data,
        trafficPlan: trafegoN,
        otherPlan: outrosN,
        attractionsPlan: atracoesN,
        publicPlan: publicoN,
        ticketPlan: ticketN,
        note: nota.trim(),
      });
      if (!r.ok) {
        setStatus(r.error === "sem_login" ? "Entre de novo para salvar." : "Falha ao salvar, tenta de novo.");
        return;
      }
      const plano: Plano = { data, trafego: trafegoN, outros: outrosN, atracoes: atracoesN, publico: publicoN, ticket: ticketN, receita: publicoN * ticketN, nota: nota.trim() };
      setLocais((lista) => [plano, ...lista.filter((item) => item.data !== data)]);
      setApagadas((lista) => lista.filter((dia) => dia !== data));
      setStatus(r.planilha ? `Projeção salva para ${dataCurta(data)}.` : `Projeção salva neste painel para ${dataCurta(data)}; a planilha recebe na próxima conexão.`);
      onSalvo();
    } catch {
      setStatus("Falha ao salvar, tenta de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function apagar(dia: string) {
    if (!window.confirm(`Apagar a projeção de ${dataCurta(dia)}? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).`)) return;
    setOcupado(true);
    try {
      const r = await chamar("/api/bi/justino/marketing/projecao/apagar", { date: dia });
      if (!r.ok) {
        setStatus("Não consegui apagar essa projeção.");
        return;
      }
      setApagadas((lista) => [...lista, dia]);
      setStatus(`Projeção de ${dataCurta(dia)} apagada.`);
      onSalvo();
    } catch {
      setStatus("Falha ao conectar.");
    } finally {
      setOcupado(false);
    }
  }

  async function apagarSelecionadas() {
    const datas = marcadas.filter((dia) => planos.some((plano) => plano.data === dia));
    if (!datas.length) {
      setStatusLote("Marque pelo menos uma projeção.");
      return;
    }
    if (!window.confirm(`Apagar ${datas.length} projeção(ões) selecionada(s)? Essa ação não tem volta.`)) return;
    setOcupado(true);
    let ok = 0;
    let falhou = 0;
    for (const dia of datas) {
      try {
        const r = await chamar("/api/bi/justino/marketing/projecao/apagar", { date: dia });
        if (r.ok) ok += 1;
        else falhou += 1;
      } catch {
        falhou += 1;
      }
      setStatusLote(`Apagando… (${ok + falhou}/${datas.length})`);
    }
    setApagadas((lista) => [...lista, ...datas]);
    setMarcadas([]);
    setStatusLote(`${ok} apagada(s)${falhou ? `, ${falhou} falhou(aram).` : "."}`);
    setOcupado(false);
    onSalvo();
  }

  function marcarTodas(ligado: boolean) {
    setMarcadas(ligado ? planos.map((plano) => plano.data) : []);
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
          <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={salvar}>Salvar projeção</button>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={limpar}>🗑 Apagar dados digitados</button>
          <span className="sjMini" role="status">{status}</span>
        </div>
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
          <div className="sjCampo"><small>Custo fixo médio por dia de abertura</small><div className="v">{reais(margem.custoFixoDia)}</div><span className="sjMini">{reais(margem.custoFixoMensal)}/mês ÷ {margem.diasAbertos} dias abertos ({margem.diasNoMes} do mês − {margem.segundas} segunda(s) fechada(s))</span></div>
          <div className="sjCampo"><small>Custo variável médio (% da receita)</small><div className="v">{pct(margem.custoVarPct)}</div><span className="sjMini">impostos + cartão + fee + CMV real</span></div>
          <div className="sjCampo"><small>Custo variável estimado do dia</small><div className="v">{reais(margem.custoVarEstimado)}</div><span className="sjMini">% aplicado sobre o faturamento projetado</span></div>
          <div className="sjCampo"><small>Seu custo estimado (Marketing)</small><div className="v">{reais(gasto)}</div><span className="sjMini">mesmo valor do gasto projetado acima</span></div>
          <div className="sjCampo"><small>Margem de contribuição do dia</small><div className="v">{margem.resultado >= 0 ? "+" : ""}{reais(margem.resultado)}</div><span className="sjMini">faturamento − custo fixo − custo variável − marketing</span></div>
        </div>
        <div className="sjAlerts">
          {faturamento ? (
            <article className={`sjAlert ${margem.nivel}`}>
              <span className="sjAlertIcon" aria-hidden="true">{margem.nivel === "g" ? "✓" : "!"}</span>
              <div>
                <b>Veredito do dia • {margem.selo}</b>
                <div>{reais(faturamento)} projetado − {reais(margem.custoTotalDia)} de custo = {reais(margem.resultado)} de margem</div>
                <p className="sjMini">Custo fixo do dia {reais(margem.custoFixoDia)} + custo variável {reais(margem.custoVarEstimado)} ({pct(margem.custoVarPct)}) + seu custo de marketing {reais(gasto)}.</p>
              </div>
            </article>
          ) : (
            <article className="sjAlert y">
              <span className="sjAlertIcon" aria-hidden="true">!</span>
              <div><b>Preencha público esperado e ticket médio • ATENÇÃO</b><div>Sem faturamento projetado pra comparar com o custo do dia</div></div>
            </article>
          )}
        </div>
      </section>
      <section className="sjCard sjBloco">
        <h3>A atração e os gastos são condizentes com o faturamento esperado?</h3>
        <p className="sjMini">Passe o mouse sobre cada quadro abaixo pra ver como ele é calculado.</p>
        <div className="sjAlerts">
          {checks.map((item) => (
            <article key={item.titulo} className={`sjAlert ${item.nivel}`} title={item.detalhe}>
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
      <ProjetadoRealizado
        linhas={linhas}
        totalPlanos={planos.length}
        marcadas={marcadas}
        ocupado={ocupado}
        statusLote={statusLote}
        onAtualizar={onSalvo}
        onApagar={(dia) => { void apagar(dia); }}
        onApagarSelecionadas={() => { void apagarSelecionadas(); }}
        onMarcar={(dia, ligado) => setMarcadas((lista) => (ligado ? [...lista, dia] : lista.filter((d) => d !== dia)))}
        onMarcarTodas={marcarTodas}
      />
    </>
  );
}
