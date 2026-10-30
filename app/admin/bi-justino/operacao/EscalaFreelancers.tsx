"use client";

import { useState } from "react";
import { HorarioCasa } from "../EscalaOperacao";
import { EscalaCompleta } from "./EscalaCompleta";
import { payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { ZigAoVivo } from "../zigValor";
import { Cartao } from "./Cartao";
import { hojeSp } from "./formato";
import { FreelancerAvulsa } from "./FreelancerAvulsa";
import type { PedidoFreelancer } from "./freelancerTipos";
import { SemanalFreelancers } from "./SemanalFreelancers";

export function pedidosFreelancer(dados: DadosPlanilha): PedidoFreelancer[] {
  return payloadDe<{ items?: PedidoFreelancer[] }>(dados, "getFreelancerRequests")?.items ?? [];
}

/** "Estudo de dimensionamento da escala" — mesmos passos do painel, sobre o dia calculado pela API. */
function EstudoEscala({ zig }: { zig: ZigAoVivo | null }) {
  const [data, setData] = useState(hojeSp());
  const [calculado, setCalculado] = useState(false);
  const base = zig?.escala?.dias || [];
  const nome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date(`${data}T12:00:00`).getDay()];
  const dia = base.find((d) => d.date === data) || base.find((d) => d.dia === nome) || null;
  return (
    <Cartao titulo="Estudo de dimensionamento da escala" aberto={false}>
      <div className="sjRole"><h3>📐 Estudo de dimensionamento • como o BI calcula quantas pessoas cada setor precisa</h3></div>
      <p className="sjNote">A regra de &quot;atendimento por pessoa&quot; é de clientes atendidos por uma pessoa <b>ao mesmo tempo</b>. O estudo mostra, para o dia escolhido, o caminho completo: público do dia → chegadas por meia hora (mapa de calor da ZigPay) → clientes presentes ao mesmo tempo → pessoas necessárias por setor → o que a equipe fixa já cobre → freelancers.</p>
      <div className="sjToolbar">
        <div className="sjTb"><label>Dia do estudo<input className="sjInput" type="date" value={data} onChange={(e) => { setData(e.target.value); setCalculado(false); }} /></label></div>
        <div className="sjTb"><label>Permanência do cliente (h)<input className="sjInput" type="number" readOnly value={zig?.escala?.permanenciaH || 3.9} style={{ width: 80 }} /></label></div>
        <button type="button" className="sjAnaliseBtn" onClick={() => setCalculado(true)}>📐 Calcular estudo</button>
      </div>
      {calculado && dia && !dia.fechado ? (
        <div className="sjNote">
          <p>1) Público esperado: <b>{dia.pax.toLocaleString("pt-BR")}</b> ({dia.fonte}).</p>
          <p>2) Presentes ao mesmo tempo no pico: <b>~{Math.round(dia.presentesPico)}</b>, limitado a {zig?.escala?.capacidade || 380}.</p>
          <p>3) Por setor — necessário no pico, equipe fixa e freelancers sugeridos:</p>
          <div className="sjTableInner opTabela">
            <table>
              <thead><tr><th>Setor</th><th>Brigada padrão</th><th>Necessário no pico</th><th>Equipe fixa</th><th>Sugerido</th><th>Turno</th></tr></thead>
              <tbody>{dia.setores.map((s) => <tr key={s.chave}><td>{s.label}</td><td>{s.brigada}</td><td>{s.necessario}</td><td>{s.fixa}</td><td>{s.sugerido}</td><td>{s.manual ? "manual" : `${s.turno}h`}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : calculado ? <p className="sjMini">Casa fechada nesse dia (Manual) ou sem dado de escala na cópia do banco.</p> : <p className="sjMini">Escolha o dia e clique em <b>Calcular estudo</b>.</p>}
    </Cartao>
  );
}

export function EscalaFreelancers({ zig, dados, recarregar, onSalvo }: { zig: ZigAoVivo | null; dados: DadosPlanilha; recarregar: () => void; onSalvo: () => void }) {
  const pedidos = pedidosFreelancer(dados);
  const aoSalvar = () => { onSalvo(); recarregar(); };
  return (
    <>
      <HorarioCasa zig={zig} />
      <SemanalFreelancers zig={zig} pedidos={pedidos} aoSalvar={aoSalvar} />
      <EscalaCompleta zig={zig} dados={dados} pedidos={pedidos} recarregar={recarregar} aoSalvar={aoSalvar} />
      <EstudoEscala zig={zig} />
      <FreelancerAvulsa zig={zig} pedidos={pedidos} aoSalvar={aoSalvar} recarregar={recarregar} />
    </>
  );
}
