"use client";

import { useMemo, useState } from "react";
import { chamarBi } from "../usePlanilha";
import { Badge, Cabecalho, Tabela } from "../financeiro/ui";
import { brl, fmtDate, type FreelancerRequest, type MapasZig } from "../financeiro/comum";
import { FREELANCER_REASON_LABEL, FREELANCER_SECTOR_LABEL, HORARIO_FUNCIONAMENTO as HORARIO, type Employee, type SetorBase } from "./rhTipos";
import { sugestaoFreelancer } from "./rhCalc";

const LIMITE_LISTA = 80;

function badgeStatus(status: string) {
  if (status === "pendente") return <Badge nivel="y">pendente</Badge>;
  if (status === "aprovado") return <Badge nivel="g">aprovado</Badge>;
  if (status === "recusado") return <Badge nivel="r">recusado</Badge>;
  return <span>{status}</span>;
}
function badgePresenca(attendance: string) {
  if (attendance === "compareceu") return <Badge nivel="g">compareceu</Badge>;
  if (attendance === "faltou") return <Badge nivel="r">faltou</Badge>;
  return attendance ? <span>{attendance}</span> : <span className="sjMini">—</span>;
}

/** "Aprovação de freelancers" (renderFreelancerApprovalList + decideSelectedFreelancerRequests). */
export function RhAprovacaoFreelancers({
  pedidos,
  sectorBase,
  employees,
  zig,
  paxReservas,
  onAtualizar,
  onSalvo,
}: {
  pedidos: FreelancerRequest[];
  sectorBase: Record<string, SetorBase>;
  employees: Employee[];
  zig: MapasZig;
  paxReservas: Record<string, number>;
  onAtualizar: () => void;
  onSalvo: () => void;
}) {
  const [historico, setHistorico] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const pendentes = pedidos.filter((it) => it.status === "pendente").length;
  const lista = useMemo(() => (historico ? pedidos : pedidos.filter((it) => it.status === "pendente")).slice(0, LIMITE_LISTA), [pedidos, historico]);

  async function decidir(ids: string[], approve: boolean) {
    if (!ids.length) {
      setStatus("Marque pelo menos um pedido.");
      return;
    }
    if (ocupado) {
      setStatus("Aguarde a decisão anterior terminar.");
      return;
    }
    if (ids.length > 1 && !window.confirm(`${approve ? "Aprovar " : "Recusar "}${ids.length} solicitação(ões) selecionada(s)?`)) return;
    setOcupado(true);
    setStatus(`Processando ${ids.length} pedido(s)…`);
    const r = await chamarBi<{ ok: boolean; error?: string }>("/api/bi/justino/rh/freelancers/decidir", { ids, approve });
    setOcupado(false);
    setSelecionados([]);
    if (r.ok) {
      setStatus(`${ids.length} ${approve ? "aprovada(s)" : "recusada(s)"}.`);
      onSalvo();
    } else {
      setStatus(`Não consegui decidir (${r.json?.error || r.status}).`);
    }
  }

  const todosMarcados = lista.length > 0 && lista.every((it) => selecionados.includes(it.id));
  return (
    <section className="sjCard sjBloco">
      <Cabecalho titulo="Aprovação de freelancers">
        <button type="button" className="sjBtn sjBtnP" onClick={onAtualizar}>🔄 Atualizar</button>
        <button type="button" className="sjBtn sjBtnP" onClick={() => { setHistorico((h) => !h); setSelecionados([]); }}>{historico ? "📋 Ver só pendentes" : "📜 Ver histórico"}</button>
        <Badge nivel="y">{pendentes ? `${pendentes} pendente(s)` : "nenhum pendente"}</Badge>
      </Cabecalho>
      <p className="sjNote">Pedidos feitos pelo Gerente Operador, por dia/setor/turno. Aprovar soma o custo automaticamente no &quot;Extras&quot; do dia correspondente — não precisa digitar de novo. Só pedido <b>pendente</b> aparece aqui — já decidido (aprovado/recusado) sai da lista sozinho, pra não acumular; clique &quot;Ver histórico&quot; pra rever/corrigir uma decisão antiga.</p>
      <div style={{ margin: "6px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span className="sjMini">{status}</span>
        <button type="button" className="sjBtn" disabled={ocupado} onClick={() => decidir(selecionados, true)}>✔ Aprovar selecionados</button>
        <button type="button" className="sjBtn sjBtnR" disabled={ocupado} onClick={() => decidir(selecionados, false)}>✖ Recusar selecionados</button>
      </div>
      <Tabela
        colunas={["Data", "Setor", "Motivo", "Turno", "Qtd pedida", "Sugestão do sistema", "Custo", "Pedido por", "Presença", "Status", "Ação",
          <input key="todos" type="checkbox" className="sjCheck" title="Selecionar todos" checked={todosMarcados} onChange={(e) => setSelecionados(e.target.checked ? lista.map((it) => it.id) : [])} />]}
        vazio={historico ? "Nenhuma solicitação ainda." : "Nenhum pedido pendente."}
        linhas={lista.map((it) => {
          const st = sugestaoFreelancer(it.date, it.sector, sectorBase, employees, zig, paxReservas);
          const classe = it.qty > st.sugestao ? "sjMiniLaranja" : it.qty < st.sugestao ? "sjMiniRoxo" : "";
          return {
            key: it.id,
            cels: [
              fmtDate(it.date),
              FREELANCER_SECTOR_LABEL[it.sector] || it.sector,
              <span key="m" className="sjMini">{FREELANCER_REASON_LABEL[it.reason] || it.reason || "—"}</span>,
              `${it.shiftHours}h`,
              String(it.qty),
              <span key="s"><span className={classe}>{st.sugestao}</span> <span className="sjMini">(mín {st.minimo}, CLT {st.cltPresente}, pax {st.pax || "—"})</span></span>,
              brl(it.totalCost),
              <span key="p" className="sjMini">{it.requestedByEmail}</span>,
              badgePresenca(it.attendance),
              badgeStatus(it.status),
              it.status === "pendente"
                ? <span key="a" className="sjSticky"><button type="button" className="sjBtn sjBtnP" disabled={ocupado} onClick={() => decidir([it.id], true)}>Aprovar</button> <button type="button" className="sjBtn sjBtnP sjBtnR" disabled={ocupado} onClick={() => decidir([it.id], false)}>Recusar</button></span>
                : <span key="a" className="sjMini">—</span>,
              <input key="c" type="checkbox" className="sjCheck" checked={selecionados.includes(it.id)} onChange={(e) => setSelecionados((atual) => (e.target.checked ? Array.from(new Set([...atual, it.id])) : atual.filter((id) => id !== it.id)))} aria-label={`Selecionar pedido de ${fmtDate(it.date)}`} />,
            ],
          };
        })}
      />
      <p className="sjMini" style={{ marginTop: 8 }}>Sugestão do sistema = Pax ÷ atendimento por pessoa, mínimo pela brigada padrão, menos a equipe própria presente (CLT+INT+PJ, descontando férias). O ajuste hora a hora pelo mapa de calor fica na aba Gerente Operador.</p>
    </section>
  );
}

/** "Horário de funcionamento" (renderHorarioFuncionamento). */
export function RhHorarioFuncionamento() {
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const nomes: Record<number, string> = { 0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado" };
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole"><h3>Horário de funcionamento</h3><Badge nivel="p">MANUAL OPERACIONAL, PÁG. 10</Badge></div>
      <p className="sjNote">Capacidade simultânea máxima da casa: <b>380 pessoas</b> — todo cálculo de escala respeita esse teto, mesmo em dias de público total maior (giro/turnover). Sábado opera em blocos de horário com intensidade diferente (ver Manual, pág. 13) — sugestão de turno mais longo pros setores de bar/salão nesse dia.</p>
      <Tabela
        colunas={["Dia", "Abre", "Fecha", "Duração", "O que tem"]}
        linhas={ordem.map((wd) => {
          const h = HORARIO[wd];
          if (!h) return { key: String(wd), cels: [<b key="d">{nomes[wd]}</b>, <span key="f" className="sjMini">FECHADO — só manutenção e entregas programadas</span>, "", "", <span key="o" className="sjMini">—</span>] };
          return { key: String(wd), cels: [<b key="d">{nomes[wd]}</b>, `${h.abre}h`, `${h.fecha % 24}h`, `${h.fecha - h.abre}h`, <span key="o" className="sjMini">{h.txt}</span>] };
        })}
      />
    </section>
  );
}
