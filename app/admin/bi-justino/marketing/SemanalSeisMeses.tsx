"use client";

import type { ZigPorData } from "./espelhoDados";
import { GraficoLinha, type SerieLinha } from "./GraficoLinha";
import { ddMm, regressao, textoTendencia } from "./numeros";
import { semanasSeisMeses } from "./series";

/** Card "Faturamento e ticket médio semanal — últimos 6 meses" (renderSemanalTrends). */
export function SemanalSeisMeses({ zig, onSalvo, forcar }: { zig: ZigPorData; onSalvo: () => void; forcar: number }) {
  const semanas = semanasSeisMeses(zig);
  const rotulos = semanas.map((semana) => ddMm(semana.inicio));
  const fat = semanas.map((semana) => semana.rev);
  const tendenciaFat = fat.length >= 4 ? regressao(fat).fit : null;
  const comTicket = semanas.filter((semana) => semana.pub > 0);
  const rotulosTicket = comTicket.map((semana) => ddMm(semana.inicio));
  const ticket = comTicket.map((semana) => semana.revComPub / semana.pub);
  const tendenciaTicket = ticket.length >= 4 ? regressao(ticket).fit : null;
  const seriesFat: SerieLinha[] = [{ nome: "Faturamento semanal", cor: "#34d399", area: true, valores: fat }];
  if (tendenciaFat) seriesFat.push({ nome: "Tendência", cor: "#fbbf24", tracejado: true, valores: tendenciaFat });
  const seriesTicket: SerieLinha[] = [{ nome: "Ticket médio semanal", cor: "#60a5fa", area: true, valores: ticket }];
  if (tendenciaTicket) seriesTicket.push({ nome: "Tendência", cor: "#fbbf24", tracejado: true, valores: tendenciaTicket });
  const poucas = semanas.length < 4;

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Faturamento e ticket médio semanal — últimos 6 meses</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      <p className="sjNote">
        Semanas de segunda a domingo, só as já fechadas (a semana corrente fica de fora pra não puxar a tendência pra baixo). Linha tracejada = tendência (regressão linear). Ticket médio = faturamento ÷ público das semanas com os dois dados capturados pela ZigPay.
        {!poucas ? <span className="sjMini"> Período: semana de {rotulos[0]} a {rotulos[rotulos.length - 1]} ({semanas.length} semanas).</span> : null}
      </p>
      <h4 className="sjMkH4">Faturamento semanal</h4>
      {poucas ? <p className="sjMini">Ainda não há 4 semanas fechadas com faturamento capturado pra montar a tendência.</p> : (
        <GraficoLinha rotulos={rotulos} series={seriesFat} aria="Faturamento semanal dos últimos 6 meses" analise={textoTendencia("Faturamento semanal", rotulos, fat, "semanas")} forcar={forcar} />
      )}
      <h4 className="sjMkH4">Ticket médio semanal</h4>
      {poucas || comTicket.length < 4 ? <p className="sjMini">Poucas semanas com público capturado pra calcular o ticket médio.</p> : (
        <GraficoLinha rotulos={rotulosTicket} series={seriesTicket} aria="Ticket médio semanal dos últimos 6 meses" analise={textoTendencia("Ticket médio", rotulosTicket, ticket, "semanas")} forcar={forcar} />
      )}
    </section>
  );
}
