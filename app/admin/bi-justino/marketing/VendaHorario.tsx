"use client";

import { useState } from "react";
import { TabelaHorario } from "../tabelasReais";
import type { ZigAoVivo } from "../zigValor";
import { GraficoLinha } from "./GraficoLinha";
import { textoHorario } from "./numeros";

const DIAS = ["Geral", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const CORES: Record<string, string> = {
  Geral: "#e66767",
  Segunda: "#3987e5",
  Terça: "#d95926",
  Quarta: "#199e70",
  Quinta: "#c98500",
  Sexta: "#d55181",
  Sábado: "#008300",
  Domingo: "#9085e9",
};

function pontosDoDia(zig: ZigAoVivo | null, dia: string) {
  if (!zig?.horario) return [];
  if (dia === "Geral") return zig.horario.pontos || [];
  return zig.horario.porDia?.[dia] || [];
}

export function VendaHorario({
  zig,
  onSalvo,
  forcar,
}: {
  zig: ZigAoVivo | null;
  onSalvo: () => void;
  forcar: number;
}) {
  const [dia, setDia] = useState("Geral");
  const pontos = pontosDoDia(zig, dia);
  const rotulos = pontos.map((ponto) => ponto.hora);
  const valores = pontos.map((ponto) => ponto.valor);
  const vazio = zig?.horario ? "Sem dado suficiente ainda." : "Sem captura de horário ainda.";
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Venda por horário • média histórica por dia da semana</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
      </div>
      <p className="sjNote">
        Faturamento médio de cada bloco de horário, quebrado por dia da semana. Geral é a média de todos os dias juntos. O valor já vem em reais no painel.
      </p>
      <div className="sjDias" role="tablist" aria-label="Dia da semana">
        {DIAS.map((nome) => (
          <button key={nome} type="button" className={dia === nome ? "on" : ""} aria-pressed={dia === nome} onClick={() => setDia(nome)}>{nome}</button>
        ))}
      </div>
      <div className="sjLegenda">
        <span><i style={{ background: CORES[dia] }} />{dia}</span>
      </div>
      <GraficoLinha
        rotulos={rotulos}
        series={[{ nome: dia, cor: CORES[dia] || "#e66767", area: true, valores }]}
        aria={`Venda média por horário em ${dia}`}
        analise={valores.length >= 2 ? textoHorario(rotulos, valores, dia) : undefined}
        forcar={forcar}
        vazio={vazio}
      />
      <details className="sjMkDetalhe">
        <summary>Ver tabela de valores</summary>
        <div className="sjMkNota">
          <TabelaHorario zig={zig} escolha={dia} />
        </div>
      </details>
    </section>
  );
}
