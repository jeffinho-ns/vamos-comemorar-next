"use client";

import { useMemo, useState } from "react";
import { AnimatedNumber } from "../AnimatedNumber";
import { EnvioOperacao } from "../EnvioOperacao";
import { campoPainel } from "../campoPainel";
import type { DreAoVivo } from "../dreValor";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import { cmvTeoricoBlend, type ZigAoVivo } from "../zigValor";
import { Cartao } from "./Cartao";
import { brl, fmtData, fmtHora, hojeSp, monthKeyLabel } from "./formato";

export interface EnvioDoc {
  area: string;
  date: string;
  values: Record<string, number | null | undefined>;
  notes: Record<string, string | undefined>;
  submittedByName: string;
  submittedAt: string;
}

const SENSIVEIS: { titulo: string; ajuda: string }[] = [
  { titulo: "Energia", ajuda: "Valor lançado pelo Financeiro." },
  { titulo: "Água", ajuda: "Valor lançado pelo Financeiro." },
  { titulo: "Gás", ajuda: "Valor lançado pelo Financeiro." },
  { titulo: "Descartáveis", ajuda: "Valor validado pelo Financeiro." },
  { titulo: "Segurança", ajuda: "Valor validado pelo Financeiro." },
];

function IndicadoresSensiveis({ zig, dre }: { zig: ZigAoVivo | null; dre: DreAoVivo | null }) {
  const cmv = zig ? cmvTeoricoBlend(zig) : null;
  return (
    <Cartao titulo="Indicadores sensíveis • somente leitura" aberto={false}>
      <h3>Indicadores sensíveis • somente leitura</h3>
      {SENSIVEIS.map((linha) => {
        const real = campoPainel("operacao", linha.titulo, zig, dre, null);
        return (
          <div key={linha.titulo} className="sjField">
            <div><b>{linha.titulo}</b></div>
            <div className="v">{real?.valor == null ? "—" : <AnimatedNumber value={real.valor} kind="money" />}</div>
            <p className="sjMini">{linha.ajuda}</p>
          </div>
        );
      })}
      <div className="sjField">
        <div><b>CMV teórico (parcial)</b></div>
        <div className="v">{cmv == null ? "—" : <AnimatedNumber value={cmv} kind="pct" />}</div>
        <p className="sjMini">Automático: ficha técnica do Everest × venda por item da ZigPay. Não há mais CMV real medido manualmente pelo Márcio.</p>
      </div>
    </Cartao>
  );
}

export function enviosOperacao(dados: DadosPlanilha): EnvioDoc[] {
  return payloadDe<{ docs?: EnvioDoc[] }>(dados, "getEntries:operacao")?.docs ?? [];
}

/** "Últimos envios • Operação" (renderHistory('operacao') + visão por mês). */
function UltimosEnvios({ docs, recarregar }: { docs: EnvioDoc[]; recarregar: () => void }) {
  const meses = useMemo(() => Array.from(new Set(docs.map((d) => d.date.slice(0, 7)))).sort().reverse(), [docs]);
  const [mes, setMes] = useState(() => hojeSp().slice(0, 7));
  const visiveis = docs.filter((d) => d.date.slice(0, 7) === (meses.includes(mes) ? mes : meses[0] ?? mes));
  const soma = (campo: string) => visiveis.reduce((s, d) => s + (Number(d.values?.[campo]) || 0), 0);
  return (
    <Cartao titulo="Últimos envios • Operação">
      <div className="sjRole">
        <h3>Últimos envios • Operação</h3>
        <span className="opLinhaAcoes" style={{ marginTop: 0 }}>
          <select className="sjInput" style={{ width: 170 }} value={meses.includes(mes) ? mes : meses[0] ?? mes} onChange={(e) => setMes(e.target.value)}>
            {(meses.length ? meses : [mes]).map((m) => <option key={m} value={m}>{monthKeyLabel(m)}</option>)}
          </select>
          <button type="button" className="sjAnaliseBtn" style={{ marginTop: 0 }} onClick={recarregar}>🔄 Atualizar</button>
        </span>
      </div>
      <div className="sjTableInner opTabela">
        <table>
          <thead><tr><th>Data</th><th>Enviado por</th><th>Hora</th><th>Público</th><th>Perdas</th><th>Manutenção</th><th>Ocorrências</th></tr></thead>
          <tbody>
            {visiveis.length ? visiveis.map((d) => (
              <tr key={d.date}>
                <td>{fmtData(d.date)}</td><td>{d.submittedByName || "—"}</td><td>{fmtHora(d.submittedAt)}</td>
                <td>{d.values?.opPublic ?? "—"}</td><td>{brl(d.values?.opLoss)}</td><td>{brl(d.values?.opMaintenance)}</td>
                <td className="sjMini" style={{ whiteSpace: "normal", maxWidth: 260 }}>{d.notes?.opIncidents || "—"}</td>
              </tr>
            )) : <tr><td colSpan={7} className="sjMini">Sem envios ainda.</td></tr>}
            {visiveis.length ? (
              <tr className="opTotal"><td colSpan={3}>Total ({visiveis.length} envio(s))</td><td>{soma("opPublic")}</td><td>{brl(soma("opLoss"))}</td><td>{brl(soma("opMaintenance"))}</td><td>—</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="sjMini" style={{ marginTop: 6 }}>Apagar envio continua no painel do Seu Justino (ação <code>deleteEntry</code> não exposta aqui).</p>
    </Cartao>
  );
}

export function RegistroDia({ zig, dre, dados, recarregar, onSalvo }: { zig: ZigAoVivo | null; dre: DreAoVivo | null; dados: DadosPlanilha; recarregar: () => void; onSalvo: () => void }) {
  const docs = enviosOperacao(dados);
  return (
    <>
      <div className="opFull">
        <EnvioOperacao key={`${zig?.envioOperacao?.date || "novo"}-${zig?.envioOperacao?.opLoss ?? ""}`} zig={zig} onSalvo={() => { onSalvo(); recarregar(); }} />
      </div>
      <IndicadoresSensiveis zig={zig} dre={dre} />
      <UltimosEnvios docs={docs} recarregar={recarregar} />
    </>
  );
}
