"use client";

import { useEffect, useState } from "react";
import type { NovidadesAoVivo } from "../FontesNovas";

const CHAVE = "sj-mk-99food";
const PERIODOS = [14, 30, 60, 90, 150] as const;

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
  {
    titulo: "Horário",
    itens: [
      { id: "h1", texto: "Deixar a loja conectada de 18:00 a 23:30 (horário de pico da loja). Hoje fica conectada só 35,5% do pico e 28,5% do horário predefinido." },
      { id: "h2", texto: "Definir quem abre e fecha a loja no app todo dia (e um aviso se ficar offline no pico)." },
      { id: "h3", texto: "Revisar o prazo de preparo informado: hoje o tempo médio real é 35,26 min e 50% dos pedidos (1 de 2) saíram fora do prazo." },
    ],
  },
  {
    titulo: "Cardápio",
    itens: [
      { id: "c1", texto: "Burgers no topo (Muu Burguer e Veggie Burguer são os que a loja mais mostra: 83 e 81 impressões)." },
      { id: "c2", texto: "Criar 2 ou 3 combos com preço fechado (burger + porção + bebida) para subir o ticket e facilitar a escolha." },
      { id: "c3", texto: "Reescrever ou tirar do delivery os itens sem impressão ou sem venda (Ceviche de banana da terra, Pastel Mix de Queijo, Arroz Biro Biro, Vinagrete)." },
      { id: "c4", texto: "Descrição de uma linha por item, com o que o diferencia (braseiro, picanha, ponto da carne)." },
    ],
  },
  {
    titulo: "Fotos",
    itens: [
      { id: "f1", texto: "Foto própria dos itens de maior margem, com luz natural, fundo limpo e o prato inteiro (campeões e combos primeiro)." },
      { id: "f2", texto: "Sem texto, logo ou moldura sobre a foto." },
    ],
  },
  {
    titulo: "Precificação",
    itens: [
      { id: "p1", texto: "Informar a comissão da 99Food do contrato e o CMV alvo, para calcular o preço mínimo de delivery item a item (o BI já tem o custo da ficha técnica)." },
      { id: "p2", texto: "Conferir se o preço do delivery cobre custo + comissão + desconto de oferta." },
    ],
  },
  {
    titulo: "Promoções",
    itens: [
      { id: "o1", texto: "Abrir Ofertas de vendas > Central de ofertas e ver o que a 99 oferece. Nas ofertas exclusivas da plataforma a loja não paga a promoção." },
      { id: "o2", texto: "Testar uma oferta de primeiro pedido (todos os 2 clientes até agora compraram uma vez só)." },
      { id: "o3", texto: "Só usar Anúncio pago depois de acertar horário e cardápio." },
    ],
  },
];

const TOTAL_ITENS = PLANO.reduce((soma, grupo) => soma + grupo.itens.length, 0);

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lerMarcados() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [] as string[];
    const parsed: unknown = JSON.parse(bruto);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set(PLANO.flatMap((grupo) => grupo.itens.map((item) => item.id)));
    return parsed.filter((item): item is string => typeof item === "string" && ids.has(item));
  } catch {
    return [];
  }
}

export function MarketingDelivery({ novidades }: { novidades: NovidadesAoVivo | null }) {
  const delivery = novidades?.delivery ?? [];
  const food = novidades?.food ?? null;
  const total = delivery.reduce((soma, item) => soma + item.valor, 0);
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(30);
  const [marcados, setMarcados] = useState<readonly string[]>([]);

  useEffect(() => {
    setMarcados(lerMarcados());
  }, []);

  function alternar(id: string, ligado: boolean) {
    setMarcados((atual) => {
      const proximo = ligado ? (atual.includes(id) ? atual : [...atual, id]) : atual.filter((item) => item !== id);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(proximo));
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
          <h3>Delivery por plataforma</h3>
          <span className="sjBadgeP">{delivery.length ? "TOTAL" : "—"}</span>
        </div>
        <p className="sjNote">Venda de delivery por plataforma, lida da forma de pagamento do faturamento da ZigPay. Mostra o valor vendido. O número de pedidos ainda não vem da ZigPay por plataforma.</p>
        <div className="sjToolbar">
          <div className="sjTb">
            <label htmlFor="sjMkDeliPeriodo">Período
              <select id="sjMkDeliPeriodo" className="sjInput" value={periodo} onChange={(evento) => setPeriodo(Number(evento.target.value) as (typeof PERIODOS)[number])}>
                {PERIODOS.map((dias) => <option key={dias} value={dias}>{dias} dias</option>)}
              </select>
            </label>
          </div>
        </div>
        {!delivery.length ? <p className="sjMini">Ainda sem leitura de delivery.</p> : (
          <>
            <div className="sjCampos">
              <div className="sjCampo"><small>Total no período lido</small><div className="v">{reais(total)}</div></div>
              {delivery.map((item) => (
                <div key={item.plataforma} className="sjCampo"><small>{item.plataforma}</small><div className="v">{reais(item.valor)}</div></div>
              ))}
            </div>
            <div className="sjTableInner sjMkTabela">
              <table>
                <thead><tr><th>Plataforma</th><th>Valor</th></tr></thead>
                <tbody>
                  {delivery.map((item) => (
                    <tr key={item.plataforma}><td>{item.plataforma}</td><td>{reais(item.valor)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sjMini">Total já agregado no período lido. O filtro de {periodo} dias fica visual até existir série diária — a tabela não reparte o valor por janela.</p>
          </>
        )}
      </section>
      <section className="sjCard sjBloco">
        <div className="sjRole">
          <h3>99Food • sugestões para vender mais</h3>
          <span className="sjBadgeP">{marcados.length} de {TOTAL_ITENS} feitos</span>
        </div>
        <p className="sjNote">Leitura do painel da 99Food (loja Seu Justino Madalena), só leitura. Um robô lê o painel 1 vez por dia, às 11h. As fotos e os preços cadastrados ainda não foram vistos na leitura de referência; por isso, fotos e preço seguem boas práticas de mercado. Marque o que for feito: a marcação fica neste navegador.</p>
        {food ? (
          <div className="sjCampos">
            <div className="sjCampo"><small>Pedidos</small><div className="v">{food.pedidos ?? "—"}</div></div>
            <div className="sjCampo"><small>Renda</small><div className="v">{reais(food.renda)}</div></div>
            <div className="sjCampo"><small>Ticket</small><div className="v">{reais(food.ticket)}</div></div>
            <div className="sjCampo"><small>Horas conectada</small><div className="v">{food.horas ?? "—"}</div></div>
            <div className="sjCampo"><small>Preparo</small><div className="v">{food.preparoMin == null ? "—" : `${food.preparoMin} min`}</div></div>
          </div>
        ) : null}
        {(food?.vendidos ?? []).length ? <p className="sjMini">{(food?.vendidos ?? []).map((item) => `${item.nome} (${item.volume})`).join(" · ")}</p> : null}
        <p className="sjMini">Ainda sem série que substitua a leitura manual: abaixo, a leitura manual de 23/10/2026.</p>
        <div className="sjTableInner sjMkTabela">
          <table>
            <thead><tr><th>O que o painel mostrou (23/10)</th><th>Valor</th><th>O que quer dizer</th></tr></thead>
            <tbody>
              {LEITURA_2310.map(([fato, valor, leitura]) => (
                <tr key={fato}><td>{fato}</td><td><b>{valor}</b></td><td>{leitura}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {PLANO.map((grupo) => (
          <div key={grupo.titulo}>
            <h4 className="sjMkH4">{grupo.titulo}</h4>
            {grupo.itens.map((item) => (
              <label key={item.id} className="sjMkCk">
                <input type="checkbox" checked={marcados.includes(item.id)} onChange={(evento) => alternar(item.id, evento.target.checked)} />
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
