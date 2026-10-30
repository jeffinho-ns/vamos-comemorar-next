"use client";

import { useMemo, useState, type ReactNode } from "react";
import { chamarBi } from "../usePlanilha";
import { Badge, Cabecalho } from "../financeiro/ui";
import { brl, monthKeyLabel, todayStr } from "../financeiro/comum";
import { COLAB_SETOR_LABEL, NIVEL_LABEL, type Employee, type FichaMes } from "./rhTipos";
import { employeeCargoLabel, employeesOrdenadosPorSetor, feriasAtivas, type Visao } from "./rhCalc";

type Filtro = "ativos" | "ferias" | "inativos" | "todos";

function pl(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

function badgeStatus(v: Visao, hoje: string) {
  if (v.fonte === "sem") return <Badge nivel="y" title="Sem ficha gravada neste mês">sem ficha</Badge>;
  if (v.e.ativo && v.fonte !== "historico" && feriasAtivas(v.e, hoje)) return <Badge nivel="y">férias</Badge>;
  return v.e.ativo ? <Badge nivel="g">ativo</Badge> : <Badge nivel="r">inativo</Badge>;
}

/** "Colaboradores" (renderEmployeesTable, empCarregarMes): filtro por mês de referência e status, agrupado por setor. */
export function RhColaboradores({
  employees,
  mesFiltro,
  onMesFiltro,
  snaps,
  mesFechado,
  temCopiaDoMes,
  onAtualizar,
  onEditar,
  onNovo,
  onSalvo,
}: {
  employees: Employee[];
  mesFiltro: string;
  onMesFiltro: (mk: string) => void;
  snaps: Record<string, FichaMes>;
  mesFechado: boolean;
  temCopiaDoMes: boolean;
  onAtualizar: () => void;
  onEditar: (e: Employee) => void;
  onNovo: () => void;
  onSalvo: () => void;
}) {
  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [status, setStatus] = useState("");
  const hoje = todayStr();
  const ordenados = useMemo(() => employeesOrdenadosPorSetor(employees, mesFiltro, snaps), [employees, mesFiltro, snaps]);
  const passa = (e: Employee) => filtro === "todos" || (filtro === "inativos" ? !e.ativo : filtro === "ferias" ? (e.ativo && feriasAtivas(e, hoje)) : !!e.ativo);
  const visiveis = ordenados.filter((o) => passa(o.e));

  async function apagar(e: Employee) {
    if (!window.confirm(`Apagar o colaborador ${e.nome || "sem nome"}? Essa ação não tem volta.`)) return;
    setStatus("Apagando…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/rh/colaborador/apagar", { id: e.id });
    setStatus(r.ok ? "Colaborador apagado." : "Não consegui apagar.");
    if (r.ok) onSalvo();
  }

  const resumo: Record<string, { n: number; ativos: number; total: number }> = {};
  visiveis.forEach((o) => {
    const r = resumo[o.setor] || (resumo[o.setor] = { n: 0, ativos: 0, total: 0 });
    r.n += 1;
    if (o.e.ativo) {
      r.ativos += 1;
      r.total += Number(o.e.valorTotal) || 0;
    }
  });
  const somaExib = visiveis.reduce((t, o) => t + (Number(o.e.valorTotal) || 0), 0);
  const nTodos = employees.length;
  const nAtivos = employees.filter((e) => e.ativo).length;
  const nInativos = nTodos - nAtivos;
  let rotulo = "";
  let nota: string | null = null;
  if (filtro === "inativos") {
    rotulo = `Total (${pl(visiveis.length, "inativo", "inativos")})`;
    nota = "— fora da folha ativa";
  } else if (filtro === "ferias") {
    rotulo = `Total (${pl(visiveis.length, "colaborador em férias", "colaboradores em férias")})`;
    nota = "— contam na folha ativa";
  } else if (filtro === "todos") {
    const somaAtivos = employees.filter((e) => e.ativo).reduce((t, e) => t + (Number(e.valorTotal) || 0), 0);
    rotulo = `Total (${pl(nTodos, "colaborador", "colaboradores")})`;
    nota = `— ${nAtivos} ativo${nAtivos === 1 ? "" : "s"} (folha ativa ${brl(somaAtivos)}) e ${pl(nInativos, "inativo", "inativos")}`;
  } else {
    rotulo = `Total (${pl(visiveis.length, "ativo", "ativos")})`;
    nota = nInativos ? `— ${pl(nInativos, "inativo escondido", "inativos escondidos")} (veja o filtro Inativos)` : null;
  }

  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo="Colaboradores">
        <label className="sjMini" htmlFor="empMesFiltro">Mês de referência</label>
        <input id="empMesFiltro" className="sjInput" type="month" style={{ minWidth: 150, width: "auto" }} value={mesFiltro} onChange={(e) => onMesFiltro(e.target.value.slice(0, 7))} title="Vazio = fichas atuais. Escolha um mês pra ler os dados daquele fechamento." />
        <button type="button" className="sjBtn sjBtnP" onClick={() => onMesFiltro("")} title="Voltar às fichas atuais">Atual</button>
        <label className="sjMini" htmlFor="empStatusFilter">Status</label>
        <select id="empStatusFilter" className="sjInput" style={{ minWidth: 170, width: "auto" }} value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
          <option value="ativos">Ativos (inclui férias)</option>
          <option value="ferias">Em férias</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
      </Cabecalho>
      <p className="sjNote">Cadastro de folha — o cargo (quando for um dos 9 setores rastreados) e &quot;Ativo&quot; + &quot;CLT&quot; alimentam o Quadro mínimo por setor acima, sozinho. Cargos fora da lista (Manutenção, Marketing, etc.) usam &quot;Outro&quot;.</p>
      <div className="sjTabela">
        <table>
          <thead><tr><th>Colaborador</th><th>Cargo</th><th>Nível</th><th>Contratação</th><th>Valor Total</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            {mesFiltro ? (
              <tr className="sjFaixaInfo"><td colSpan={7} className="sjMini">📅 Lendo as fichas de <b>{monthKeyLabel(mesFiltro)}</b> (somente leitura aqui; use Editar pra alterar){mesFechado ? <> • <b style={{ color: "var(--yellow)" }}>🔒 mês fechado</b></> : null}. Colaborador sem ficha gravada nesse mês aparece como &quot;sem ficha&quot;.{temCopiaDoMes ? "" : " As fotos desse mês ainda não foram copiadas no banco — mostrando a ficha atual quando o mês de referência bate."}</td></tr>
            ) : null}
            {!employees.length ? <tr><td colSpan={7} className="sjMini">Nenhum colaborador cadastrado ainda.</td></tr> : null}
            {employees.length && !visiveis.length ? <tr><td colSpan={7} className="sjMini">Nenhum colaborador neste filtro.</td></tr> : null}
            {visiveis.map((o, i) => {
              const cab = i === 0 || visiveis[i - 1].setor !== o.setor;
              const r = resumo[o.setor];
              const lider = o.rank <= 2 && o.e.funcaoCargo ? <Badge nivel="p">liderança</Badge> : null;
              return (
                <FragmentoLinha key={`${o.e.id || o.idx}`}
                  cabecalho={cab ? <tr className="sjCabSetor"><td colSpan={7}>{COLAB_SETOR_LABEL[o.setor]} <span className="sjMini">• {r.n} colaborador{r.n === 1 ? "" : "es"} ({r.ativos} ativo{r.ativos === 1 ? "" : "s"}) • folha ativa {brl(r.total)}</span></td></tr> : null}
                >
                  <td>{o.e.nome} {lider}</td>
                  <td>{employeeCargoLabel(o.e)}</td>
                  <td>{NIVEL_LABEL[o.e.nivel] || "Pleno"}</td>
                  <td>{o.e.contratacao}</td>
                  <td>{o.fonte === "sem" ? <span className="sjMini">—</span> : brl(o.e.valorTotal)}</td>
                  <td>{badgeStatus(o, hoje)}</td>
                  <td className="sjSticky">
                    <button type="button" className="sjBtn sjBtnP" onClick={() => onEditar(employees[o.idx])}>Editar</button>{" "}
                    <button type="button" className="sjBtn sjBtnP sjBtnR" onClick={() => apagar(employees[o.idx])}>Apagar</button>
                  </td>
                </FragmentoLinha>
              );
            })}
            {visiveis.length ? (
              <tr className="sjTotalLinha"><td colSpan={4}>{rotulo} {nota ? <span className="sjMini" style={{ fontWeight: 400 }}>{nota}</span> : null}</td><td>{brl(somaExib)}</td><td /><td /></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" className="sjBtn" onClick={onNovo}>+ Adicionar colaborador</button>
        <span className="sjMini">{status}</span>
      </div>
    </section>
  );
}

function FragmentoLinha({ cabecalho, children }: { cabecalho: ReactNode; children: ReactNode }) {
  return (
    <>
      {cabecalho}
      <tr>{children}</tr>
    </>
  );
}
