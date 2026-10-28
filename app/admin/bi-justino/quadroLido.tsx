"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import type { ZigAoVivo } from "./zigValor";

const LANCAMENTO = new Set([
  "Envio do dia • Marketing",
  "Envio do dia • Gerente Operador",
  "Fechar mês • Marketing",
  "Fechar mês • Reservas",
  "Fechar mês • Eventos",
  "Fechar mês • Operação",
  "Fechar mês • Auditoria Operacional",
  "+ Nova demanda / pauta / ata",
  "+ Novo evento",
  "+ Nova cotação • Cliente",
  "+ Nova cotação • Evento",
  "+ Nova cotação • Financeiro",
  "+ Novo documento",
  "+ Novo item",
  "+ Adicionar contato de emergência",
  "Nova reserva • Seu Justino",
  "Novo colaborador",
  "Acessos cadastrados",
  "Elegibilidade do bônus • salário e admissão",
  "Histórico de exclusões",
  "Manual operacional",
  "Ficou com dúvida?",
  "Revisar e enviar contrato",
  "Solicitação semanal de freelancers",
  "Solicitação de freelancers (avulsa)",
  "Leitura de medidores (foto)",
  "Projeção de gastos • agendamento futuro",
]);

export function ehLancamento(titulo: string) {
  return LANCAMENTO.has(titulo);
}

export function temQuadroLido(titulo: string) {
  return titulo.startsWith("Top 6 ");
}

type ItemVenda = { nome: string; quantidade?: number; valorTotal?: number; cmvPct?: number | null };

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return <AnimatedNumber value={valor} kind="money" />;
}

function TabelaItens({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: { cels: (string | number | null | undefined | ReactNode)[] }[];
}) {
  if (!linhas.length) return <p className="sjMini">Ainda sem cópia no banco.</p>;
  return (
    <div className="sjTableInner">
      <table>
        <thead><tr>{colunas.map((col) => <th key={col}>{col}</th>)}</tr></thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={String(linha.cels[0])}>
              {linha.cels.map((cel, indice) => <td key={colunas[indice]}>{cel ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function venda(itens: ItemVenda[] | undefined, modo: "qtd" | "cmv") {
  return (itens || []).slice(0, 6).map((item) => ({
    cels: modo === "qtd"
      ? [item.nome, item.quantidade ?? "—", reais(item.valorTotal)]
      : [item.nome, item.cmvPct == null ? "—" : `${item.cmvPct.toFixed(1).replace(".", ",")}%`, reais(item.valorTotal)],
  }));
}

export function TabelaQuadro({ titulo, zig }: { titulo: string; zig: ZigAoVivo | null }) {
  const ranking = zig?.ranking;
  if (!ranking) return null;
  if (titulo === "Top 6 bebida • mais vendido") {
    return <TabelaItens colunas={["Item", "Qtd", "Valor"]} linhas={venda(ranking.bebida, "qtd")} />;
  }
  if (titulo === "Top 6 comida • mais vendido") {
    return <TabelaItens colunas={["Item", "Qtd", "Valor"]} linhas={venda(ranking.comida, "qtd")} />;
  }
  if (titulo === "Top 6 bebida • melhor CMV") {
    return <TabelaItens colunas={["Item", "CMV%", "Valor vendido"]} linhas={venda(ranking.bebidaCmv, "cmv")} />;
  }
  if (titulo === "Top 6 comida • melhor CMV") {
    return (
      <>
        <TabelaItens colunas={["Item", "CMV%", "Valor vendido"]} linhas={venda(ranking.comidaCmv, "cmv")} />
        <TabelaItens
          colunas={["Item", "Valor vendido", "% acumulado", "Classe"]}
          linhas={(ranking.curvaAbc || []).slice(0, 12).map((item) => ({
            cels: [item.nome, reais(item.valorTotal), item.pctAcumulado ?? "—", item.classe || "—"],
          }))}
        />
      </>
    );
  }
  return null;
}
