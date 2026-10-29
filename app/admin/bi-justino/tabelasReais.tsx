"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import type { DreAoVivo } from "./dreValor";
import type { BiLiveData, BiRecente } from "./useBiLive";
import { porDiaDaSemana, type ZigAoVivo } from "./zigValor";

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return <AnimatedNumber value={valor} kind="money" />;
}

function Tabela({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: { key: string; cels: (string | number | ReactNode)[] }[];
}) {
  if (!linhas.length) return <p className="sjMini">Ainda sem esse dado no banco.</p>;
  return (
    <div className="sjTableInner">
      <table>
        <thead>
          <tr>{colunas.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.key}>
              {linha.cels.map((cel, indice) => <td key={colunas[indice]}>{cel ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function TabelaQuadroSemana({ live }: { live: BiLiveData | null }) {
  const quadro = live?.quadroSemana;
  if (!quadro) return <p className="sjMini">Ainda sem reservas nesta semana no banco.</p>;
  return (
    <>
      <Tabela
        colunas={["Indicador", ...DIAS, "Total"]}
        linhas={[
          {
            key: "reservas",
            cels: ["Reservas", ...quadro.indicadores.reservas, quadro.indicadores.reservas.reduce((a, b) => a + b, 0)],
          },
          {
            key: "pessoas",
            cels: ["Pessoas", ...quadro.indicadores.pessoas, quadro.indicadores.pessoas.reduce((a, b) => a + b, 0)],
          },
          {
            key: "checkins",
            cels: ["Check-ins", ...quadro.indicadores.checkins, quadro.indicadores.checkins.reduce((a, b) => a + b, 0)],
          },
        ]}
      />
      <Tabela
        colunas={["Data", "Reservas (pax)", "Happy Hour", "Despedida", "Aniversário", "Eventos (pax)"]}
        linhas={quadro.dias.map((dia) => ({
          key: dia.data,
          cels: [dia.data, dia.pessoas, "—", dia.despedida, dia.aniversario, dia.listaSexta],
        }))}
      />
    </>
  );
}

export function TabelaPadraoSemanal({ zig }: { zig: ZigAoVivo | null }) {
  const dias = porDiaDaSemana(zig);
  return (
    <Tabela
      colunas={["Dia da semana", "Dias no período", "Faturamento médio", "Público médio", "Ticket médio"]}
      linhas={dias.map((dia) => ({
        key: dia.nome,
        cels: [dia.nome, dia.dias, reais(dia.faturamentoMedio), dia.publicoMedio == null ? "—" : Math.round(dia.publicoMedio), reais(dia.ticketMedio)],
      }))}
    />
  );
}

export function TabelaSemanas({ zig }: { zig: ZigAoVivo | null }) {
  return (
    <Tabela
      colunas={["Semana", "Faturamento", "Público", "Ticket médio"]}
      linhas={(zig?.semanas || []).slice(0, 26).map((semana) => ({
        key: semana.inicio,
        cels: [`${semana.inicio} → ${semana.fim}`, reais(semana.faturamento), semana.publico, reais(semana.ticket)],
      }))}
    />
  );
}

export function TabelaHorario({ zig, escolha }: { zig: ZigAoVivo | null; escolha: string }) {
  const pontos = (escolha && escolha !== "Geral"
    ? zig?.horario?.porDia?.[escolha]
    : zig?.horario?.pontos) || zig?.horario?.pontos || [];
  return (
    <Tabela
      colunas={["Horário", "Faturamento médio"]}
      linhas={pontos.map((ponto) => ({
        key: ponto.hora,
        cels: [ponto.hora, reais(ponto.valor)],
      }))}
    />
  );
}

export function TabelaEventos({ zig }: { zig: ZigAoVivo | null }) {
  return (
    <Tabela
      colunas={["Data", "Cliente", "Tipo", "Pax", "Valor contrato", "Sinal", "Status", "Pendências"]}
      linhas={(zig?.eventosResumo?.lista || []).map((item, indice) => ({
        key: `${item.data}-${indice}`,
        cels: [item.data, item.cliente, item.tipo, item.pax, reais(item.contrato), reais(item.sinal), item.status, "—"],
      }))}
    />
  );
}

export function TabelaLancamentos({
  zig,
  area,
  colunas,
  chaves,
}: {
  zig: ZigAoVivo | null;
  area: string;
  colunas: string[];
  chaves: string[];
}) {
  const linhas = zig?.lancamentos?.[area] || [];
  return (
    <Tabela
      colunas={colunas}
      linhas={linhas.map((linha, indice) => ({
        key: `${linha.date}-${indice}`,
        cels: chaves.map((chave) => {
          const valor = linha[chave];
          if (chave === "date") return String(valor || "—");
          return typeof valor === "number" ? reais(valor) : valor ?? "—";
        }),
      }))}
    />
  );
}

export function TabelaFicha({ zig }: { zig: ZigAoVivo | null }) {
  return (
    <Tabela
      colunas={["Item", "Problema", "Origem"]}
      linhas={(zig?.ranking?.semFicha || []).map((item) => ({
        key: item.nome,
        cels: [item.nome, item.tipo || "Sem ficha", item.categoria || "ZigPay"],
      }))}
    />
  );
}

export function TabelaCmvAlerta({
  zig,
  tipo,
}: {
  zig: ZigAoVivo | null;
  tipo: "comida" | "bebida";
}) {
  const itens = tipo === "comida" ? zig?.ranking?.comidaCmv : zig?.ranking?.bebidaCmv;
  return (
    <Tabela
      colunas={["Item", "CMV", "Meta", "Situação"]}
      linhas={(itens || []).map((item) => {
        const cmv = item.cmvPct;
        const meta = 22;
        const situacao = cmv == null ? "Sem ficha" : cmv <= meta ? "Dentro" : "Acima da meta";
        return {
          key: item.nome,
          cels: [item.nome, cmv == null ? "—" : `${cmv.toFixed(1).replace(".", ",")}%`, `${meta}%`, situacao],
        };
      })}
    />
  );
}

export function TabelaHistoricoDre({ dre }: { dre: DreAoVivo | null }) {
  if (!dre?.disponivel || dre.valores?.revenue == null) {
    return <p className="sjMini">A DRE do mês ainda não entrou no banco.</p>;
  }
  return (
    <Tabela
      colunas={["Mês", "Faturamento bruto"]}
      linhas={[{ key: dre.mes || "mes", cels: [dre.mes || "—", reais(dre.valores.revenue)] }]}
    />
  );
}

export function celulaReserva(coluna: string, row: BiRecente, quando: string) {
  const c = coluna.toLowerCase();
  if (c.includes("data")) return quando;
  if (c.includes("cliente") || c.includes("nome")) return row.nome;
  if (c.includes("telefone")) return row.telefone || "—";
  if (c.includes("e-mail") || c.includes("email")) return row.email || "—";
  if (c.includes("pax") || c.includes("pessoa")) return String(row.pessoas);
  if (c.includes("tipo") || c.includes("status")) return row.status;
  if (c.includes("hora")) return row.hora || "—";
  if (c.includes("observ")) return row.checkedIn ? "Check-in feito" : "—";
  if (c.includes("enviado")) return row.origem || "Agilizai";
  return "—";
}

export function temTabelaReal(titulo: string) {
  return /quadro geral da semana|padrão semanal|faturamento e ticket médio semanal|venda por horário|eventos cadastrados|ficha técnica|alertas • comida|alertas • bebida|últimos envios|faturamento histórico \(dre\)/i.test(
    titulo,
  );
}
