"use client";

import { useEffect, useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Tabela } from "../financeiro/ui";
import { WEEKDAY_LABEL, monthKeyLabel, parseBRL, todayStr } from "../financeiro/comum";
import {
  EMPLOYEE_NUM_FIELDS, FREELANCER_SECTORS, FREELANCER_SECTOR_LABEL, FUNCAO_CARGO_OPTIONS, ROTULO_NUMERICO, TIPO_DESLIGAMENTO_OPTIONS,
  type CampoNumerico, type Employee, type FichaMes, type HorarioDia,
} from "./rhTipos";
import { SINTHORESP_PISO_NORMAL_2026, calcInss2026, calcIrrf2026, feriasAtivas } from "./rhCalc";

type Numeros = Record<CampoNumerico, string>;
type StatusSel = "1" | "f" | "0";

const AJUDA_NUM: Partial<Record<CampoNumerico, string>> = { fgts: "8% do salário (auto)", inss: "Tabela federal 2026 (auto)", irrf: "Tabela federal 2026, sem dependentes (auto)", valorTotal: "Soma automática de todos os campos acima" };
const AJUDA_SALARIO_PADRAO = "FGTS, INSS e IRRF calculam sozinhos a partir daqui (edite se precisar ajustar).";

function numerosDe(e: Partial<Employee>): Numeros {
  const saida = {} as Numeros;
  EMPLOYEE_NUM_FIELDS.forEach((f) => { saida[f] = String(e[f] ?? 0); });
  return saida;
}
function statusDe(e: Partial<Employee>, hoje: string): StatusSel {
  return e.ativo ? (feriasAtivas(e, hoje) ? "f" : "1") : "0";
}
function horarioPadrao(): HorarioDia[] {
  return [0, 1, 2, 3, 4, 5, 6].map(() => ({ trabalha: false, entrada: "", saida: "", almoco: "", jantar: "" }));
}

/** Formulário "Novo colaborador / Editar" do painel do Renato (openEmployeeForm / saveEmployeeForm). */
export function RhColaboradorForm({
  ficha,
  mesInicial,
  snaps,
  mesFechado,
  onFechar,
  onSalvo,
}: {
  ficha: Employee;
  mesInicial: string;
  snaps: Record<string, FichaMes>;
  mesFechado: (mk: string) => boolean;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const hoje = todayStr();
  const [nome, setNome] = useState(ficha.nome);
  const [cargo, setCargo] = useState(ficha.cargo || "outro");
  const [cargoOutro, setCargoOutro] = useState(ficha.cargoOutro);
  const [funcao, setFuncao] = useState(ficha.funcaoCargo || "");
  const [nivel, setNivel] = useState(ficha.nivel || "pleno");
  const [contratacao, setContratacao] = useState(ficha.contratacao || "CLT");
  const [statusSel, setStatusSel] = useState<StatusSel>(statusDe(ficha, hoje));
  const [mesRef, setMesRef] = useState(mesInicial || String(ficha.mesReferencia || hoje).slice(0, 7));
  const [mesInfo, setMesInfo] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState(ficha.dataAdmissao);
  const [dataDesligamento, setDataDesligamento] = useState(ficha.dataDesligamento);
  const [tipoDesligamento, setTipoDesligamento] = useState(ficha.tipoDesligamento);
  const [valorRescisao, setValorRescisao] = useState(String(ficha.valorRescisao || 0));
  const [obs, setObs] = useState(ficha.desligamentoObs);
  const [numeros, setNumeros] = useState<Numeros>(numerosDe(ficha));
  const [horario, setHorario] = useState<HorarioDia[]>(ficha.horarioSemanal?.length === 7 ? ficha.horarioSemanal : horarioPadrao());
  const [feriasInicio, setFeriasInicio] = useState(ficha.feriasInicio);
  const [feriasFim, setFeriasFim] = useState(ficha.feriasFim);
  const [status, setStatus] = useState("");
  const [salvando, setSalvando] = useState(false);
  const travado = mesFechado(mesRef);

  const total = EMPLOYEE_NUM_FIELDS.filter((f) => f !== "valorTotal").reduce((s, f) => s + parseBRL(numeros[f]), 0);
  const salario = parseBRL(numeros.salario);
  const ajudaSalario = !salario
    ? AJUDA_SALARIO_PADRAO
    : salario < SINTHORESP_PISO_NORMAL_2026
      ? `⚠ Abaixo do piso normal SINTHORESP 2026 (R$ ${SINTHORESP_PISO_NORMAL_2026.toFixed(2)}) — confira se cabe piso especial/diferenciado.`
      : "FGTS, INSS e IRRF calculados pela tabela federal 2026 — confira com o contador antes de fechar a folha.";

  // efCarregarMes: trocar o mês da ficha carrega a foto daquele mês (ou zera, quando ainda não existe)
  useEffect(() => {
    if (!ficha.id) {
      setMesInfo(`Novo colaborador: a ficha será criada em ${monthKeyLabel(mesRef)}.`);
      return;
    }
    const snap = snaps[ficha.id];
    const usaSnap = Boolean(snap) && mesRef === mesInicial;
    const ehAtual = String(ficha.mesReferencia || "").slice(0, 7) === mesRef;
    const fonte: Partial<Employee> | null = usaSnap ? { ...ficha, ...snap } : ehAtual ? ficha : null;
    let origem: string;
    if (fonte) {
      setNumeros(numerosDe(fonte));
      if (fonte.cargo) setCargo(fonte.cargo);
      setCargoOutro(fonte.cargoOutro || "");
      setFuncao(fonte.funcaoCargo || "");
      if (fonte.nivel) setNivel(fonte.nivel);
      if (fonte.contratacao) setContratacao(fonte.contratacao);
      setStatusSel(statusDe(fonte, hoje));
      origem = usaSnap ? `Ficha de ${monthKeyLabel(mesRef)} (histórico do mês).` : `Ficha atual — mês de referência ${monthKeyLabel(mesRef)}.`;
    } else {
      setNumeros(numerosDe({}));
      origem = `Sem cópia da ficha de ${monthKeyLabel(mesRef)} no banco — valores zerados; ao salvar, grava a ficha deste mês.`;
    }
    setMesInfo(`${origem}${mesFechado(mesRef) ? " 🔒 Mês fechado — só o diretor consegue salvar." : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesRef]);

  function mudarNumero(campo: CampoNumerico, valor: string) {
    setNumeros((atual) => ({ ...atual, [campo]: valor }));
  }
  function mudarSalario(valor: string) {
    const s = parseBRL(valor);
    if (s) {
      const inss = calcInss2026(s);
      const irrf = calcIrrf2026(Math.max(0, s - inss));
      setNumeros((atual) => ({ ...atual, salario: valor, fgts: (s * 0.08).toFixed(2), inss: inss.toFixed(2), irrf: irrf.toFixed(2) }));
    } else {
      setNumeros((atual) => ({ ...atual, salario: valor }));
    }
  }
  function aplicarFuncao(v: string) {
    setFuncao(v);
    const opt = FUNCAO_CARGO_OPTIONS.find((o) => o.value === v);
    if (!opt) return;
    if (opt.setor) setCargo(opt.setor);
    else {
      setCargo("outro");
      setCargoOutro(opt.label);
    }
  }
  function mudarStatus(v: StatusSel) {
    setStatusSel(v);
    if (v === "f") {
      if (!feriasInicio) setFeriasInicio(hoje);
      setStatus("Informe o último dia das férias (fim do período).");
    }
  }
  function mudarHorario(i: number, campo: keyof HorarioDia, valor: string | boolean) {
    setHorario((atual) => atual.map((d, j) => (j === i ? { ...d, [campo]: valor } : d)));
  }

  async function salvar() {
    if (!nome.trim()) {
      setStatus("Digite o nome.");
      return;
    }
    const payload: Record<string, unknown> = {
      id: ficha.id || undefined,
      nome: nome.trim(),
      cargo: cargo || "outro",
      cargoOutro: cargoOutro.trim(),
      funcaoCargo: funcao,
      nivel: nivel || "pleno",
      contratacao: contratacao || "CLT",
      mesReferencia: mesRef,
      ativo: statusSel === "1" || statusSel === "f",
      horarioSemanal: horario,
      feriasInicio,
      feriasFim,
      dataAdmissao,
      dataDesligamento,
      tipoDesligamento,
      desligamentoObs: obs.trim(),
      valorRescisao: parseBRL(valorRescisao),
    };
    EMPLOYEE_NUM_FIELDS.forEach((f) => { payload[f] = f === "valorTotal" ? total : parseBRL(numeros[f]); });
    if (statusSel === "f") {
      if (!feriasInicio || !feriasFim) {
        setStatus("Status Férias: informe o início e o fim do período de férias.");
        return;
      }
      if (feriasFim < feriasInicio) {
        setStatus("O fim das férias é antes do início.");
        return;
      }
    } else if (statusSel === "1" && feriasAtivas({ feriasInicio, feriasFim }, hoje)) {
      payload.feriasInicio = "";
      payload.feriasFim = "";
    }
    setSalvando(true);
    setStatus("Salvando…");
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/rh/colaborador", payload);
    setSalvando(false);
    if (r.ok) {
      setStatus("Colaborador salvo.");
      onSalvo();
      onFechar();
    } else {
      setStatus(r.json?.error === "month_closed" ? "🔒 Mês fechado — peça pro diretor reabrir." : `Falha ao salvar${r.json?.error ? ` (${r.json.error})` : ""}.`);
    }
  }

  const acoes = (
    <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="sjBtn sjBtnAccent" disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar"}</button>
      <button type="button" className="sjBtn sjBtnR" onClick={onFechar}>Cancelar</button>
      <span className="sjMini">{status}</span>
    </div>
  );

  return (
    <section className="sjCard sjBloco">
      <h3>{ficha.id ? `Editar: ${ficha.nome || "colaborador"}` : "Novo colaborador"}</h3>
      <div className="sjEfGrade">
        <div className="sjEfCampo largo">
          <b>Nome</b>
          <div className="sjCampoInline">
            <input className="sjInput" type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
            <label className="sjMini" htmlFor="efMesSel">Mês da ficha</label>
            <input id="efMesSel" className="sjInput" type="month" style={{ flex: "0 0 160px" }} value={mesRef} onChange={(e) => e.target.value && setMesRef(e.target.value.slice(0, 7))} title="Escolha o mês pra ver a ficha daquele fechamento" />
          </div>
          <span className="sjCampoAjuda">{mesInfo}</span>
        </div>
        <div className="sjEfCampo"><b>Cargo</b>
          <select className="sjInput" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            {FREELANCER_SECTORS.map((s) => <option key={s} value={s}>{FREELANCER_SECTOR_LABEL[s]}</option>)}
            <option value="outro">Outro</option>
          </select>
        </div>
        {cargo === "outro" ? (
          <div className="sjEfCampo"><b>Qual cargo (se &quot;Outro&quot;)</b><input className="sjInput" type="text" placeholder="ex.: Manutenção, Marketing" value={cargoOutro} onChange={(e) => setCargoOutro(e.target.value)} /></div>
        ) : null}
        <div className="sjEfCampo"><b>Função específica</b>
          <select className="sjInput" value={funcao} onChange={(e) => aplicarFuncao(e.target.value)}>
            <option value="">— nenhuma —</option>
            {FUNCAO_CARGO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="sjCampoAjuda">Opcional — só rótulo, não muda a contagem do setor acima.</span>
        </div>
        <div className="sjEfCampo"><b>Nível</b>
          <select className="sjInput" value={nivel} onChange={(e) => setNivel(e.target.value)}><option value="junior">Júnior</option><option value="pleno">Pleno</option><option value="senior">Sênior</option></select>
        </div>
        <div className="sjEfCampo"><b>Contratação</b>
          <select className="sjInput" value={contratacao} onChange={(e) => setContratacao(e.target.value)}><option value="CLT">CLT</option><option value="INT">INT</option><option value="PJ">PJ</option></select>
        </div>
        <div className="sjEfCampo"><b>Status</b>
          <select className="sjInput" value={statusSel} onChange={(e) => mudarStatus(e.target.value as StatusSel)}><option value="1">Ativo</option><option value="f">Férias</option><option value="0">Inativo</option></select>
        </div>
        <div className="sjEfCampo"><b>Mês de referência</b><input className="sjInput" type="month" value={mesRef} onChange={(e) => e.target.value && setMesRef(e.target.value.slice(0, 7))} /></div>
      </div>
      <hr className="sjSep" />
      <div className="sjSecao">Admissão e desligamento</div>
      <div className="sjEfGrade">
        <div className="sjEfCampo"><b>Data de admissão</b><input className="sjInput" type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} /></div>
        <div className="sjEfCampo"><b>Data de desligamento</b><input className="sjInput" type="date" value={dataDesligamento} onChange={(e) => setDataDesligamento(e.target.value)} /></div>
        <div className="sjEfCampo"><b>Tipo de desligamento</b>
          <select className="sjInput" value={tipoDesligamento} onChange={(e) => setTipoDesligamento(e.target.value)}>
            {TIPO_DESLIGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sjEfCampo"><b>Valor de rescisão</b><input className="sjInput" type="text" inputMode="decimal" placeholder="0,00" value={valorRescisao} onChange={(e) => setValorRescisao(e.target.value)} /></div>
        <div className="sjEfCampo largo"><b>Observação</b><textarea className="sjInput" rows={2} placeholder="Motivo, detalhes, o que ficou combinado..." value={obs} onChange={(e) => setObs(e.target.value)} /></div>
        <div className="sjEfCampo largo">
          <b>Documentos</b>
          <span className="sjCampoAjuda">Rescisão, exame demissional, aviso prévio, acordo assinado, etc.</span>
          <Tabela colunas={["Arquivo", "Enviado por", "Quando", ""]} linhas={[]} vazio={ficha.id ? "Anexar e listar arquivos ainda não está ligado ao espelho — continua no painel do Seu Justino." : "Salve o colaborador primeiro pra poder anexar arquivo."} />
        </div>
      </div>
      <hr className="sjSep" />
      <div className="sjEfGrade">
        {EMPLOYEE_NUM_FIELDS.map((f) => (
          <div key={f} className="sjEfCampo">
            <b>{ROTULO_NUMERICO[f]}</b>
            {f === "valorTotal"
              ? <input className="sjInput sjInputRo" type="number" step="0.01" readOnly value={total.toFixed(2)} />
              : <input className="sjInput" type="text" inputMode="decimal" value={numeros[f]} onChange={(e) => (f === "salario" ? mudarSalario(e.target.value) : mudarNumero(f, e.target.value))} />}
            {f === "salario" ? <span className="sjCampoAjuda">{ajudaSalario}</span> : AJUDA_NUM[f] ? <span className="sjCampoAjuda">{AJUDA_NUM[f]}</span> : null}
          </div>
        ))}
      </div>
      {acoes}
      <hr className="sjSep" />
      <div className="sjSecao">Horário padrão da semana <span className="sjMini">— base pra escala sugerida completa (Gerente Operador)</span></div>
      <p className="sjMini">A sugestão pelo mapa de calor (✨) usa a venda por horário da ZigPay e fica na aba Gerente Operador; aqui o horário é preenchido à mão.</p>
      <Tabela
        colunas={["Dia", "Trabalha", "Entrada", "Saída", "Pausa almoço", "Pausa jantar"]}
        linhas={horario.map((d, i) => ({
          key: String(i),
          cels: [
            WEEKDAY_LABEL[i],
            <input key="t" type="checkbox" className="sjCheck" checked={d.trabalha} onChange={(e) => mudarHorario(i, "trabalha", e.target.checked)} />,
            <input key="e" className="sjInput" type="time" style={{ minWidth: 110 }} value={d.entrada} onChange={(e) => mudarHorario(i, "entrada", e.target.value)} />,
            <input key="s" className="sjInput" type="time" style={{ minWidth: 110 }} value={d.saida} onChange={(e) => mudarHorario(i, "saida", e.target.value)} />,
            <input key="a" className="sjInput" type="text" style={{ minWidth: 110 }} placeholder="12:00-13:00" value={d.almoco} onChange={(e) => mudarHorario(i, "almoco", e.target.value)} />,
            <input key="j" className="sjInput" type="text" style={{ minWidth: 110 }} placeholder="19:00-19:30" value={d.jantar} onChange={(e) => mudarHorario(i, "jantar", e.target.value)} />,
          ],
        }))}
      />
      <div className="sjEfGrade">
        <div className="sjEfCampo largo">
          <b>Período de férias (se aplicável)</b>
          <div className="sjCampoInline">
            <input className="sjInput" type="date" title="Início das férias" value={feriasInicio} onChange={(e) => setFeriasInicio(e.target.value)} />
            <input className="sjInput" type="date" title="Fim das férias" value={feriasFim} onChange={(e) => setFeriasFim(e.target.value)} />
          </div>
          <span className="sjCampoAjuda">Deixe em branco se não tiver férias marcadas agora.</span>
        </div>
      </div>
      {travado ? <p className="sjAviso">🔒 Mês fechado — a planilha só aceita a gravação do diretor.</p> : null}
      {acoes}
    </section>
  );
}
