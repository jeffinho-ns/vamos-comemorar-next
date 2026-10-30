"use client";

import { useMemo, useState } from "react";
import { GraficoTicketSemanal } from "./GraficoTicketSemanal";
import type { DreAoVivo } from "./dreValor";
import type { NovidadesAoVivo } from "./FontesNovas";
import { TabelaHistoricoDre, TabelaHorario, TabelaPadraoSemanal, TabelaSemanas } from "./tabelasReais";
import type { ZigAoVivo } from "./zigValor";

function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function numero(texto: string) {
  const normal = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const n = Number(normal);
  return Number.isFinite(n) ? n : 0;
}

export function MarketingProjecao({ zig }: { zig: ZigAoVivo | null }) {
  const [data, setData] = useState("");
  const [trafego, setTrafego] = useState("");
  const [outros, setOutros] = useState("");
  const [atracoes, setAtracoes] = useState("");
  const [publico, setPublico] = useState("");
  const [ticket, setTicket] = useState("");
  const [nota, setNota] = useState("");
  const gasto = numero(trafego) + numero(outros) + numero(atracoes);
  const faturamento = numero(publico) * numero(ticket);
  const roas = gasto > 0 ? faturamento / gasto : 0;
  const cac = numero(publico) > 0 ? gasto / numero(publico) : 0;
  const atracao = numero(atracoes);
  const teto = faturamento * 0.08;
  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole"><h3>Projeção de gastos • agendamento futuro</h3><span className="sjBadgeP">PLANEJAMENTO</span></div>
        <div className="sjToolbar">
          <div className="sjTb"><label>Data<input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Tráfego projetado<input className="sjInput" value={trafego} onChange={(evento) => setTrafego(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Outros projetado<input className="sjInput" value={outros} onChange={(evento) => setOutros(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Atrações projetado<input className="sjInput" value={atracoes} onChange={(evento) => setAtracoes(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Público esperado<input className="sjInput" value={publico} onChange={(evento) => setPublico(evento.target.value)} /></label></div>
          <div className="sjTb"><label>Ticket médio esperado<input className="sjInput" value={ticket} onChange={(evento) => setTicket(evento.target.value)} /></label></div>
        </div>
        <label className="sjFormBloco"><b>Observação da projeção</b><textarea className="sjInput" rows={2} value={nota} onChange={(evento) => setNota(evento.target.value)} /><p className="sjMini">Contexto: evento especial, campanha sazonal, etc.</p></label>
      </section>
      <article className="sjCard"><small>Faturamento projetado</small><div className="v">{reais(faturamento)}</div><span className="sjMini">público × ticket médio</span></article>
      <article className="sjCard"><small>Gasto total projetado</small><div className="v">{reais(gasto)}</div><span className="sjMini">tráfego + outros + atrações</span></article>
      <article className="sjCard"><small>ROAS esperado</small><div className="v">{roas ? `${roas.toFixed(1).replace(".", ",")}x` : "—"}</div><span className="sjMini">faturamento ÷ gasto</span></article>
      <article className="sjCard"><small>CAC esperado</small><div className="v">{cac ? reais(cac) : "—"}</div><span className="sjMini">gasto ÷ público</span></article>
      <section className="sjCard sjBloco">
        <div className="sjRole"><h3>Vale a pena abrir nesse dia?</h3><span className="sjBadgeP">MARGEM DE CONTRIBUIÇÃO</span></div>
        <p className="sjNote">Custo fixo médio por dia vem do último envio de Financeiro e RH, rateado pelos dias em que a casa abre. O custo variável usa o histórico de impostos, cartão, fee e CMV sobre o faturamento projetado. Você preenche só tráfego, atrações, outros, público e ticket.</p>
        <p className="sjMini">Faturamento do mês usado como referência: {zig?.faturamentoMes == null ? "—" : reais(zig.faturamentoMes)}.</p>
      </section>
      <section className="sjCard sjBloco">
        <h3>A atração e os gastos são condizentes com o faturamento esperado?</h3>
        <div className="sjCampos">
          <div className="sjCampo"><small>Teto de atrações (8%)</small><div className="v">{reais(teto)}</div></div>
          <div className="sjCampo"><small>Gasto projetado em atrações</small><div className="v">{reais(atracao)}</div></div>
          <div className="sjCampo"><small>Folga até o teto</small><div className="v">{reais(teto - atracao)}</div></div>
          <div className="sjCampo"><small>Leitura</small><div className="v">{faturamento && atracao > teto ? "Acima do teto" : "Dentro do teto"}</div></div>
        </div>
      </section>
      <section className="sjCard sjBloco">
        <h3>Projetado × Realizado</h3>
        <p className="sjMini">A comparação com o realizado da Zig entra quando a projeção for salva na planilha. O formulário acima já mostra a conta do dia escolhido.</p>
      </section>
    </>
  );
}

type Demanda = { id: string; tipo: string; data: string; titulo: string; responsavel: string; prazo: string; prioridade: string; status: string };

export function MarketingDemandas() {
  const [itens, setItens] = useState<Demanda[]>([]);
  const [tipo, setTipo] = useState("demanda");
  const [titulo, setTitulo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [status, setStatus] = useState("aberto");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const hoje = new Date().toISOString().slice(0, 10);
  const visiveis = itens.filter((item) => (!filtroTipo || item.tipo === filtroTipo) && (!filtroStatus || item.status === filtroStatus) && (filtroStatus || item.status !== "concluido"));
  const resumo = useMemo(() => {
    const mapa = new Map<string, { aberto: number; andamento: number; atrasadas: number; concluidas: number; prazo: string }>();
    itens.forEach((item) => {
      const atual = mapa.get(item.responsavel || "—") || { aberto: 0, andamento: 0, atrasadas: 0, concluidas: 0, prazo: "" };
      if (item.status === "aberto") atual.aberto += 1;
      if (item.status === "andamento") atual.andamento += 1;
      if (item.status === "concluido") atual.concluidas += 1;
      if (item.status !== "concluido" && item.prazo && item.prazo < hoje) atual.atrasadas += 1;
      if (item.prazo && (!atual.prazo || item.prazo < atual.prazo)) atual.prazo = item.prazo;
      mapa.set(item.responsavel || "—", atual);
    });
    return [...mapa.entries()];
  }, [itens, hoje]);
  const atrasadas = itens.filter((item) => item.status !== "concluido" && item.prazo && item.prazo < hoje).length;
  const semana = itens.filter((item) => item.status !== "concluido" && item.prazo && item.prazo >= hoje && item.prazo <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length;
  return (
    <>
      <p className="sjNote"><b>Reuniões e demandas • Marketing</b> — registre pautas e atas das reuniões e as demandas que saem delas, com responsável e prazo. Uma demanda pode ser ligada à pauta de onde nasceu.</p>
      <article className="sjCard"><small>Demandas em aberto</small><div className="v">{itens.filter((item) => item.status === "aberto").length}</div></article>
      <article className="sjCard"><small>Em andamento</small><div className="v">{itens.filter((item) => item.status === "andamento").length}</div></article>
      <article className="sjCard"><small>Atrasadas</small><div className="v">{atrasadas}</div></article>
      <article className="sjCard"><small>Vencem em 7 dias</small><div className="v">{semana}</div></article>
      <article className="sjCard"><small>Concluídas</small><div className="v">{itens.filter((item) => item.status === "concluido").length}</div></article>
      <details className="sjCollapse">
        <summary><span className="sjChev">▸</span>+ Nova demanda / pauta / ata<span className="sjHint">clique para abrir</span></summary>
        <div className="sjCard sjBloco sjCollapseBody">
          <div className="sjToolbar">
            <div className="sjTb"><label>Tipo<select className="sjInput" value={tipo} onChange={(evento) => setTipo(evento.target.value)}><option value="demanda">Demanda</option><option value="pauta">Pauta de reunião</option><option value="ata">Ata de reunião</option></select></label></div>
            <div className="sjTb"><label>Título<input className="sjInput" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} /></label></div>
            <div className="sjTb"><label>Responsável<input className="sjInput" value={responsavel} onChange={(evento) => setResponsavel(evento.target.value)} /></label></div>
            <div className="sjTb"><label>Prazo<input className="sjInput" type="date" value={prazo} onChange={(evento) => setPrazo(evento.target.value)} /></label></div>
            <div className="sjTb"><label>Prioridade<select className="sjInput" value={prioridade} onChange={(evento) => setPrioridade(evento.target.value)}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label></div>
            <div className="sjTb"><label>Status<select className="sjInput" value={status} onChange={(evento) => setStatus(evento.target.value)}><option value="aberto">Aberto</option><option value="andamento">Em andamento</option><option value="concluido">Concluído</option></select></label></div>
            <button type="button" className="sjAnaliseBtn" onClick={() => { if (!titulo.trim()) return; setItens((lista) => [{ id: `${Date.now()}`, tipo, data: hoje, titulo, responsavel, prazo, prioridade, status }, ...lista]); setTitulo(""); }}>Salvar</button>
          </div>
        </div>
      </details>
      <section className="sjCard sjBloco">
        <h3>Demandas por responsável</h3>
        <div className="sjTableInner"><table><thead><tr><th>Responsável</th><th>Em aberto</th><th>Em andamento</th><th>Atrasadas</th><th>Próximo prazo</th><th>Concluídas</th></tr></thead><tbody>
          {resumo.length ? resumo.map(([nome, item]) => <tr key={nome}><td>{nome}</td><td>{item.aberto}</td><td>{item.andamento}</td><td>{item.atrasadas}</td><td>{item.prazo || "—"}</td><td>{item.concluidas}</td></tr>) : <tr><td colSpan={6}>Nenhuma demanda cadastrada ainda.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="sjCard sjBloco">
        <h3>Demandas, pautas e atas</h3>
        <div className="sjToolbar">
          <div className="sjTb"><label>Tipo<select className="sjInput" value={filtroTipo} onChange={(evento) => setFiltroTipo(evento.target.value)}><option value="">Todos</option><option value="demanda">Demandas</option><option value="pauta">Pautas</option><option value="ata">Atas</option></select></label></div>
          <div className="sjTb"><label>Status<select className="sjInput" value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)}><option value="">Pendentes (sem concluídas)</option><option value="aberto">Aberto</option><option value="andamento">Em andamento</option><option value="concluido">Concluído</option></select></label></div>
        </div>
        <div className="sjTableInner"><table><thead><tr><th>Tipo</th><th>Data</th><th>Título</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>
          {visiveis.length ? visiveis.map((item) => <tr key={item.id}><td>{item.tipo}</td><td>{item.data}</td><td>{item.titulo}</td><td>{item.responsavel || "—"}</td><td>{item.prazo || "—"}</td><td>{item.prioridade}</td><td>{item.status}</td></tr>) : <tr><td colSpan={7}>Nada para aqui.</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}

export function MarketingGraficos({ zig, dre, onSalvo }: { zig: ZigAoVivo | null; dre: DreAoVivo | null; onSalvo: () => void }) {
  const [dia, setDia] = useState("Geral");
  const dias = ["Geral", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  return (
    <>
      <p className="sjNote"><b>Análise de gráficos • Marketing</b> — os gráficos da aba num lugar só, com a leitura dos números que já estão no banco.</p>
      <section className="sjCard sjBloco">
        <h3>Gasto vs Receita — últimos envios</h3>
        <div className="sjTableInner"><table><thead><tr><th>Data</th><th>Gasto</th><th>Receita</th><th>ROAS</th></tr></thead><tbody>
          {(zig?.lancamentos?.marketing || []).slice(0, 30).map((linha) => {
            const gasto = Number(linha.mkTraffic || 0) + Number(linha.mkAttractions || 0) + Number(linha.mkOther || 0);
            const receita = Number(linha.mkRevenue || 0);
            return <tr key={String(linha.date)}><td>{String(linha.date)}</td><td>{reais(gasto)}</td><td>{reais(receita)}</td><td>{gasto ? `${(receita / gasto).toFixed(1).replace(".", ",")}x` : "—"}</td></tr>;
          })}
          {!(zig?.lancamentos?.marketing || []).length ? <tr><td colSpan={4}>Ainda sem envio de marketing.</td></tr> : null}
        </tbody></table></div>
      </section>
      <section className="sjCard sjBloco"><h3>Faturamento histórico (DRE) — mês a mês</h3><TabelaHistoricoDre dre={dre} /></section>
      <section className="sjCard sjBloco">
        <h3>Faturamento e ticket médio semanal — últimos 6 meses</h3>
        <GraficoTicketSemanal zig={zig} onAtualizar={onSalvo} />
        <TabelaSemanas zig={zig} />
      </section>
      <section className="sjCard sjBloco"><h3>Padrão semanal • faturamento e ticket médio por dia da semana</h3><TabelaPadraoSemanal zig={zig} /></section>
      <section className="sjCard sjBloco">
        <h3>Venda por horário • média histórica por dia da semana</h3>
        <div className="sjDias">{dias.map((nome) => <button key={nome} type="button" className={dia === nome ? "on" : ""} onClick={() => setDia(nome)}>{nome}</button>)}</div>
        <TabelaHorario zig={zig} escolha={dia} />
      </section>
    </>
  );
}

const INSIGHT: Record<string, string> = {
  Segunda: "Casa fechada para o público. O dia serve para manutenção, entrega e pauta da semana.",
  Terça: "Noite mais curta. Reserva de aniversário em mesa menor e atração acústica no primeiro horário.",
  Quarta: "Meio de semana pede motivo pra sair. Voz e violão cedo e divulgação na véspera.",
  Quinta: "A casa enche mais tarde. Banda a partir das 21h e reserva com antecedência.",
  Sexta: "Pico da semana. Fila controlada, mesas grandes e duas janelas de atração.",
  Sábado: "Maior público e o dia mais longo. Três blocos de atração e pacote de aniversário.",
  Domingo: "Almoço e início da noite. Feijoada, família e encerramento mais cedo.",
};

export function MarketingCanais({
  aba,
  zig,
  novidades,
}: {
  aba: "ins" | "insta" | "deli" | "aval";
  zig: ZigAoVivo | null;
  novidades: NovidadesAoVivo | null;
}) {
  const [dia, setDia] = useState("Sexta");
  const [filtro, setFiltro] = useState("pend");
  const padrao = zig?.porDiaSemana?.find((item) => item.nome === dia);
  const insta = novidades?.instagram;
  const food = novidades?.food;
  const delivery = novidades?.delivery || [];
  const totalDelivery = delivery.reduce((soma, item) => soma + item.valor, 0);
  const aval = novidades?.avaliacoes;
  const itens = (aval?.itens || []).filter((item) => filtro === "todas" || (filtro === "pend" ? item.status === "novo" || !item.status : item.status === filtro));
  if (aba === "ins") {
    return (
      <section className="sjCard sjBloco">
        <h3>Insights de Marketing • por dia da semana</h3>
        <p className="sjNote">Cruza faturamento, público e ticket do padrão semanal pra sugerir o que melhora o fluxo de cada dia. O texto de cada dia segue o manual operacional da casa.</p>
        <div className="sjDias">{["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((nome) => <button key={nome} type="button" className={dia === nome ? "on" : ""} onClick={() => setDia(nome)}>{nome}</button>)}</div>
        <p><b>Como o dia funciona.</b> {INSIGHT[dia]}</p>
        <p><b>O que os dados mostram.</b> {padrao ? `${padrao.dias} dia(s) no período, faturamento médio ${reais(padrao.faturamentoMedio || 0)}, público médio ${Math.round(padrao.publicoMedio || 0)} e ticket ${reais(padrao.ticketMedio || 0)}.` : "Ainda sem média desse dia da semana."}</p>
      </section>
    );
  }
  if (aba === "insta") {
    return (
      <section className="sjCard sjBloco">
        <div className="sjRole"><h3>Instagram • @seujustino — leitura da conta e plano</h3><span className="sjBadgeP">{insta ? "CONECTADO" : "SEM LEITURA"}</span></div>
        <p className="sjNote">Os indicadores reais vêm da leitura da conta. Onde o número ainda não chegou, o card fica em branco em vez de inventar alcance.</p>
        <div className="sjCampos">
          <div className="sjCampo"><small>Seguidores</small><div className="v">{insta?.seguidores?.toLocaleString("pt-BR") ?? "—"}</div></div>
          <div className="sjCampo"><small>Alcance em 30 dias</small><div className="v">{insta?.alcance30?.toLocaleString("pt-BR") ?? "—"}</div></div>
          <div className="sjCampo"><small>Posts lidos</small><div className="v">{insta?.posts ?? "—"}</div></div>
        </div>
        {insta?.data ? <p className="sjMini">Última leitura em {insta.data}.</p> : <p className="sjMini">Ainda sem leitura da API neste painel.</p>}
      </section>
    );
  }
  if (aba === "deli") {
    return (
      <>
        <section className="sjCard sjBloco">
          <div className="sjRole"><h3>Delivery por plataforma</h3><span className="sjBadgeP">{delivery.length ? "ZIGPAY" : "—"}</span></div>
          <p className="sjNote">Venda de delivery por plataforma, lida da forma de pagamento do faturamento da ZigPay. Mostra o valor vendido.</p>
          <div className="sjCampos">
            <div className="sjCampo"><small>Total no período</small><div className="v">{reais(totalDelivery)}</div></div>
            {delivery.map((item) => <div key={item.plataforma} className="sjCampo"><small>{item.plataforma}</small><div className="v">{reais(item.valor)}</div></div>)}
          </div>
          {!delivery.length ? <p className="sjMini">Ainda sem leitura de delivery.</p> : null}
        </section>
        <section className="sjCard sjBloco">
          <h3>99Food • sugestões para vender mais</h3>
          <p className="sjNote">Leitura do painel da loja Seu Justino Madalena. Marque o que for feito; a lista abaixo é o plano de horário, cardápio, foto e oferta.</p>
          <div className="sjCampos">
            <div className="sjCampo"><small>Pedidos</small><div className="v">{food?.pedidos ?? "—"}</div></div>
            <div className="sjCampo"><small>Renda</small><div className="v">{food?.renda == null ? "—" : reais(food.renda)}</div></div>
            <div className="sjCampo"><small>Ticket</small><div className="v">{food?.ticket == null ? "—" : reais(food.ticket)}</div></div>
            <div className="sjCampo"><small>Horas conectada</small><div className="v">{food?.horas ?? "—"}</div></div>
            <div className="sjCampo"><small>Preparo</small><div className="v">{food?.preparoMin == null ? "—" : `${food.preparoMin} min`}</div></div>
          </div>
          {food?.vendidos?.length ? <p className="sjMini">{food.vendidos.map((item) => `${item.nome} (${item.volume})`).join(" · ")}</p> : null}
        </section>
      </>
    );
  }
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>Avaliações do Google</h3><span className="sjBadgeP">{aval?.pendentes ? `${aval.pendentes} para responder` : "—"}</span></div>
      <p className="sjNote">O robô lê o Perfil da Empresa do Google. A resposta sugerida segue o tom do Seu Justino. Nada é publicado sozinho: revise, copie, cole no Google e marque como publicada. Comece pelas negativas.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Mostrar<select className="sjInput" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}><option value="pend">Para responder</option><option value="todas">Todas</option></select></label></div>
      </div>
      <p className="sjMini">{aval ? `Média ${aval.media == null ? "—" : aval.media.toFixed(2).replace(".", ",")} · ${aval.total} lidas · ${aval.pendentes} para responder` : "Nenhuma avaliação lida ainda. Baixe o registro manual ou o robô google_avaliacoes.py."}</p>
      {itens.map((item) => (
        <article key={`${item.quando}-${item.nota}-${item.texto.slice(0, 16)}`} className="sjCampo">
          <small>{item.nota} estrelas · {item.quando || item.status}</small>
          <p>{item.texto || "Sem texto"}</p>
          {item.sugestao ? <p className="sjMini">{item.sugestao}</p> : null}
        </article>
      ))}
    </section>
  );
}
