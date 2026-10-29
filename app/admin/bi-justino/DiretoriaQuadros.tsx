"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import type { ZigAoVivo } from "./zigValor";

function dataBr(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return <AnimatedNumber value={valor} kind="money" />;
}

function LinhaProjecao({
  titulo,
  ajuda,
  valor,
  tipo,
  meta,
}: {
  titulo: string;
  ajuda?: string;
  valor: number | null | undefined;
  tipo?: "money" | "pct";
  meta: ReactNode;
}) {
  return (
    <div className="sjField">
      <div>
        <b>{titulo}</b>
        {ajuda ? <p className="sjMini">{ajuda}</p> : null}
      </div>
      <div className="v">
        {valor == null ? "—" : <AnimatedNumber value={valor} kind={tipo === "pct" ? "pct" : "money"} />}
      </div>
      <p className="sjMini">{meta}</p>
    </div>
  );
}

export function ProjecaoConsolidada({ zig }: { zig: ZigAoVivo | null }) {
  const p = zig?.projecao;
  const envioFin = dataBr(p?.envios?.financeiro);
  const envioCmv = dataBr(p?.envios?.cmv);
  return (
    <section className="sjCard sjBloco">
      <h3>Projeção consolidada do mês (última data enviada por área)</h3>
      <LinhaProjecao
        titulo="Faturamento bruto mensal"
        ajuda={envioFin ? `Vem do último envio do Financeiro em ${envioFin}.` : "Vem do último envio do Financeiro."}
        valor={p?.faturamentoBruto ?? zig?.faturamentoMes}
        meta={<>Média histórica aproximada: <b>R$ 526 mil/mês</b> • <span className="sjOk">meta saudável ≥ R$ 600 mil</span></>}
      />
      <LinhaProjecao
        titulo="CMV real consolidado"
        ajuda={envioCmv ? `Vem do último envio de Márcio / CMV em ${envioCmv}.` : "Vem do último envio de Márcio / CMV."}
        valor={p?.cmvReal}
        tipo="pct"
        meta={<>Média usada no BI: <b>20,09%</b> • <span className="sjOk">saudável ≤ 22%</span></>}
      />
      <LinhaProjecao
        titulo="Custos controláveis acumulados"
        valor={p?.controlaveis}
        meta="Soma dos custos atribuídos aos gestores, sem duplicar impostos/fees."
      />
      <LinhaProjecao
        titulo="Custos estruturais + variáveis"
        valor={p?.estruturais}
        meta="Inclui impostos, cartões, fee, IR/CSLL, aluguel e demais blocos não duplicados."
      />
    </section>
  );
}

type AlertaQuadro = {
  nivel?: string | null;
  titulo?: string | null;
  valor?: string | number | null;
  detalhe?: string | null;
  selo?: string | null;
  tipo?: string | null;
};

export function AlertasFlow({
  titulo,
  alertas,
  nota,
}: {
  titulo: string;
  alertas: AlertaQuadro[];
  nota?: string;
}) {
  return (
    <section className="sjCard sjBloco">
      <h3>{titulo}</h3>
      {nota ? <p className="sjMini">{nota}</p> : null}
      <div className="sjAlerts">
        {alertas.length ? alertas.map((alerta) => (
          <article key={`${alerta.titulo}-${alerta.selo}`} className={`sjAlert ${alerta.nivel || "y"}`}>
            <span className="sjAlertIcon" aria-hidden="true">{alerta.nivel === "g" ? "✓" : "!"}</span>
            <div>
              <b>{alerta.titulo} • {alerta.selo}</b>
              <div>
                {alerta.tipo === "money" && typeof alerta.valor === "number"
                  ? reais(alerta.valor)
                  : String(alerta.valor || "—")}
              </div>
              {alerta.detalhe ? <p className="sjMini">{alerta.detalhe}</p> : null}
            </div>
          </article>
        )) : <p className="sjMini">Ainda sem consolidado dessa área no banco.</p>}
      </div>
    </section>
  );
}

export function AlertasDiretoria({ zig }: { zig: ZigAoVivo | null }) {
  return <AlertasFlow titulo="Alertas de diretoria" alertas={zig?.projecao?.alertas || []} />;
}

export function ResponsabilidadeArea({ zig }: { zig: ZigAoVivo | null }) {
  const areas = zig?.projecao?.areas || [];
  return (
    <section className="sjCard sjBloco">
      <h3>Responsabilidade por área e impacto no resultado</h3>
      <div className="sjTableInner">
        <table>
          <thead>
            <tr>
              <th>Área</th>
              <th>Meta de custo</th>
              <th>Real/previsto</th>
              <th>Economia / excesso</th>
              <th>Status</th>
              <th>Bônus projetado</th>
            </tr>
          </thead>
          <tbody>
            {areas.length ? areas.map((area) => (
              <tr key={area.chave || area.label}>
                <td>
                  {area.label}
                  {area.usandoReferencia || (area.envio && !area.envioHoje) ? (
                    <div className="sjMini" style={{ color: "var(--yellow)" }}>
                      {area.usandoReferencia
                        ? "sem envio — usando referência"
                        : `último envio: ${dataBr(area.envio)}`}
                    </div>
                  ) : null}
                </td>
                <td>{reais(area.meta)}</td>
                <td>{reais(area.real)}</td>
                <td className={(area.economia || 0) >= 0 ? "sjPos" : "sjNeg"}>{reais(area.economia)}</td>
                <td><span className={`sjBadge ${area.nivel || ""}`}>{area.status || "—"}</span></td>
                <td>🔒</td>
              </tr>
            )) : (
              <tr><td colSpan={6}>Ainda sem consolidado da diretoria no banco.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="sjNota">
        <b>Metodologia:</b> custos externos à área permanecem ancorados na média histórica e, quando pertinente, escalam por faturamento. Custos realmente fixos permanecem fixos; custos percentuais acompanham receita; custos semi-fixos usam uma referência saudável por faixa de faturamento. O objetivo é medir o efeito controlável de cada gestor sem atribuir a ele despesas que não controla. <b>Bônus projetado</b> só aparece para quem tem acesso de administrador no BI — ele depende de salário-base, que é dado sensível.
      </p>
    </section>
  );
}
