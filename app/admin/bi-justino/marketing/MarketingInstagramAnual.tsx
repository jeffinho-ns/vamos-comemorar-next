"use client";

import { useState } from "react";
import { analiseLinhas } from "./analiseTexto";
import { AnaliseBloco } from "./AnaliseBloco";
import type { InstagramResp } from "./espelhoTipos";
import { fmtK, IG_ANUAL_METRICAS, IG_MESES_CURTO, serieAnual } from "./instagramCalculo";

const W = 860;
const H = 250;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 24;

function caminho(vals: (number | null)[], xAt: (i: number) => number, yAt: (v: number) => number) {
  let d = "";
  let pen = false;
  vals.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)} `;
    pen = true;
  });
  return d;
}

/** Card "📈 Acompanhamento anual • ano atual × ano anterior" (renderInstagramAnual). */
export function MarketingInstagramAnual({ resp }: { resp: InstagramResp | null }) {
  const [metrica, setMetrica] = useState<string>("reach");
  const conectado = Boolean(resp?.ok && resp.configurado);
  const serie = resp && conectado ? serieAnual(resp, metrica) : null;
  const cw = W - PAD_L - PAD_R;
  const chh = H - PAD_T - PAD_B;
  const todos = serie ? [...serie.A, ...serie.B].filter((v): v is number => v != null) : [];
  const maxV = Math.max(1, ...todos) * 1.1;
  const minV = metrica === "followers" && todos.length ? Math.min(...todos) * 0.97 : 0;
  const xAt = (i: number) => PAD_L + i * (cw / 11);
  const yAt = (v: number) => PAD_T + chh - ((v - minV) / Math.max(1, maxV - minV)) * chh;
  const rotulosA = serie ? IG_MESES_CURTO.filter((_, i) => serie.A[i] != null) : [];
  const valoresA = serie ? serie.A.filter((v): v is number => v != null) : [];

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>📈 Acompanhamento anual • ano atual × ano anterior</h3>
        <select className="sjInput" value={metrica} onChange={(evento) => setMetrica(evento.target.value)} aria-label="Métrica">
          {IG_ANUAL_METRICAS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      {!serie ? <p className="sjMini">Disponível quando a conta estiver conectada.</p>
        : !serie.nA && !serie.nB ? <p className="sjMini">Ainda sem série mensal. Ela é preenchida na próxima atualização do Instagram (diária, ou &quot;Buscar do Instagram agora&quot;).</p>
          : (
            <>
              <p className="sjMini">{serie.anoAtual}: {serie.nA} mês(es) com dado • {serie.anoAnt}: {serie.nB} mês(es) com dado.</p>
              <svg viewBox={`0 0 ${W} ${H}`} className="sjFatSvg" role="img" aria-label="Métrica do Instagram por mês, ano atual e anterior" style={{ overflow: "visible" }}>
                {[0, 1, 2, 3, 4].map((g) => {
                  const v = minV + ((maxV - minV) * g) / 4;
                  const y = yAt(v);
                  return <g key={g}><line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#271f1a" /><text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#9a8f86">{fmtK(v)}</text></g>;
                })}
                {IG_MESES_CURTO.map((m, i) => <text key={m} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="#9a8f86">{m}</text>)}
                <path d={caminho(serie.B, xAt, yAt)} fill="none" stroke="#9a8f86" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 5" />
                {serie.B.map((v, i) => (v == null ? null : <circle key={`b${i}`} cx={xAt(i)} cy={yAt(v)} r="3.5" fill="#9a8f86"><title>{IG_MESES_CURTO[i]}/{serie.anoAnt}: {v.toLocaleString("pt-BR")}</title></circle>))}
                <path d={caminho(serie.A, xAt, yAt)} fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {serie.A.map((v, i) => (v == null ? null : <circle key={`a${i}`} cx={xAt(i)} cy={yAt(v)} r="3.5" fill="#fb923c"><title>{IG_MESES_CURTO[i]}/{serie.anoAtual}: {v.toLocaleString("pt-BR")}</title></circle>))}
              </svg>
              <AnaliseBloco texto={analiseLinhas(rotulosA, [{ name: String(serie.anoAtual), values: valoresA }]).join(" ")} forcar={0} />
              <p className="sjMini"><span style={{ color: "#fb923c" }}>●</span> {serie.anoAtual} &nbsp; <span style={{ color: "#9a8f86" }}>●</span> {serie.anoAnt} (tracejado)</p>
              <div className="sjTableInner sjMkTabela">
                <table>
                  <thead><tr><th>Mês</th><th>{serie.anoAnt}</th><th>{serie.anoAtual}</th><th>Variação</th></tr></thead>
                  <tbody>
                    {IG_MESES_CURTO.map((m, i) => {
                      const a = serie.A[i];
                      const b = serie.B[i];
                      const d = a != null && b != null && b > 0 ? (a / b - 1) * 100 : null;
                      return (
                        <tr key={m}>
                          <td>{m}</td>
                          <td>{b == null ? "—" : b.toLocaleString("pt-BR")}</td>
                          <td>{a == null ? "—" : a.toLocaleString("pt-BR")}</td>
                          <td className={d == null ? "" : d >= 0 ? "sjPos" : "sjNeg"}>{d == null ? "—" : `${d >= 0 ? "+" : ""}${d.toFixed(1).replace(".", ",")}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
      <p className="sjMini">Cada mês é a janela de 1 a 30 (a API limita o intervalo a 30 dias); o mês corrente é parcial. O histórico de meses antigos é preenchido pela API em até 3 meses por dia, e o que a API não entregar fica em branco. Seguidores só existem a partir do dia em que o BI começou a registrar.</p>
    </section>
  );
}
