"use client";

import { Badge, Cabecalho, Tabela } from "../financeiro/ui";
import { brl, pct } from "../financeiro/comum";
import type { ItemRanking, RankingPayload } from "./cmvCalc";

function linhasVenda(lista: ItemRanking[]) {
  return lista.map((it) => ({ key: it.nome, cels: [it.nome, String(it.quantidade), <span key="v" className="sjMini">{brl(it.valorTotal)}</span>] }));
}
function linhasCmv(lista: ItemRanking[]) {
  return lista.map((it) => ({ key: it.nome, cels: [it.nome, pct(it.cmvPct), <span key="v" className="sjMini">{brl(it.valorTotal)}</span>] }));
}

/** "Top itens vendidos e curva ABC" (refreshItemSalesRanking). */
export function CmvRanking({ ranking, onAtualizar }: { ranking: RankingPayload | null; onAtualizar: () => void }) {
  const dias = ranking?.days || 30;
  const abc = ranking?.curvaAbc || [];
  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo="Top itens vendidos e curva ABC">
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
        <Badge nivel="p">últimos {dias} dias</Badge>
      </Cabecalho>
      <p className="sjNote">Venda por item capturada pelo robô ZigPay dia a dia — <b>só tem histórico a partir de 25/09/2026</b> (dia que passou a gravar esse detalhe), então períodos anteriores ficam sem dado. &quot;Melhor CMV&quot; só entra item com ficha técnica cadastrada no Everest (sem ficha, sem custo conhecido, sem como calcular %).</p>
      <div className="sjGridMeio">
        <section className="sjCard"><h3>Top 6 bebida • mais vendido</h3><Tabela colunas={["Item", "Qtd", "Valor"]} vazio="Sem dado no período." linhas={linhasVenda(ranking?.top6BebidaVenda || [])} /></section>
        <section className="sjCard"><h3>Top 6 comida • mais vendido</h3><Tabela colunas={["Item", "Qtd", "Valor"]} vazio="Sem dado no período." linhas={linhasVenda(ranking?.top6ComidaVenda || [])} /></section>
        <section className="sjCard"><h3>Top 6 bebida • melhor CMV</h3><Tabela colunas={["Item", "CMV%", "Valor vendido"]} vazio="Nenhum item com custo conhecido no período." linhas={linhasCmv(ranking?.top6BebidaCmv || [])} /></section>
        <section className="sjCard"><h3>Top 6 comida • melhor CMV</h3><Tabela colunas={["Item", "CMV%", "Valor vendido"]} vazio="Nenhum item com custo conhecido no período." linhas={linhasCmv(ranking?.top6ComidaCmv || [])} /></section>
      </div>
      <hr className="sjSep" />
      <div className="sjSecao">Curva ABC de venda geral (todos os itens, por valor vendido)</div>
      <p className="sjNote">Classe <b>A</b> = itens que juntos somam até 80% do faturamento de itens; <b>B</b> = até 95%; <b>C</b> = o resto. Foco de reposição/negociação vai em A primeiro.</p>
      <Tabela
        colunas={["Item", "Valor vendido", "% acumulado", "Classe"]}
        vazio="Sem dado no período."
        linhas={abc.map((it) => ({
          key: it.nome,
          cels: [it.nome, brl(it.valorTotal), pct(it.pctAcumulado), <Badge key="c" nivel={it.classe === "A" ? "g" : it.classe === "B" ? "y" : "r"}>{it.classe}</Badge>],
        }))}
      />
    </section>
  );
}
