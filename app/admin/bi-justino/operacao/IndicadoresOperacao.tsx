"use client";

import { AnimatedNumber } from "../AnimatedNumber";
import { AlertasFlow } from "../DiretoriaQuadros";
import { GraficoTicketSemanal } from "../GraficoTicketSemanal";
import { campoPainel } from "../campoPainel";
import type { DreAoVivo } from "../dreValor";
import type { BiLiveData } from "../useBiLive";
import type { DadosPlanilha } from "../usePlanilha";
import type { ZigAoVivo } from "../zigValor";
import { Kpi } from "./Cartao";
import { fmtData } from "./formato";
import { enviosOperacao } from "./RegistroDia";

const KPIS = ["Público mês", "Perdas / desperdício", "Custo sensível visível", "CMV teórico (parcial)", "Cobertura ficha técnica", "CMO / receita (sem taxa de serviço)", "Bônus projetado"];

function ValorKpi({ campo, zig, dre, live }: { campo: string; zig: ZigAoVivo | null; dre: DreAoVivo | null; live: BiLiveData | null }) {
  const real = campoPainel("operacao", campo, zig, dre, live);
  if (!real || real.valor == null) return <>{real?.texto || "—"}</>;
  if (real.tipo === "int") return <AnimatedNumber value={real.valor} />;
  return <AnimatedNumber value={real.valor} kind={real.tipo === "pct" ? "pct" : "money"} />;
}

/** Gráfico "Perdas / desperdício — envios recentes" (renderTrendChart com área). */
function GraficoPerdas({ pontos }: { pontos: { label: string; valor: number }[] }) {
  if (!pontos.length) return <p className="sjMini">Sem envios ainda.</p>;
  const largura = 860;
  const altura = 200;
  const padE = 50;
  const padB = 28;
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const passo = pontos.length > 1 ? (largura - padE - 10) / (pontos.length - 1) : 0;
  const x = (i: number) => padE + i * passo;
  const y = (v: number) => 10 + (altura - padB - 10) * (1 - v / max);
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.valor)}`).join(" ");
  const area = `${linha} L${x(pontos.length - 1)},${altura - padB} L${x(0)},${altura - padB} Z`;
  return (
    <svg className="opGrafico" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Perdas por envio">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={padE} x2={largura - 10} y1={y(max * f)} y2={y(max * f)} stroke="#2a221c" />
          <text x={padE - 6} y={y(max * f) + 4} fontSize="10" fill="#a08f7d" textAnchor="end">{Math.round(max * f).toLocaleString("pt-BR")}</text>
        </g>
      ))}
      <path d={area} fill="#f76e7c22" />
      <path d={linha} fill="none" stroke="#f76e7c" strokeWidth="2" />
      {pontos.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.valor)} r="3" fill="#f76e7c" />
          {pontos.length <= 16 || i % Math.ceil(pontos.length / 16) === 0 ? <text x={x(i)} y={altura - 10} fontSize="10" fill="#a08f7d" textAnchor="middle">{p.label.slice(4, 9)}</text> : null}
        </g>
      ))}
    </svg>
  );
}

export function IndicadoresOperacao({ zig, dre, live, dados, onSalvo }: { zig: ZigAoVivo | null; dre: DreAoVivo | null; live: BiLiveData | null; dados: DadosPlanilha; onSalvo: () => void }) {
  const docs = enviosOperacao(dados);
  const pontos = docs.slice(0, 30).slice().reverse().map((d) => ({ label: fmtData(d.date), valor: Number(d.values?.opLoss) || 0 }));
  const cmo = campoPainel("operacao", "CMO / receita (sem taxa de serviço)", zig, dre, live);
  const cmoTxt = cmo?.valor == null ? "—" : `${cmo.valor.toFixed(1).replace(".", ",")}%`;
  const cmoNivel = cmo?.valor == null ? "" : cmo.valor <= 19 ? "🟢 SAUDÁVEL" : cmo.valor <= 23 ? "🟡 ATENÇÃO" : "🔴 CRÍTICO";
  return (
    <>
      <div className="opFull"><AlertasFlow titulo="Alertas Operação" alertas={zig?.quadros?.operacao?.alertas || []} /></div>
      {KPIS.map((campo) => (
        <Kpi
          key={campo}
          titulo={campo}
          valor={<ValorKpi campo={campo} zig={zig} dre={dre} live={live} />}
          dica={campo === "CMO / receita (sem taxa de serviço)" ? (
            <>
              <b>Definição do CMO:</b> percentual do faturamento (sem a taxa de serviço, que é repassada à equipe).
              <div className="opTipRow"><span>🟢 ≤ 19%</span><span>🟡 até 23%</span><span>🔴 acima de 23%</span></div>
              <div>Meta = 15% RH estrutural + 4% extras do faturamento. Atenção = mesma folga usada nos alertas de RH estrutural (até 18%) e Extras (até 5%) somada.</div>
              <div>Como estamos: <b>{cmoTxt}</b> {cmoNivel}</div>
            </>
          ) : campo === "Bônus projetado" ? (
            <>Meta anual do salário base × tempo de casa × trava pela margem da casa (0% se margem &lt;8%, até 125% se ≥15%) × nota (50% desempenho da área + 30% margem da casa + 20% disciplina). Só aparece pro administrador do BI.</>
          ) : undefined}
        />
      ))}
      <section className="sjCard sjBloco opFull">
        <h3>Perdas / desperdício — envios recentes</h3>
        <GraficoPerdas pontos={pontos} />
      </section>
      <div className="opFull"><GraficoTicketSemanal zig={zig} onAtualizar={onSalvo} /></div>
    </>
  );
}
