"use client";

import type { MkAtual } from "./espelhoDados";

export type Plano = {
  data: string;
  trafego: number;
  outros: number;
  atracoes: number;
  publico: number;
  ticket: number;
  receita: number;
  nota: string;
};

const SEMANA = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

/** Mesmo `brl` do painel do Renato. */
function brl(valor: number) {
  return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/** Mesmo `fmtDate` do painel do Renato (`s+'T12:00:00'`). */
function fmtDate(iso: string) {
  if (!iso) return "—";
  const [, mes, dia] = iso.split("-");
  const nome = SEMANA[new Date(`${iso}T12:00:00`).getDay()] || "";
  return `${nome} ${dia}/${mes}/${iso.slice(0, 4)}`;
}

export type LinhaComparada = ReturnType<typeof comparar>[number];

function soma(linhas: LinhaComparada[], chave: "fatPlan" | "fatReal" | "diffFat" | "gastoPlan" | "gastoReal" | "diffGasto") {
  return linhas.reduce((total, linha) => total + (linha[chave] ?? 0), 0);
}

function classeDelta(valor: number | null) {
  if (valor == null || valor === 0) return "";
  return valor > 0 ? "sjMkUp" : "sjMkDown";
}

/**
 * renderMkPlanTable do painel do Renato: datas com projeção ou envio; dia futuro não é
 * "realizado zerado", é "ainda sem dado" (decidido pela data, não pela existência do registro).
 */
export function comparar(planos: Plano[], mkAtual: Record<string, MkAtual>, hoje: string) {
  const porPlano = new Map(planos.map((plano) => [plano.data, plano]));
  const datas = new Set<string>([...porPlano.keys(), ...Object.keys(mkAtual)]);
  return [...datas].sort((a, b) => b.localeCompare(a)).slice(0, 60).map((dia) => {
    const plano = porPlano.get(dia);
    const fatPlan = plano ? plano.receita : null;
    const gastoPlan = plano ? plano.trafego + plano.outros + plano.atracoes : null;
    const atual = dia <= hoje ? mkAtual[dia] : undefined;
    const fatReal = atual ? atual.revenue : null;
    const gastoReal = atual ? atual.spend : null;
    return {
      data: dia,
      temPlano: Boolean(plano),
      fatPlan,
      fatReal,
      diffFat: fatPlan != null && fatReal != null ? fatReal - fatPlan : null,
      gastoPlan,
      gastoReal,
      diffGasto: gastoPlan != null && gastoReal != null ? gastoPlan - gastoReal : null,
    };
  });
}

/** Tabela "Projetado × Realizado" da projeção de gastos (renderMkPlanTable), com seleção em lote. */
export function ProjetadoRealizado({
  linhas,
  totalPlanos,
  marcadas,
  ocupado,
  statusLote,
  onAtualizar,
  onApagar,
  onApagarSelecionadas,
  onMarcar,
  onMarcarTodas,
}: {
  linhas: LinhaComparada[];
  totalPlanos: number;
  marcadas: string[];
  ocupado: boolean;
  statusLote: string;
  onAtualizar: () => void;
  onApagar: (dia: string) => void;
  onApagarSelecionadas: () => void;
  onMarcar: (dia: string, ligado: boolean) => void;
  onMarcarTodas: (ligado: boolean) => void;
}) {
  return (
      <details className="sjCollapse" open>
        <summary><span className="sjChev">▸</span>Projetado × Realizado<span className="sjHint">clique para abrir</span></summary>
        <section className="sjCard sjBloco sjCollapseBody">
          <div className="sjRole">
            <h3>Projetado × Realizado</h3>
            <span>
              <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onAtualizar}>🔄 Atualizar</button>{" "}
              <button type="button" className="sjAnaliseBtn sjMkGrafBtn" style={{ background: "#3a1620" }} disabled={ocupado} onClick={onApagarSelecionadas}>🗑 Apagar selecionados</button>{" "}
              <span className="sjMini" role="status">{statusLote}</span>
            </span>
          </div>
          <div className="sjTableInner sjMkCmp">
            <table>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Faturamento projetado</th>
                  <th scope="col">Faturamento realizado</th>
                  <th scope="col">Diferença (faturamento)</th>
                  <th scope="col">Gasto projetado</th>
                  <th scope="col">Gasto realizado</th>
                  <th scope="col">Diferença (gasto)</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ação</th>
                  <th scope="col"><input type="checkbox" title="Selecionar todos" checked={totalPlanos > 0 && marcadas.length === totalPlanos} onChange={(evento) => onMarcarTodas(evento.target.checked)} /></th>
                </tr>
              </thead>
              <tbody>
                {linhas.length ? linhas.map((linha) => (
                  <tr key={linha.data}>
                    <td>{fmtDate(linha.data)}</td>
                    <td>{linha.fatPlan == null ? "—" : brl(linha.fatPlan)}</td>
                    <td>{linha.fatReal == null ? "—" : brl(linha.fatReal)}</td>
                    <td className={classeDelta(linha.diffFat)}>{linha.diffFat == null ? "—" : brl(linha.diffFat)}</td>
                    <td>{linha.gastoPlan == null ? "—" : brl(linha.gastoPlan)}</td>
                    <td>{linha.gastoReal == null ? "—" : brl(linha.gastoReal)}</td>
                    <td className={classeDelta(linha.diffGasto)}>{linha.diffGasto == null ? "—" : brl(linha.diffGasto)}</td>
                    <td>{linha.diffGasto == null ? "—" : linha.diffGasto >= 0 ? <span className="sjBadge g">DENTRO DO PLANO</span> : <span className="sjBadge r">ACIMA DO PLANO</span>}</td>
                    <td>{linha.temPlano ? <button type="button" className="sjAnaliseBtn sjMkGrafBtn" style={{ background: "#3a1620" }} disabled={ocupado} onClick={() => onApagar(linha.data)}>Apagar</button> : "—"}</td>
                    <td>
                      <input
                        type="checkbox"
                        disabled={!linha.temPlano}
                        title={linha.temPlano ? undefined : "Sem projeção lançada — nada a selecionar"}
                        checked={marcadas.includes(linha.data)}
                        onChange={(evento) => onMarcar(linha.data, evento.target.checked)}
                      />
                    </td>
                  </tr>
                )) : <tr><td colSpan={10}>Sem projeção nem envio ainda.</td></tr>}
                {linhas.length ? (
                  <tr className="sjMkTotal">
                    <td>Total ({linhas.length} dia(s))</td>
                    <td>{brl(soma(linhas, "fatPlan"))}</td>
                    <td>{brl(soma(linhas, "fatReal"))}</td>
                    <td className={classeDelta(soma(linhas, "diffFat"))}>{brl(soma(linhas, "diffFat"))}</td>
                    <td>{brl(soma(linhas, "gastoPlan"))}</td>
                    <td>{brl(soma(linhas, "gastoReal"))}</td>
                    <td className={classeDelta(soma(linhas, "diffGasto"))}>{brl(soma(linhas, "diffGasto"))}</td>
                    <td /><td /><td />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </details>
  );
}
