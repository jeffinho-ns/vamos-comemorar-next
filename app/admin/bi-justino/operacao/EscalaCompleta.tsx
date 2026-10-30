"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { corCalor, quadroDoDia } from "../quadroEscalaDia";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { ZigAoVivo } from "../zigValor";
import { mensagemErro, postArea } from "./apiArea";
import { Badge, BotaoAcao } from "./Cartao";
import { hojeSp } from "./formato";
import type { PedidoFreelancer } from "./freelancerTipos";

interface MarcaDb { employeeId: string; date: string; status: string; observacao: string }
type Presenca = { status: "" | "compareceu" | "faltou"; obs: string; editando: boolean };
type EdicaoFl = { names: string; horaEntrada: string; horaSaida: string; horaPausa: string };

function marcasDe(dados: DadosPlanilha): MarcaDb[] {
  return payloadDe<{ items?: MarcaDb[] }>(dados, "getDailyAttendance")?.items ?? [];
}

function lerMarca(id: string, date: string, marcas: MarcaDb[], local: Record<string, Presenca>): Presenca {
  const localM = local[id];
  if (localM) return localM;
  const db = marcas.find((m) => m.employeeId === id && m.date === date);
  const status = db?.status === "compareceu" || db?.status === "faltou" ? db.status : "";
  return { status, obs: db?.observacao || "", editando: false };
}

/** "Visualização da Escala Completa do dia" — persiste presença (setDailyAttendance) e ações de freelancer. */
export function EscalaCompleta({
  zig, dados, pedidos, recarregar, aoSalvar,
}: {
  zig: ZigAoVivo | null;
  dados: DadosPlanilha;
  pedidos: PedidoFreelancer[];
  recarregar: () => void;
  aoSalvar: () => void;
}) {
  const hoje = hojeSp();
  const [data, setData] = useState(hoje);
  const [presenca, setPresenca] = useState<Record<string, Presenca>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<Record<string, EdicaoFl>>({});
  const [status, setStatus] = useState("");
  const splitTentado = useRef<Set<string>>(new Set());
  const pedidosRef = useRef(pedidos);
  pedidosRef.current = pedidos;
  const quadro = useMemo(() => quadroDoDia(zig, data, hoje), [zig, data, hoje]);
  const marcas = useMemo(() => marcasDe(dados), [dados]);
  const temCadastro = (zig?.colaboradores || []).length > 0;
  const flDoDia = pedidos.filter((p) => p.date === data && p.status !== "recusado");
  const agrupadosKey = flDoDia.filter((p) => Number(p.qty) > 1).map((p) => p.id).join(",");

  useEffect(() => {
    const agrupados = pedidosRef.current.filter((p) => p.date === data && p.status !== "recusado" && Number(p.qty) > 1);
    const novos = agrupados.filter((p) => !splitTentado.current.has(p.id));
    if (!novos.length) return;
    novos.forEach((p) => splitTentado.current.add(p.id));
    let vivo = true;
    (async () => {
      setStatus(`Separando ${novos.length} pedido(s) em um freelancer por linha…`);
      let ok = 0;
      for (const p of novos) {
        const r = await postArea("/justino/operacao/freelancers/separar", { id: p.id });
        if (r.ok) ok += 1;
      }
      if (!vivo) return;
      setStatus(ok ? `${ok} pedido(s) separado(s).` : "Não consegui separar os pedidos agrupados. Tente de novo.");
      if (ok) recarregar();
    })();
    return () => { vivo = false; };
  }, [agrupadosKey, data, recarregar]);

  function gravarLocal(id: string, proximo: Presenca) {
    setPresenca((atual) => ({ ...atual, [id]: proximo }));
  }

  async function marcarClt(id: string, statusNovo: "compareceu" | "faltou") {
    if (statusNovo === "faltou" && !window.confirm("Confirmar que faltou hoje? Isso tira a presença dele da conta de cobertura do setor.")) return;
    const r = await postArea("/justino/operacao/presenca-diaria", { employeeId: id, date: data, status: statusNovo });
    if (r.ok) {
      gravarLocal(id, { ...lerMarca(id, data, marcas, presenca), status: statusNovo, editando: false });
      aoSalvar(); recarregar();
    } else setStatus(mensagemErro(r.error, "Não consegui registrar a presença."));
  }

  async function salvarObs(id: string) {
    const marca = lerMarca(id, data, marcas, presenca);
    const r = await postArea("/justino/operacao/presenca-diaria", { employeeId: id, date: data, observacao: marca.obs });
    if (r.ok) {
      gravarLocal(id, { ...marca, editando: false });
      aoSalvar(); recarregar();
    } else setStatus(mensagemErro(r.error, "Não consegui salvar a observação."));
  }

  async function presencaFl(id: string, attended: boolean) {
    if (!window.confirm(attended ? "Confirmar que o freelancer compareceu?" : "Confirmar que o freelancer FALTOU? Isso tira o custo dele da conta.")) return;
    const r = await postArea("/justino/operacao/freelancers/presenca", { id, attended });
    if (r.ok) { aoSalvar(); recarregar(); } else setStatus(mensagemErro(r.error, "Não consegui registrar a presença."));
  }

  async function salvarNomes(id: string) {
    const ed = editando[id];
    if (!ed) return;
    const r = await postArea("/justino/operacao/freelancers/nomes", { id, names: ed.names, horaEntrada: ed.horaEntrada, horaSaida: ed.horaSaida, horaPausa: ed.horaPausa });
    if (r.ok) {
      setEditando((a) => { const n = { ...a }; delete n[id]; return n; });
      aoSalvar(); recarregar();
    } else setStatus(mensagemErro(r.error, "Não consegui salvar o nome/horário."));
  }

  async function apagarFl(id: string, confirmar = true) {
    if (confirmar && !window.confirm("Cancelar esta solicitação de freelancer? Essa ação não tem volta (fica registrada no histórico de exclusões da Diretoria).")) return false;
    const r = await postArea("/justino/operacao/freelancers/apagar", { id });
    if (!r.ok) setStatus(mensagemErro(r.error, "Não consegui cancelar."));
    return r.ok;
  }

  async function apagarSelecionados() {
    const ids = Array.from(sel);
    if (!ids.length) { setStatus("Marque pelo menos uma solicitação de freelancer."); return; }
    if (!window.confirm(`Cancelar ${ids.length} solicitação(ões) selecionada(s)?`)) return;
    let ok = 0;
    for (const id of ids) { if (await apagarFl(id, false)) ok += 1; }
    setSel(new Set());
    setStatus(`${ok} cancelada(s)${ok < ids.length ? `, ${ids.length - ok} falhou(aram).` : "."}`);
    aoSalvar(); recarregar();
  }

  return (
    <details className="sjCollapse" open>
      <summary><span className="sjChev">▸</span>Visualização da Escala Completa do dia<span className="sjHint">clique para abrir</span></summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Escala do dia — CLT, INT, PJ e freelancers, tudo num lugar só</h3>
          <button type="button" className="sjAnaliseBtn" onClick={recarregar}>🔄 Atualizar</button>
        </div>
        <p className="sjNote">Quem está escalado hoje, em uma tabela só: CLT/INT/PJ (cadastro em RH → Colaboradores) + cada freelancer aprovado pelo RH (sugestão automática de horário calculada pra cobrir o pico de movimento do setor — cruza o cadastro com o faturamento por bloco de 30min do ZigPay). <b>Compareceu/Faltou</b> e <b>Observação</b> valem pros 4 tipos (CLT, INT, PJ e freelancer) e ficam <b>salvos</b> — dá pra conferir depois no histórico, não precisa marcar de novo toda vez que abrir a tela. Faltou de CLT tira a presença dele da conta de cobertura do setor (INT/PJ são só informativo nessa conta). Freelancer: depois que o RH aprova a quantidade, clique <b>Editar</b> pra escrever o(s) nome(s) (separe por vírgula se for mais de 1) e confirmar o horário; <b>Cancelar solicitação</b> apaga o pedido. A barrinha ao lado do horário é o calor de atendimento por horário (venda real/estimada da ZigPay, recortada no turno de cada um) — <span style={{ color: "#f76e7c" }}>vermelho</span> = horário de maior fluxo histórico, <span style={{ color: "#34d399" }}>verde</span> = menor.</p>
        <div className="sjToolbar">
          <div className="sjTb"><label>Dia<input className="sjInput" type="date" value={data} onChange={(e) => setData(e.target.value)} /></label></div>
        </div>
        {quadro.paxTexto ? <p className="sjMini" style={{ margin: "6px 0 12px" }}>{quadro.paxTexto}</p> : null}
        {quadro.estimado ? <div className="sjCalor">{quadro.nota}</div> : null}
        <div className="sjFormAcoes" style={{ justifyContent: "flex-end" }}>
          <span className="sjMini">{status}</span>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={apagarSelecionados}>🗑 Cancelar selecionados</button>
        </div>
        <div className="sjTableInner opTabela">
          <table>
            <thead>
              <tr>
                <th>Colaborador</th><th>Setor</th><th>Tipo</th><th>Horário</th><th>Presença hoje</th><th>Ação</th>
                <th><input type="checkbox" className="opCheck" title="Selecionar todos os freelancers" checked={flDoDia.length > 0 && flDoDia.every((p) => sel.has(p.id))} onChange={(e) => setSel(e.target.checked ? new Set(flDoDia.map((p) => p.id)) : new Set())} /></th>
              </tr>
            </thead>
            <tbody>
              {!temCadastro ? (
                <tr><td colSpan={7} className="sjMini">Sem acesso ao cadastro de Colaboradores (RH) pra listar aqui. Ele entra na próxima coleta da planilha.</td></tr>
              ) : quadro.linhas.length ? quadro.linhas.map((linha) => {
                const marca = lerMarca(linha.id, data, marcas, presenca);
                const pedido = pedidos.find((p) => p.id === linha.id);
                const ed = editando[linha.id];
                return (
                  <tr key={linha.id} className={linha.folga ? "sjFolga" : undefined}>
                    <td><b>{linha.nome}</b></td>
                    <td>{linha.setor}</td>
                    <td className="sjMini">{linha.tipo}</td>
                    <td>
                      {linha.ferias ? <span className="sjBadgeY">FÉRIAS</span> : null}
                      {!linha.ferias && linha.folga ? <span className="sjBadge">• FOLGA</span> : null}
                      {!linha.folga && linha.entrada && linha.saida ? (
                        <>
                          {linha.entrada} – {linha.saida}
                          {linha.almoco ? <span className="sjMini"> almoço {linha.almoco}</span> : null}
                          {linha.jantar ? <span className="sjMini"> jantar {linha.jantar}</span> : null}
                          {linha.pausa && !linha.freelancer ? <span className="sjMini"> (pausa 1h sugerida {linha.pausa} — sem horário fixo cadastrado no RH)</span> : null}
                          {linha.pausa && linha.freelancer ? <span className="sjMini"> pausa {linha.pausa}</span> : null}
                          {linha.barras.length ? (
                            <div className="sjHeat" title={`Turno ${linha.entrada}–${linha.saida} — calor de atendimento por horário`}>
                              <div className="sjHeatBar">
                                {linha.barras.map((celula) => (
                                  <span key={celula.clock} className={celula.pico ? "sjHeatPico" : undefined} style={{ background: corCalor(celula.t, celula.semDado) }} title={`${celula.clock}${celula.pico ? " (pico do turno)" : ""}`} />
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                      {!linha.folga && (!linha.entrada || !linha.saida) ? <span className="sjMini">{linha.freelancer ? "horário não confirmado" : "horário não cadastrado"}</span> : null}
                    </td>
                    <td>
                      {linha.folga ? "—" : (
                        <div className="sjPresenca">
                          {marca.status === "compareceu" ? <Badge nivel="g">Compareceu</Badge> : null}
                          {marca.status === "faltou" ? <Badge nivel="r">Faltou</Badge> : null}
                          {!marca.status ? (
                            linha.freelancer ? (
                              <>
                                <BotaoAcao onClick={() => presencaFl(linha.id, true)}>Compareceu</BotaoAcao>
                                <BotaoAcao perigo onClick={() => presencaFl(linha.id, false)}>Faltou</BotaoAcao>
                              </>
                            ) : (
                              <>
                                <button type="button" className="sjMiniBtn" onClick={() => marcarClt(linha.id, "compareceu")}>Compareceu</button>
                                <button type="button" className="sjMiniBtn sjMiniBtnR" onClick={() => marcarClt(linha.id, "faltou")}>Faltou</button>
                              </>
                            )
                          ) : null}
                          {linha.freelancer ? (pedido?.attendanceNote ? <span className="sjMini">{pedido.attendanceNote}</span> : null) : marca.editando ? (
                            <span className="sjObs">
                              <textarea value={marca.obs} rows={3} placeholder="observação do dia" onChange={(e) => gravarLocal(linha.id, { ...marca, obs: e.target.value })} />
                              <button type="button" className="sjMiniBtn" onClick={() => salvarObs(linha.id)}>Enviar</button>
                              <button type="button" className="sjMiniBtn sjMiniBtnR" onClick={() => gravarLocal(linha.id, { ...marca, editando: false })}>Cancelar</button>
                            </span>
                          ) : (
                            <button type="button" className="sjMiniBtn" onClick={() => gravarLocal(linha.id, { ...marca, editando: true })}>{marca.obs ? marca.obs.slice(0, 26) : "Observação"}</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {linha.freelancer ? (
                        ed ? (
                          <div className="opAcoes" style={{ flexDirection: "column", alignItems: "stretch" }}>
                            <input className="sjInput" placeholder="Nome(s)" value={ed.names} onChange={(e) => setEditando((a) => ({ ...a, [linha.id]: { ...ed, names: e.target.value } }))} />
                            <input className="sjInput" placeholder="Entrada" value={ed.horaEntrada} onChange={(e) => setEditando((a) => ({ ...a, [linha.id]: { ...ed, horaEntrada: e.target.value } }))} />
                            <input className="sjInput" placeholder="Saída" value={ed.horaSaida} onChange={(e) => setEditando((a) => ({ ...a, [linha.id]: { ...ed, horaSaida: e.target.value } }))} />
                            <BotaoAcao destaque onClick={() => salvarNomes(linha.id)}>Salvar</BotaoAcao>
                            <BotaoAcao onClick={() => setEditando((a) => { const n = { ...a }; delete n[linha.id]; return n; })}>Cancelar</BotaoAcao>
                          </div>
                        ) : (
                          <div className="opAcoes">
                            <BotaoAcao onClick={() => setEditando((a) => ({ ...a, [linha.id]: { names: pedido?.freelancerNames || "", horaEntrada: pedido?.horaEntrada || linha.entrada, horaSaida: pedido?.horaSaida || linha.saida, horaPausa: pedido?.horaPausa || "" } }))}>Editar</BotaoAcao>
                            <BotaoAcao perigo onClick={async () => { if (await apagarFl(linha.id)) { aoSalvar(); recarregar(); } }}>Cancelar solicitação</BotaoAcao>
                          </div>
                        )
                      ) : null}
                    </td>
                    <td>{linha.freelancer ? <input type="checkbox" className="opCheck" checked={sel.has(linha.id)} onChange={(e) => setSel((a) => { const n = new Set(a); if (e.target.checked) n.add(linha.id); else n.delete(linha.id); return n; })} /> : null}</td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="sjMini">Ninguém escalado ainda pra esse dia.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
