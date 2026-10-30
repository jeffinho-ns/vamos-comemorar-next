"use client";

import { TabelaPadraoSemanal } from "../tabelasReais";
import { porDiaDaSemana, type ZigAoVivo } from "../zigValor";
import { BarrasSemana } from "./BarrasSemana";
import { reais, textoBarras } from "./numeros";

function curto(nome: string) {
  return nome.slice(0, 3);
}

export function PadraoSemanalGrafico({
  zig,
  onSalvo,
  forcar,
}: {
  zig: ZigAoVivo | null;
  onSalvo: () => void;
  forcar: number;
}) {
  const dias = porDiaDaSemana(zig);
  const fat = dias.map((dia) => ({
    label: curto(dia.nome),
    valor: dia.faturamentoMedio || 0,
    texto: dia.faturamentoMedio == null ? "—" : reais(dia.faturamentoMedio),
  }));
  const ticket = dias.map((dia) => ({
    label: curto(dia.nome),
    valor: dia.ticketMedio || 0,
    texto: dia.ticketMedio == null ? "—" : reais(dia.ticketMedio),
  }));
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Padrão semanal • faturamento e ticket médio por dia da semana</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>Atualizar</button>
      </div>
      <p className="sjNote">
        Média de cada dia da semana (segunda a domingo) já calculada no painel. Faturamento médio, público médio e ticket médio vêm de porDiaSemana. O gráfico e a tabela usam os mesmos números.
      </p>
      <h4 className="sjMkH4">Faturamento médio por dia da semana</h4>
      <BarrasSemana
        itens={fat}
        cor="#c96736"
        aria="Faturamento médio por dia da semana"
        analise={textoBarras("Faturamento médio", fat)}
        forcar={forcar}
        vazio="Sem dado de faturamento por dia da semana ainda."
      />
      <h4 className="sjMkH4">Ticket médio por dia da semana</h4>
      <BarrasSemana
        itens={ticket}
        cor="#a78bfa"
        aria="Ticket médio por dia da semana"
        analise={textoBarras("Ticket médio", ticket)}
        forcar={forcar}
        vazio="Sem ticket médio por dia da semana ainda."
      />
      <div className="sjMkNota">
        <TabelaPadraoSemanal zig={zig} />
      </div>
    </section>
  );
}
