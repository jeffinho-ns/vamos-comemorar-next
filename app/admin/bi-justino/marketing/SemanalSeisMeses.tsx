"use client";

import type { ZigAoVivo } from "../zigValor";
import { GraficoLinha, type SerieLinha } from "./GraficoLinha";
import { ddMm, regressao, textoTendencia } from "./numeros";
import { semanasSeisMeses } from "./series";

export function SemanalSeisMeses({
  zig,
  onSalvo,
  forcar,
}: {
  zig: ZigAoVivo | null;
  onSalvo: () => void;
  forcar: number;
}) {
  const semanas = semanasSeisMeses(zig);
  const rotulos = semanas.map((semana) => ddMm(semana.inicio));
  const fat = semanas.map((semana) => semana.faturamento);
  const tendenciaFat = fat.length >= 2 ? regressao(fat).fit : null;
  const comTicket = semanas.filter((semana) => semana.ticket != null && semana.publico > 0);
  const rotulosTicket = comTicket.map((semana) => ddMm(semana.inicio));
  const ticket = comTicket.map((semana) => semana.ticket || 0);
  const tendenciaTicket = ticket.length >= 2 ? regressao(ticket).fit : null;
  const seriesFat: SerieLinha[] = [
    { nome: "Faturamento semanal", cor: "#34d399", area: true, valores: fat },
  ];
  if (tendenciaFat) seriesFat.push({ nome: "Tendência", cor: "#fbbf24", tracejado: true, valores: tendenciaFat });
  const seriesTicket: SerieLinha[] = [
    { nome: "Ticket médio semanal", cor: "#60a5fa", area: true, valores: ticket },
  ];
  if (tendenciaTicket) seriesTicket.push({ nome: "Tendência", cor: "#fbbf24", tracejado: true, valores: tendenciaTicket });

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Faturamento e ticket médio semanal — últimos 6 meses</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
      </div>
      <p className="sjNote">
        Semanas de segunda a domingo, só as já fechadas (a semana corrente fica de fora pra não puxar a tendência pra baixo). Linha tracejada = tendência (regressão linear). Ticket médio = faturamento ÷ público das semanas com os dois dados.
        {semanas.length >= 2 ? (
          <span className="sjMini"> Período: semana de {ddMm(semanas[0].inicio)} a {ddMm(semanas[semanas.length - 1].inicio)} ({semanas.length} semanas).</span>
        ) : null}
      </p>
      <h4 className="sjMkH4">Faturamento semanal</h4>
      <GraficoLinha
        rotulos={rotulos}
        series={seriesFat}
        aria="Faturamento semanal dos últimos 6 meses"
        analise={semanas.length >= 2 ? textoTendencia("Faturamento semanal", rotulos, fat, "semanas") : undefined}
        forcar={forcar}
        vazio="Ainda não há 2 semanas fechadas com faturamento capturado pra montar a tendência."
      />
      <h4 className="sjMkH4">Ticket médio semanal</h4>
      <GraficoLinha
        rotulos={rotulosTicket}
        series={seriesTicket}
        aria="Ticket médio semanal dos últimos 6 meses"
        analise={comTicket.length >= 2 ? textoTendencia("Ticket médio", rotulosTicket, ticket, "semanas") : undefined}
        forcar={forcar}
        vazio="Poucas semanas com público capturado pra calcular o ticket médio."
      />
    </section>
  );
}
