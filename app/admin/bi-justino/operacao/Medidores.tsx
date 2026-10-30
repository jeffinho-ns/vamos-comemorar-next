"use client";

import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { Badge, Cartao } from "./Cartao";
import { fmtData } from "./formato";

interface LeituraMedidor {
  date: string;
  meterType: string;
  value: number;
  deltaPct: number | null;
  alertFlag: boolean;
  photoUrl: string;
  submittedByName: string;
  submittedAt: string;
}

const MEDIDORES = [
  { chave: "energia", titulo: "Energia elétrica", unidade: "kWh" },
  { chave: "agua", titulo: "Água", unidade: "m³" },
  { chave: "gas", titulo: "Gás", unidade: "m³" },
];
const ROTULO: Record<string, string> = { energia: "Energia elétrica", agua: "Água", gas: "Gás" };

/** Sub-aba "⚡ Medidores": o envio com foto (OCR no Apps Script) fica pendente; o histórico vem de getMeterReadings. */
export function Medidores({ dados, recarregar }: { dados: DadosPlanilha; recarregar: () => void }) {
  const payload = payloadDe<{ docs?: LeituraMedidor[]; latestByType?: Record<string, LeituraMedidor> }>(dados, "getMeterReadings");
  const docs = payload?.docs ?? [];
  return (
    <>
      <Cartao titulo="Leitura de medidores (foto)">
        <div className="sjRole"><h3>Leitura de medidores (foto)</h3><span className="sjBadgeY">ALERTA ≥ 15%</span></div>
        <p className="sjNote">Tire a foto do mostrador de cada medidor. O sistema lê o número sozinho (OCR) e compara com a leitura do dia anterior — confira o valor lido antes de confirmar, ele pode errar em display antigo ou foto tremida. Isto é a <b>leitura de consumo</b> (kWh/m³); o valor em R$ que o Financeiro lança mais abaixo é outra coisa.</p>
        <div className="opMiniKpis">
          {MEDIDORES.map((m) => {
            const ultima = payload?.latestByType?.[m.chave];
            return (
              <div key={m.chave} className="opMiniKpi">
                <small>{m.titulo}</small>
                <div className="v">{ultima ? `${ultima.value} ${m.unidade}` : "—"}</div>
                <span className="sjMini">{ultima ? `Última leitura ${fmtData(ultima.date)}${ultima.deltaPct != null ? ` • ${ultima.deltaPct >= 0 ? "+" : ""}${ultima.deltaPct.toFixed(1)}%` : ""}` : "Sem leitura ainda."}</span>
                <p className="sjMini opPendente" style={{ marginTop: 6 }}>Envio de foto (OCR) e correção de valor continuam no painel do Seu Justino — pendente aqui.</p>
              </div>
            );
          })}
        </div>
      </Cartao>
      <Cartao titulo="Últimos envios • Leitura de medidores">
        <div className="sjRole"><h3>Últimos envios • Leitura de medidores</h3><button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button></div>
        <div className="sjTableInner opTabela">
          <table>
            <thead><tr><th>Data</th><th>Medidor</th><th>Leitura</th><th>Variação</th><th>Foto</th></tr></thead>
            <tbody>
              {docs.length ? docs.slice(0, 20).map((d) => (
                <tr key={`${d.date}-${d.meterType}`}>
                  <td>{fmtData(d.date)}</td><td>{ROTULO[d.meterType] ?? d.meterType}</td><td>{d.value}</td>
                  <td>{d.deltaPct == null ? "—" : `${d.deltaPct >= 0 ? "+" : ""}${d.deltaPct.toFixed(1)}%`} {d.alertFlag ? <Badge nivel="r">15%+</Badge> : null}</td>
                  <td>{d.photoUrl ? <a href={d.photoUrl} target="_blank" rel="noreferrer">ver foto</a> : "—"}</td>
                </tr>
              )) : <tr><td colSpan={5} className="sjMini">Sem leituras ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </Cartao>
    </>
  );
}
