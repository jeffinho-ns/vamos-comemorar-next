"use client";

import { Badge, Kpi } from "../operacao/Cartao";
import { brl, fmtDma, hojeSp, monthKeyLabel, MES_ABREV } from "../operacao/formato";
import { calcularIndicadores, faturamentoPorMes } from "./indicadores";
import type { Cotacao, Evento } from "./tipos";

function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  if (!anterior) return <span className="sjMini">sem comparação (ano anterior sem dado)</span>;
  const diff = atual - anterior;
  const pctTxt = `${(diff / anterior * 100).toFixed(1).replace(".", ",")}%`;
  return <Badge nivel={diff >= 0 ? "g" : "r"}>{diff >= 0 ? `+${pctTxt}` : pctTxt}</Badge>;
}

/** "Faturamento de eventos por mês" — renderTrendChart com área (12 meses). */
function GraficoTendencia({ serie }: { serie: { mes: string; valor: number }[] }) {
  const largura = 860;
  const altura = 190;
  const padE = 58;
  const padB = 26;
  const max = Math.max(1, ...serie.map((p) => p.valor));
  const passo = (largura - padE - 10) / (serie.length - 1);
  const x = (i: number) => padE + i * passo;
  const y = (v: number) => 10 + (altura - padB - 10) * (1 - v / max);
  const linha = serie.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.valor)}`).join(" ");
  return (
    <svg className="opGrafico" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Faturamento de eventos por mês">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={padE} x2={largura - 10} y1={y(max * f)} y2={y(max * f)} stroke="#2a221c" />
          <text x={padE - 6} y={y(max * f) + 4} fontSize="10" fill="#a08f7d" textAnchor="end">{brl(max * f)}</text>
        </g>
      ))}
      <path d={`${linha} L${x(serie.length - 1)},${altura - padB} L${x(0)},${altura - padB} Z`} fill="#a78bfa22" />
      <path d={linha} fill="none" stroke="#a78bfa" strokeWidth="2" />
      {serie.map((p, i) => (
        <g key={p.mes}>
          <circle cx={x(i)} cy={y(p.valor)} r="3" fill="#a78bfa"><title>{monthKeyLabel(p.mes)}: {brl(p.valor)}</title></circle>
          <text x={x(i)} y={altura - 8} fontSize="10" fill="#a08f7d" textAnchor="middle">{MES_ABREV[Number(p.mes.slice(5, 7)) - 1]}/{p.mes.slice(2, 4)}</text>
        </g>
      ))}
    </svg>
  );
}

export function IndicadoresEventos({ eventos, cotacoes, recarregar }: { eventos: Evento[]; cotacoes: Cotacao[]; recarregar: () => void }) {
  const hoje = hojeSp();
  const d = calcularIndicadores(eventos, cotacoes, hoje);
  const mesLabel = monthKeyLabel(d.mesAtualKey);
  return (
    <section className="sjCard sjBloco opFull">
      <div className="sjRole"><h3>📊 Indicadores de Eventos</h3><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button></div>
      <div className="sjGrid">
        <Kpi titulo="Cotações em andamento" valor={d.emAndamentoCount} sub={`${brl(d.emAndamentoValor)} em negociação`} />
        <Kpi titulo={`Eventos realizados (${mesLabel})`} valor={d.realizadosMesCount} sub={`${brl(d.realizadosMesValor)} faturados`} />
        <Kpi largo titulo="Faturamento do mês" valor={brl(d.fatMesAtual)} sub={<>vs {brl(d.fatMesAnoAnterior)} em {d.anoAnterior} <Variacao atual={d.fatMesAtual} anterior={d.fatMesAnoAnterior} /></>} dica={`${mesLabel} × mesmo mês de ${d.anoAnterior} — soma o valor dos eventos com status "realizado" em cada período.`} />
        <Kpi largo titulo="Faturamento do ano (até hoje)" valor={brl(d.fatAnoAtual)} sub={<>vs {brl(d.fatAnoAnterior)} em {d.anoAnterior} <Variacao atual={d.fatAnoAtual} anterior={d.fatAnoAnterior} /></>} dica={`${d.anoAtual} até hoje × mesmo período (mesmo dia/mês) de ${d.anoAnterior} — corte justo, não compara o ano anterior inteiro.`} />
        <Kpi largo titulo="Cotações fechadas" valor={d.cotEnviadasAnoAtual} sub={<>vs {d.cotEnviadasAnoAnterior} em {d.anoAnterior} <Variacao atual={d.cotEnviadasAnoAtual} anterior={d.cotEnviadasAnoAnterior} /></>} dica={`Cotações com status "enviado" (fechadas) — ${d.anoAtual} × ${d.anoAnterior}, pela data do evento.`} />
        {d.duvidosos.length ? (
          <div className="sjAlert y opFull">
            <span className="sjAlertIcon">!</span>
            <div>
              <b>Pagamento parcial sem contrato assinado • Atenção</b>
              {d.duvidosos.length} evento(s) • {brl(d.duvidososValor)} NÃO contado no faturamento
              <p className="sjMini">{d.duvidosos.slice(0, 5).map((ev) => `${ev.nomeCliente || "(sem nome)"} — ${fmtDma(ev.data)}`).join(", ")}{d.duvidosos.length > 5 ? ` e mais ${d.duvidosos.length - 5}` : ""}</p>
              <p className="sjMini">Evento &quot;realizado&quot; com Pagamento marcado como &quot;parcial&quot; e Contrato ainda não &quot;assinado&quot; — a regra atual não soma esse valor no faturamento até um dos dois ficar claro. Verifique com o time comercial e atualize o campo Contrato ou Pagamento no follow-up do evento.</p>
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Faturamento de eventos por mês</div>
        <GraficoTendencia serie={faturamentoPorMes(eventos, hoje)} />
      </div>
    </section>
  );
}
