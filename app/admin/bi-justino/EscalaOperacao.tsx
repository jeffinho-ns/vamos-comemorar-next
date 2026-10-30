"use client";

import { useMemo, useState } from "react";
import type { ZigAoVivo } from "./zigValor";

const MOTIVO: Record<string, string> = {
  demanda: "Aumento de movimento",
  folga: "Cobertura de folga",
  ferias: "Cobertura de férias",
  falta: "Cobertura de falta",
  compensacao: "Compensação de horas",
  outro: "Outro motivo",
};

const SETOR: Record<string, string> = {
  salao: "Garçom",
  cumim: "Cumim",
  bar: "Bar",
  cozinha: "Cozinha",
  limpeza: "Limpeza",
  seguranca: "Segurança",
  caixa: "Caixa/Hostess",
  runner: "Runner/RP",
  manutencao: "Manutenção",
  estoquista: "Estoquista",
};

function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function dataCurta(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function hojeSp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function HorarioCasa({ zig }: { zig: ZigAoVivo | null }) {
  const linhas = zig?.escala?.horario || [];
  return (
    <section className="sjCard sjBloco">
      <div className="sjFatHead">
        <h3>Horário de funcionamento</h3>
        <span className="sjTag real">manual operacional</span>
      </div>
      <p className="sjZigNota">
        Capacidade simultânea máxima da casa: <b>{zig?.escala?.capacidade || 380} pessoas</b>. Todo cálculo de escala respeita esse teto, mesmo em dia de público total maior. Sábado opera em blocos, com turno mais longo em bar e salão.
      </p>
      <div className="sjTableInner">
        <table>
          <thead><tr><th>Dia</th><th>Abre</th><th>Fecha</th><th>Duração</th><th>O que tem</th></tr></thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.dia}>
                <td><b>{linha.dia}</b></td>
                {linha.fechado ? <td colSpan={3}>FECHADO — só manutenção e entregas programadas</td> : (
                  <>
                    <td>{linha.abre}</td>
                    <td>{linha.fecha}</td>
                    <td>{linha.duracao}</td>
                  </>
                )}
                <td>{linha.fechado ? "—" : linha.texto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function GradeFreelancers({ zig }: { zig: ZigAoVivo | null }) {
  const dias = zig?.escala?.dias || [];
  const abertos = dias.filter((dia) => !dia.fechado);
  const inicial = abertos.find((dia) => dia.date >= hojeSp())?.date || abertos[0]?.date || "";
  const [data, setData] = useState(inicial);
  const dia = dias.find((item) => item.date === data) || abertos[0];
  const cmo = zig?.escala?.cmo;
  const pct = cmo?.pct == null ? "—" : `${cmo.pct.toFixed(1).replace(".", ",")}%`;

  return (
    <section className="sjCard sjBloco">
      <h3>Solicitação semanal de freelancers</h3>
      <p className="sjZigNota">
        A sugestão usa o mapa de calor do faturamento por horário da ZigPay e a média de público daquele dia da semana. Equipe fixa é o quadro mínimo do RH (CLT + intermitente + PJ). Manutenção, estoquista e runner ficam em zero: esses setores só entram por pedido manual. Permanência considerada: {String(zig?.escala?.permanenciaH || 3.9).replace(".", ",")} h, com teto de {zig?.escala?.capacidade || 380} presentes ao mesmo tempo.
      </p>
      <div className="sjSubsZig">
        {dias.map((item) => (
          <button key={item.date} type="button" className={dia?.date === item.date ? "on" : ""} onClick={() => setData(item.date)}>
            {item.dia.slice(0, 3)} {dataCurta(item.date)}{item.fechado ? " fechado" : ""}
          </button>
        ))}
      </div>
      {dia && !dia.fechado ? (
        <>
          <p className="sjZigNota">
            Público esperado: <b>{dia.pax.toLocaleString("pt-BR")}</b> ({dia.fonte}). Presentes ao mesmo tempo no pico: <b>~{Math.round(dia.presentesPico)}</b>. Funcionamento {dia.abre}–{dia.fecha}. A equipe chega 1h antes.
          </p>
          <div className="sjTableInner">
            <table>
              <thead>
                <tr>
                  <th>Setor</th><th>Brigada padrão</th><th>Limite</th><th>Necessário no pico</th><th>Equipe fixa</th><th>Sugerido</th><th>Turno</th><th>Custo</th>
                </tr>
              </thead>
              <tbody>
                {dia.setores.map((setor) => (
                  <tr key={setor.chave}>
                    <td><b>{setor.label}</b></td>
                    <td>{setor.brigada}</td>
                    <td>{setor.limite == null ? "—" : setor.limite}</td>
                    <td>{setor.necessario}</td>
                    <td>{setor.fixa}{setor.referencia ? " ref." : ""}</td>
                    <td><b>{setor.sugerido}</b></td>
                    <td>{setor.manual ? "manual" : `${setor.turno}h`}</td>
                    <td>{reais(setor.custo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p className="sjZigNota">Segunda a casa fica fechada. Sem escala nesse dia.</p>}
      <p className="sjAnalise">
        CMO freelancers da sugestão: <b>{reais(cmo?.total)}</b>
        {cmo?.pct != null ? ` • ${pct} do faturamento (teto ${cmo.tetoPct}%, ${reais(cmo.teto)})` : ""}.
        {cmo?.fonte ? ` Base: ${cmo.fonte}.` : ""}
        {cmo?.status === "acima" ? " A sugestão passa do teto de 8%." : ""}
      </p>
    </section>
  );
}

export function EscalaDoDia({ zig }: { zig: ZigAoVivo | null }) {
  const dias = (zig?.escala?.dias || []).filter((dia) => !dia.fechado);
  const [data, setData] = useState(dias.find((dia) => dia.date >= hojeSp())?.date || dias[0]?.date || "");
  const dia = dias.find((item) => item.date === data) || dias[0];
  return (
    <section className="sjCard sjBloco">
      <h3>Escala do dia — CLT, INT, PJ e freelancers</h3>
      <p className="sjZigNota">
        Quem a conta pede em cada setor neste dia. O nome de cada colaborador e o compareceu/faltou ficam no cadastro de presença do RH; aqui entra a cobertura calculada: necessário no pico, quem a equipe fixa já cobre e quantos freelancers faltam, com o turno de menor custo entre 8h e 12h.
      </p>
      <label className="sjFormBloco">
        <span className="sjMini">Dia</span>
        <input className="sjInput" type="date" value={dia?.date || data} onChange={(evento) => setData(evento.target.value)} />
      </label>
      {dia ? (
        <div className="sjTableInner">
          <table>
            <thead><tr><th>Setor</th><th>Necessário no pico</th><th>Equipe fixa hoje</th><th>Freelancers</th><th>Turno sugerido</th></tr></thead>
            <tbody>
              {dia.setores.map((setor) => (
                <tr key={setor.chave}>
                  <td><b>{setor.label}</b></td>
                  <td>{setor.necessario}</td>
                  <td>{setor.fixa}</td>
                  <td>{setor.sugerido}</td>
                  <td>{setor.manual ? "só pedido manual" : `${setor.turno}h — ${reais(setor.custo)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="sjZigNota">Escolha um dia em que a casa abre.</p>}
    </section>
  );
}

export function PedidosFreelancer({ zig }: { zig: ZigAoVivo | null }) {
  const pedidos = zig?.freelancers || [];
  const linhas = useMemo(() => [...pedidos].sort((a, b) => b.date.localeCompare(a.date)), [pedidos]);
  return (
    <section className="sjCard sjBloco">
      <h3>Solicitação de freelancers (avulsa)</h3>
      <p className="sjZigNota">
        Reforço de última hora, já pedido e gravado na planilha. O planejamento normal da semana é o quadro de cima. Falta confirmada não entra no custo. Turnos: 8h R$ 125, 9h R$ 135, 10h R$ 145, 11h R$ 155, 12h R$ 165.
      </p>
      <div className="sjTableInner">
        <table>
          <thead><tr><th>Data</th><th>Setor</th><th>Motivo</th><th>Turno</th><th>Qtd</th><th>Custo</th><th>Status</th><th>Presença</th></tr></thead>
          <tbody>
            {linhas.length ? linhas.map((pedido, indice) => (
              <tr key={`${pedido.date}-${pedido.sector}-${indice}`}>
                <td>{dataCurta(pedido.date)}</td>
                <td>{SETOR[pedido.sector] || pedido.sector}</td>
                <td>{MOTIVO[pedido.reason] || pedido.reason || "—"}</td>
                <td>{pedido.shiftHours ? `${pedido.shiftHours}h` : "—"}</td>
                <td>{pedido.qty}</td>
                <td>{reais(pedido.totalCost)}</td>
                <td>{pedido.status || "—"}</td>
                <td>{pedido.attendance || "—"}</td>
              </tr>
            )) : (
              <tr><td colSpan={8}>Ainda não há pedido de freelancer na cópia do banco. A próxima coleta da planilha traz a lista.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
