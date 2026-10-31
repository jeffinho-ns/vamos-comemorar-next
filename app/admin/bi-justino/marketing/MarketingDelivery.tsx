"use client";

import { useEffect, useMemo, useState } from "react";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { dBR, DELI_NOMES, PERIODOS, PLATAFORMAS, linhasDelivery, pctDe, resumoDelivery, variacao } from "./deliveryCalculo";
import { lerZig } from "./espelhoDados";
import type { Food99Resp, Food99Snap, ZigDeliveryResp } from "./espelhoTipos";
import { reais } from "./numeros";

const CHAVE = "sjDeliPlano99";

const LEITURA_2310: readonly (readonly [string, string, string])[] = [
  ["Pedidos (16 a 22/10)", "2", "A loja quase não vende hoje."],
  ["Horário conectado", "1,34 h/dia • 35,5% do pico • 28,5% do predefinido", "Pico da loja é 18:00 a 23:30. Maior alavanca."],
  ["Ticket médio", "R$ 78,50 (68º de 1.754 lojas em 5 km)", "Quem compra gasta bem; faltam pedidos."],
  ["Itens mais vistos", "Muu Burguer 83 • Veggie Burguer 81 • Pastel Mix 34 • Coxinha 16 • demais ≤ 12 (Ceviche: 0)", "Burgers puxam a visibilidade."],
  ["Conversão em carrinho", "Muu Burguer 2,41% • Veggie Burguer 1,23%", "Foto, descrição e preço decidem aqui."],
  ["Itens que venderam", "Muu Burguer (2) • Coca-Cola Zero lata (2) • Veggie Burguer (1) • Salada Caprese (1)", "Só 4 itens tiveram venda."],
  ["Ofertas criadas", "nenhuma", "Nunca testou promoção na plataforma."],
  ["Avaliações (25/07 a 22/10)", "nenhuma", "Sem nota, a loja perde posição."],
  ["Preparo", "35,26 min • 50% fora do prazo (amostra de 2 pedidos)", "Amostra pequena; vale ajustar o prazo informado."],
];

const PLANO: readonly { titulo: string; itens: readonly { id: string; texto: string }[] }[] = [
  { titulo: "Horário", itens: [
    { id: "h1", texto: "Deixar a loja conectada de 18:00 a 23:30 (horário de pico da loja). Hoje fica conectada só 35,5% do pico e 28,5% do horário predefinido." },
    { id: "h2", texto: "Definir quem abre e fecha a loja no app todo dia (e um aviso se ficar offline no pico)." },
    { id: "h3", texto: "Revisar o prazo de preparo informado: hoje o tempo médio real é 35,26 min e 50% dos pedidos (1 de 2) saíram fora do prazo." },
  ] },
  { titulo: "Cardápio", itens: [
    { id: "c1", texto: "Burgers no topo (Muu Burguer e Veggie Burguer são os que a loja mais mostra: 83 e 81 impressões)." },
    { id: "c2", texto: "Criar 2 ou 3 combos com preço fechado (burger + porção + bebida) para subir o ticket e facilitar a escolha." },
    { id: "c3", texto: "Reescrever ou tirar do delivery os itens sem impressão ou sem venda (Ceviche de banana da terra, Pastel Mix de Queijo, Arroz Biro Biro, Vinagrete)." },
    { id: "c4", texto: "Descrição de uma linha por item, com o que o diferencia (braseiro, picanha, ponto da carne)." },
  ] },
  { titulo: "Fotos", itens: [
    { id: "f1", texto: "Foto própria dos itens de maior margem, com luz natural, fundo limpo e o prato inteiro (campeões e combos primeiro)." },
    { id: "f2", texto: "Sem texto, logo ou moldura sobre a foto." },
  ] },
  { titulo: "Precificação", itens: [
    { id: "p1", texto: "Informar a comissão da 99Food do contrato e o CMV alvo, para calcular o preço mínimo de delivery item a item (o BI já tem o custo da ficha técnica)." },
    { id: "p2", texto: "Conferir se o preço do delivery cobre custo + comissão + desconto de oferta." },
  ] },
  { titulo: "Promoções", itens: [
    { id: "o1", texto: "Abrir Ofertas de vendas > Central de ofertas e ver o que a 99 oferece. Nas ofertas exclusivas da plataforma a loja não paga a promoção." },
    { id: "o2", texto: "Testar uma oferta de primeiro pedido (todos os 2 clientes até agora compraram uma vez só)." },
    { id: "o3", texto: "Só usar Anúncio pago depois de acertar horário e cardápio." },
  ] },
];
const TOTAL_ITENS = PLANO.reduce((soma, grupo) => soma + grupo.itens.length, 0);

function preciso(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function n(v: number | null | undefined, d?: number) {
  return v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d });
}
function pc(v: number | null | undefined) {
  return v == null ? "—" : `${n(v, 2)}%`;
}

function lerMarcados(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    if (!parsed || typeof parsed !== "object") return [];
    return Object.entries(parsed as Record<string, unknown>).filter(([, v]) => v === 1 || v === true).map(([k]) => k);
  } catch {
    return [];
  }
}

function Leitura99({ snap, capturedAt }: { snap: Food99Snap; capturedAt: number | string }) {
  const it = snap.itens || { vendidos: [], conversao: [] };
  const conversao = Array.isArray(it.conversao) ? it.conversao : [];
  const vendidos = Array.isArray(it.vendidos) ? it.vendidos : [];
  const comImp = conversao.filter((x) => x && x.impressoes > 0).sort((a, b) => b.impressoes - a.impressoes).slice(0, 5).map((x) => `${x.nome} ${x.impressoes}${x.carrinho ? ` (carrinho ${x.carrinho})` : ""}`).join(" • ") || "—";
  const vend = vendidos.filter((x) => x && x.volume > 0).map((x) => `${x.nome} (${x.volume})`).join(" • ") || "nenhum";
  const semVer = conversao.filter((x) => x && x.impressoes === 0).map((x) => x.nome).join(", ");
  const ts = typeof capturedAt === "number" ? capturedAt : Number(capturedAt);
  const quando = new Date(Number.isFinite(ts) && ts > 0 ? ts : Date.now());
  const rk = snap.rankGanhos ? `#${snap.rankGanhos} de ${snap.lojasNoRaio}` : "—";
  const linhas: [string, string, string][] = [
    ["Pedidos concluídos", n(snap.pedidosConcluidos), "Volume de vendas da loja no período do painel."],
    ["Renda das vendas", preciso(snap.rendaVendas), "Valor que fica para a loja."],
    ["Ticket médio", preciso(snap.ticketMedio), `Posição no raio de 5 km: ${snap.rankTicketMedio ? `#${snap.rankTicketMedio} de ${snap.lojasNoRaio}` : "— (o painel só mostra durante o dia)"}`],
    ["Posição em ganhos", rk, "Comparação com as lojas num raio de 5 km."],
    ["Horas conectada por dia", `${n(snap.horasConectadoDia, 2)} h`, `Pico da loja: ${snap.picoInicio ? `${snap.picoInicio} a ${snap.picoFim}` : "—"} • conectada ${pc(snap.tempoConectadoPicoPct)} do pico e ${pc(snap.statusConectadoMedioPct)} do horário predefinido.`],
    ["Preparo", `${n(snap.tempoPreparoMin, 2)} min • ${pc(snap.naoPreparadosNoPrazoPct)} fora do prazo`, "Prazo informado ao cliente x tempo real."],
    ["Cancelamentos pela loja / itens errados", `${pc(snap.cancelamentosLojaPct)} / ${pc(snap.itensIncorretosPct)}`, "Quanto menor, melhor."],
    ["Clientes / avaliações", `${n(snap.clientesTotal)} • ${snap.semAvaliacoes ? "sem avaliações" : "com avaliações"}`, "Sem nota, a loja perde posição."],
    ["Itens que venderam", vend, "Só estes itens tiveram venda no período."],
    ["Itens mais vistos (impressões)", comImp, "Mostra o que o cliente vê no app."],
    ["Itens sem nenhuma impressão", semVer || "—", "Candidatos a refazer nome, foto e descrição, ou tirar do delivery."],
  ];
  return (
    <>
      <p className="sjMini">Última leitura automática: <b>{quando.toLocaleDateString("pt-BR")} {quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b> (todo dia às 11h). Dados do painel; o número de pedidos e o ticket são do período que o painel mostra.</p>
      <div className="sjTableInner sjMkTabela">
        <table>
          <thead><tr><th>O que o painel mostra</th><th>Valor</th><th>O que quer dizer</th></tr></thead>
          <tbody>{linhas.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

/** Sub-aba "🛵 Delivery" (deliRender + deli99Carregar + plano da 99Food). */
export function MarketingDelivery({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(30);
  const [marcados, setMarcados] = useState<string[]>([]);
  useEffect(() => { setMarcados(lerMarcados()); }, []);
  const zig = useMemo(() => lerZig(dados), [dados]);
  const deliResp = payloadDe<ZigDeliveryResp>(dados, "getZigDelivery");
  const rows = useMemo(() => linhasDelivery(deliResp), [deliResp]);
  const resumo = useMemo(() => resumoDelivery(rows, periodo, zig.revenue || {}), [rows, periodo, zig.revenue]);
  const food = payloadDe<Food99Resp>(dados, "get99Food");
  const ultima = Array.isArray(food?.rows) ? food.rows[0] ?? null : null;

  function alternar(id: string, ligado: boolean) {
    setMarcados((atual) => {
      const proximo = ligado ? (atual.includes(id) ? atual : [...atual, id]) : atual.filter((item) => item !== id);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(Object.fromEntries(proximo.map((k) => [k, 1]))));
      } catch {
        return proximo;
      }
      return proximo;
    });
  }

  return (
    <>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>🛵 Delivery por plataforma</h3>
          <span className="sjBadgeP">{resumo ? `até ${dBR(resumo.fim)}` : "—"}</span>
        </div>
        <p className="sjNote">Venda de delivery por plataforma (iFood, Rappi, Uber, Delivery Online e App), lida da forma de pagamento do faturamento da ZigPay. Atualiza de hora em hora. Mostra <b>valor vendido</b>; número de pedidos ainda não vem da ZigPay por plataforma.</p>
        <div className="sjToolbar">
          <div className="sjTb">
            <label htmlFor="sjMkDeliPeriodo">Período
              <select id="sjMkDeliPeriodo" className="sjInput" value={periodo} onChange={(e) => setPeriodo(Number(e.target.value) as (typeof PERIODOS)[number])}>
                {PERIODOS.map((dias) => <option key={dias} value={dias}>{dias} dias</option>)}
              </select>
            </label>
          </div>
          <button type="button" className="sjAnaliseBtn" onClick={onSalvo}>↻ Atualizar tela</button>
        </div>
        {!deliResp ? <p className="sjMini">Carregando delivery…</p> : !resumo ? <p className="sjAlert y">Ainda não há dias gravados. No Apps Script, rode <b>zigDeliveryHistorico</b> (uma vez) e depois <b>zigInstalarGatilho</b>.</p> : (
          <>
            <div className="sjCampos">
              <div className="sjCampo"><small>Delivery (iFood, Rappi, Uber, Delivery Online)</small><div className="v">{preciso(resumo.totDeli)}</div><p className="sjMini">{variacao(resumo.totDeli, resumo.totAntDeli)}</p></div>
              <div className="sjCampo"><small>% do faturamento</small><div className="v">{pctDe(resumo.totDeli, resumo.fat)}</div><p className="sjMini">faturamento do período: {reais(resumo.fat)}</p></div>
              <div className="sjCampo"><small>Venda pelo App ZigPay</small><div className="v">{preciso(resumo.totApp)}</div><p className="sjMini">{pctDe(resumo.totApp, resumo.fat)} do faturamento • {variacao(resumo.totApp, resumo.totAntApp)}</p></div>
              <div className="sjCampo"><small>Dias com venda de delivery</small><div className="v">{resumo.diasDeli} de {resumo.nDias}</div><p className="sjMini">de {dBR(resumo.ini)} a {dBR(resumo.fim)}</p></div>
            </div>
            <div className="sjTableInner sjMkTabela">
              <table>
                <thead><tr><th>Plataforma</th><th>Vendido no período</th><th>% do faturamento</th><th>Período anterior</th><th>Variação</th><th>Melhor dia</th></tr></thead>
                <tbody>
                  {resumo.porPlataforma.map((p) => (
                    <tr key={p.plataforma}><td><b>{p.nome}</b></td><td>{preciso(p.valor)}</td><td>{pctDe(p.valor, resumo.fat)}</td><td>{preciso(p.anterior)}</td><td>{p.anterior > 0 ? `${((p.valor - p.anterior) / p.anterior) * 100 >= 0 ? "+" : ""}${(((p.valor - p.anterior) / p.anterior) * 100).toFixed(0)}%` : "—"}</td><td>{p.melhor ? `${dBR(p.melhor.date)} • ${preciso(p.melhor.valor)}` : "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4 className="sjMkH4">Por mês</h4>
            <div className="sjTableInner sjMkTabela">
              <table>
                <thead><tr><th>Mês</th>{PLATAFORMAS.map((p) => <th key={p}>{DELI_NOMES[p]}</th>)}<th>Dias lidos</th></tr></thead>
                <tbody>{resumo.meses.map((m) => <tr key={m.mes}><td><b>{m.mes.split("-").reverse().join("/")}</b></td>{m.valores.map((v, i) => <td key={PLATAFORMAS[i]}>{preciso(v)}</td>)}<td>{m.diasLidos}</td></tr>)}</tbody>
              </table>
            </div>
            <h4 className="sjMkH4">Dias com venda no período</h4>
            {!resumo.comVenda.length ? <p className="sjMini">Nenhuma venda de delivery ou app nesse período.</p> : (
              <div className="sjTableInner sjMkTabela">
                <table>
                  <thead><tr><th>Dia</th>{PLATAFORMAS.map((p) => <th key={p}>{DELI_NOMES[p]}</th>)}</tr></thead>
                  <tbody>{resumo.comVenda.map((d) => <tr key={d.dia}><td><b>{dBR(d.dia)}</b></td>{d.valores.map((v, i) => <td key={PLATAFORMAS[i]}>{v > 0 ? preciso(v) : "—"}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>💡 99Food • sugestões para vender mais</h3>
          <span className="sjBadgeP">{marcados.length} de {TOTAL_ITENS} feitos</span>
        </div>
        <p className="sjNote">Leitura do painel da 99Food (loja Seu Justino Madalena), <b>só leitura</b>. Um robô lê o painel <b>1 vez por dia, às 11h</b>, e esta tabela mostra a última leitura (precisa do computador ligado e da sessão da 99Food ativa). As fotos e os preços cadastrados <b>ainda não foram vistos</b> (a tela de Cardápios não abriu na leitura); por isso, fotos e preço seguem boas práticas de mercado, e não uma avaliação do seu cardápio. Marque o que for feito: a marcação fica neste navegador.</p>
        {ultima?.snap ? <Leitura99 snap={ultima.snap} capturedAt={ultima.capturedAt} /> : (
          <>
            <p className="sjMini">Ainda sem leitura automática: abaixo, a leitura manual de <b>23/10/2026</b>.</p>
            <div className="sjTableInner sjMkTabela">
              <table>
                <thead><tr><th>O que o painel mostrou (23/10)</th><th>Valor</th><th>O que quer dizer</th></tr></thead>
                <tbody>{LEITURA_2310.map(([fato, valor, leitura]) => <tr key={fato}><td>{fato}</td><td><b>{valor}</b></td><td>{leitura}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
        {PLANO.map((grupo) => (
          <div key={grupo.titulo}>
            <h4 className="sjMkH4">{grupo.titulo}</h4>
            {grupo.itens.map((item) => (
              <label key={item.id} className="sjMkCk">
                <input type="checkbox" checked={marcados.includes(item.id)} onChange={(e) => alternar(item.id, e.target.checked)} />
                <span>{item.texto}</span>
              </label>
            ))}
          </div>
        ))}
        <p className="sjMini">Pendente para fechar o diagnóstico: ver a tela de Cardápios (fotos e preços) e a Central de ofertas, e saber a comissão da 99Food e o CMV alvo.</p>
      </section>
    </>
  );
}
