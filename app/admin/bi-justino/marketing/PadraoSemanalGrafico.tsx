"use client";

import { analisePadraoSemana } from "./analiseTexto";
import { BarrasSemana } from "./BarrasSemana";
import type { ZigPorData } from "./espelhoDados";
import { reais } from "./numeros";
import { padraoSemanal, WEEKDAY_LABEL } from "./series";

/** Card "📊 Padrão semanal • faturamento e ticket médio por dia da semana" (renderPadraoSemanalBase). */
export function PadraoSemanalGrafico({ zig, onSalvo, forcar }: { zig: ZigPorData; onSalvo: () => void; forcar: number }) {
  const linhas = padraoSemanal(zig);
  const fat = (linhas ?? []).map((linha) => ({ label: linha.label, valor: linha.fatMedio, texto: reais(linha.fatMedio) }));
  const ticket = (linhas ?? []).map((linha) => ({ label: linha.label, valor: linha.ticketMedio || 0, texto: linha.ticketMedio ? reais(linha.ticketMedio) : "—" }));
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>📊 Padrão semanal • faturamento e ticket médio por dia da semana</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      <p className="sjNote">
        Média de cada dia da semana (segunda a domingo) desde 01/07/2026 — dia com faturamento zero (fechado) fica de fora da média, conta só dia que realmente abriu. Público médio = média simples do público nos dias com público registrado (pode ser menos dias que &quot;Dias no período&quot;, se algum dia aberto ainda não tem público capturado). Ticket médio = soma do faturamento ÷ soma do público, só nos dias com público registrado.
      </p>
      {!linhas ? <p className="sjMini">Sem dado de faturamento desde 01/07/2026 ainda.</p> : (
        <>
          <h4 className="sjMkH4">Faturamento médio por dia da semana</h4>
          <BarrasSemana itens={fat} cor="#c96736" aria="Faturamento médio por dia da semana" analise={analisePadraoSemana(fat, "Faturamento médio").join(" ")} forcar={forcar} />
          <h4 className="sjMkH4">Ticket médio por dia da semana</h4>
          <BarrasSemana itens={ticket} cor="#a78bfa" aria="Ticket médio por dia da semana" analise={analisePadraoSemana(ticket, "Ticket médio").join(" ")} forcar={forcar} />
          <div className="sjTableInner sjMkNota">
            <table>
              <thead><tr><th>Dia da semana</th><th>Dias no período</th><th>Faturamento médio</th><th>Público médio</th><th>Ticket médio</th></tr></thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.wd}>
                    <td>{WEEKDAY_LABEL[linha.wd]}</td>
                    <td>{linha.nDias}</td>
                    <td>{reais(linha.fatMedio)}</td>
                    <td>{linha.pubMedio != null ? Math.round(linha.pubMedio).toLocaleString("pt-BR") : <span className="sjMini">sem público</span>}</td>
                    <td>{linha.ticketMedio != null ? reais(linha.ticketMedio) : <span className="sjMini">sem público</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
