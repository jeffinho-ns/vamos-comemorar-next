"use client";

import { GraficoPct } from "./GraficoPct";
import { Badge, Cabecalho, Kpi, Tabela } from "../financeiro/ui";
import { brl, fmtDate, type MapasZig } from "../financeiro/comum";
import { auditoriaCmv, fmtPctOuTraco, nivelCobertura, type CmvDoc, type ItemRanking } from "./cmvCalc";

/** Quadro "CMV teórico automático (parcial) • robô ZigPay × ficha técnica Everest" (refreshCmvTeoricoParcial). */
export function CmvTeoricoParcial({
  docs,
  validos,
  atual,
  semFicha,
  zig,
  onAtualizar,
}: {
  docs: CmvDoc[];
  validos: CmvDoc[];
  atual: CmvDoc | null;
  semFicha: ItemRanking[];
  zig: MapasZig;
  onAtualizar: () => void;
}) {
  const cronologicos = [...validos].reverse();
  const cob = atual?.coberturaTotalPct ?? null;
  const nivel = nivelCobertura(cob);
  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo="CMV teórico automático (parcial) • robô ZigPay × ficha técnica Everest">
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
        <Badge nivel={nivel}>Cobertura: {fmtPctOuTraco(cob)}</Badge>
      </Cabecalho>
      <p className="sjNote">Cruza a venda por item da ZigPay com o custo da ficha técnica do Everest. É a única fonte de CMV teórico da aba agora — não há mais lançamento manual. A badge acima mostra quanto % do vendido está vinculado a uma ficha técnica — cobertura baixa é falta de ficha cadastrada no Everest, não o robô funcionando mal.</p>
      <div className="sjAlertaBox y">
        <b>Combo/drink com sub-ingrediente à parte (caipirinha, clássico) ainda entra como sem ficha.</b><br />
        Testado: só 31% dos sub-ingredientes desses itens (fruta, açúcar, gelo) batem por nome com algum produto cadastrado no Everest — o resto não tem custo próprio lá, é insumo de preparo, não produto vendável. Calcular a média só com o que bate puxaria o custo pra cima sem necessidade (ex.: sobra só a bebida cara da mistura, sem o gelo/fruta baratos entrando na conta). Até o Márcio cadastrar o sub-preparo desses itens no Everest (lista em <code>robo-zigpay/cmv-teorico/subprodutos_para_corrigir.xlsx</code>), esses itens continuam contando pro faturamento total mas não entram no CMV% calculado.
      </div>
      <div className="sjAlertaBox r">
        <b>Correção imediata • itens sem ficha técnica no Everest (últimos 30 dias, por valor vendido)</b><br />
        A maioria destes <b>não</b> é o problema do combo acima — é cadastro simples faltando no Everest. Cadastrar estes primeiro é o jeito mais rápido de subir a cobertura, sem mexer no problema mais difícil do sub-preparo.
        <Tabela
          colunas={["Item", "Categoria", "Valor vendido (30d)"]}
          vazio="Nenhum item sem ficha no período — cobertura 100%."
          linhas={semFicha.map((it) => ({ key: it.nome, cels: [it.nome, <span key="c" className="sjMini">{it.categoria || "—"}</span>, brl(it.valorTotal)] }))}
        />
      </div>
      <div className="sjGridInterno">
        <Kpi label="Comida • cobertura">{fmtPctOuTraco(atual?.coberturaFoodPct)}</Kpi>
        <Kpi label="Comida • CMV s/ cobertura">{fmtPctOuTraco(atual?.cmvFoodPctSobreCobertura)}</Kpi>
        <Kpi label="Bebida • cobertura">{fmtPctOuTraco(atual?.coberturaBevPct)}</Kpi>
        <Kpi label="Bebida • CMV s/ cobertura">{fmtPctOuTraco(atual?.cmvBevPctSobreCobertura)}</Kpi>
      </div>
      <p className="sjMini" style={{ marginTop: 6 }}>
        {atual
          ? `Referente a ${fmtDate(atual.date)} • comida: ${brl(atual.valorCobertoFood)} cobertos de ${brl(atual.valorTotalFood)} vendidos • bebida: ${brl(atual.valorCobertoBev)} cobertos de ${brl(atual.valorTotalBev)} vendidos.`
          : "—"}
      </p>
      <div className="sjMini sjNotaRobo">
        {auditoriaCmv(docs, zig).map((linha) => <div key={linha}>{linha}</div>)}
      </div>
      <div style={{ marginTop: 12 }}>
        <GraficoPct
          rotulos={cronologicos.map((x) => fmtDate(x.date))}
          series={[
            { nome: "CMV % comida", cor: "#f5b942", valores: cronologicos.map((x) => x.cmvFoodPctSobreCobertura || 0) },
            { nome: "CMV % bebida", cor: "#c96736", valores: cronologicos.map((x) => x.cmvBevPctSobreCobertura || 0) },
          ]}
          aria="CMV teórico por dia"
          vazio="Sem dias válidos suficientes pra desenhar a tendência."
        />
      </div>
    </section>
  );
}
