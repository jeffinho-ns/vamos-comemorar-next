"use client";

import { useMemo, useState } from "react";
import type { ZigAoVivo } from "./zigValor";
import { corCalor, quadroDoDia } from "./quadroEscalaDia";

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

type Presenca = { status: "" | "compareceu" | "faltou"; obs: string; editando: boolean };

export function EscalaDia({ zig }: { zig: ZigAoVivo | null }) {
  const hoje = hojeSp();
  const [data, setData] = useState(hoje);
  const [presenca, setPresenca] = useState<Record<string, Presenca>>({});
  const [status, setStatus] = useState("");
  const quadro = useMemo(() => quadroDoDia(zig, data, hoje), [zig, data, hoje]);
  const temCadastro = (zig?.colaboradores || []).length > 0;

  function ler(id: string): Presenca {
    return presenca[id] || { status: "", obs: "", editando: false };
  }
  function gravar(id: string, proximo: Presenca) {
    setPresenca((atual) => ({ ...atual, [id]: proximo }));
  }

  return (
    <details className="sjCollapse" open>
      <summary>
        <span className="sjChev">▸</span>
        Visualização da Escala Completa do dia
        <span className="sjHint">clique para abrir</span>
      </summary>
      <div className="sjCard sjBloco sjCollapseBody">
        <div className="sjRole">
          <h3>Escala do dia — CLT, INT, PJ e freelancers, tudo num lugar só</h3>
          <button type="button" className="sjAnaliseBtn" onClick={() => setStatus("Escala atualizada com o cadastro e o calor do dia.")}>Atualizar</button>
        </div>
        <p className="sjNote">Quem está escalado hoje, em uma tabela só: CLT/INT/PJ (cadastro em RH → Colaboradores) + cada freelancer aprovado pelo RH (sugestão automática de horário calculada pra cobrir o pico de movimento do setor — cruza o cadastro com o faturamento por bloco de 30min do ZigPay). <b>Compareceu/Faltou</b> e <b>Observação</b> valem pros 4 tipos e ficam nesta tela. A barrinha ao lado do horário é o calor de atendimento por horário (venda real ou estimada da ZigPay, recortada no turno de cada um) — <span style={{ color: "#f76e7c" }}>vermelho</span> = horário de maior fluxo histórico, <span style={{ color: "#34d399" }}>verde</span> = menor.</p>
        <div className="sjToolbar">
          <div className="sjTb"><label>Dia<input className="sjInput" type="date" value={data} onChange={(evento) => setData(evento.target.value)} /></label></div>
        </div>
        {quadro.paxTexto ? <p className="sjMini" style={{ margin: "6px 0 12px" }}>{quadro.paxTexto}</p> : null}
        {quadro.estimado ? <div className="sjCalor">{quadro.nota}</div> : null}
        <div className="sjFormAcoes" style={{ justifyContent: "flex-end" }}>
          <span className="sjMini">{status}</span>
          <button type="button" className="sjAnaliseBtn" style={{ background: "#3a1620" }} onClick={() => setStatus("Marque pelo menos uma solicitação de freelancer.")}>Cancelar selecionados</button>
        </div>
        <div className="sjTableInner">
          <table>
            <thead>
              <tr>
                <th>Colaborador</th><th>Setor</th><th>Tipo</th><th>Horário</th><th>Presença hoje</th><th>Ação</th>
                <th><input type="checkbox" aria-label="Selecionar todos os freelancers" disabled /></th>
              </tr>
            </thead>
            <tbody>
              {!temCadastro ? (
                <tr><td colSpan={7}>Sem acesso ao cadastro de Colaboradores (RH) pra listar aqui. Ele entra na próxima coleta da planilha.</td></tr>
              ) : quadro.linhas.length ? quadro.linhas.map((linha) => {
                const marca = ler(linha.id);
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
                              <div className="sjHeatMarks">
                                {linha.barras.map((celula) => (
                                  <span key={`${celula.clock}-m`} className={celula.pico ? "sjHeatMarkPico" : undefined}>{celula.pico ? `▲${celula.clock}` : celula.horaCheia ? `${celula.clock.slice(0, 2)}h` : ""}</span>
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
                          {marca.status === "compareceu" ? <span className="sjBadgeG">Compareceu</span> : null}
                          {marca.status === "faltou" ? <span className="sjBadgeR">Faltou</span> : null}
                          {!marca.status ? (
                            <>
                              <button type="button" className="sjMiniBtn" onClick={() => gravar(linha.id, { ...marca, status: "compareceu" })}>Compareceu</button>
                              <button type="button" className="sjMiniBtn sjMiniBtnR" onClick={() => gravar(linha.id, { ...marca, status: "faltou" })}>Faltou</button>
                            </>
                          ) : null}
                          {marca.editando ? (
                            <span className="sjObs">
                              <textarea value={marca.obs} rows={3} placeholder="observação do dia" onChange={(evento) => gravar(linha.id, { ...marca, obs: evento.target.value })} />
                              <button type="button" className="sjMiniBtn" onClick={() => gravar(linha.id, { ...marca, editando: false })}>Enviar</button>
                              <button type="button" className="sjMiniBtn sjMiniBtnR" onClick={() => gravar(linha.id, { ...marca, editando: false, obs: ler(linha.id).obs })}>Cancelar</button>
                            </span>
                          ) : (
                            <button type="button" className="sjMiniBtn" onClick={() => gravar(linha.id, { ...marca, editando: true })}>{marca.obs ? marca.obs.slice(0, 26) : "Observação"}</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{linha.freelancer ? <button type="button" className="sjMiniBtn">Editar</button> : null}</td>
                    <td>{linha.freelancer ? <input type="checkbox" aria-label={`Selecionar ${linha.nome}`} /> : null}</td>
                  </tr>
                );
              }) : <tr><td colSpan={7}>Ninguém escalado ainda pra esse dia.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
