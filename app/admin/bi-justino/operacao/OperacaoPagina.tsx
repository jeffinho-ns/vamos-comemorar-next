"use client";

import { CONTEUDO } from "../conteudo";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { usePlanilha } from "../usePlanilha";
import { usePermissoesArea } from "./apiArea";
import { Duvidas } from "./DuvidasLocal";
import { EscalaFreelancers } from "./EscalaFreelancers";
import { FecharMes } from "./FecharMes";
import { IndicadoresOperacao } from "./IndicadoresOperacao";
import { Medidores } from "./Medidores";
import { RegistroDia } from "./RegistroDia";
import "./operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

const CHAVES = [
  "getEntries:operacao",
  "getFreelancerRequests",
  "getEmployees",
  "getSectorBase",
  "getDailyAttendance",
  "getMonthClosures:operacao",
  "getZigHourly",
  "getZigHourlyDetail",
  "getReservations",
  "getEventos",
  "getMeterReadings",
  "getDuvidas",
];

export function OperacaoPagina({ subId, onSub, live, zig, dre, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.operacao ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, carregando, recarregar } = usePlanilha(CHAVES);
  const { diretoria } = usePermissoesArea();
  const subAtual = aba?.id ?? "reg";

  return (
    <>
      <div className="sjSubs">
        {abas.map((item) => (
          <button key={item.id} type="button" className={item.id === subAtual ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>
        ))}
      </div>
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key={`operacao:${subAtual}`} className="sjStage">
        <div className="sjGrid">
          {subAtual === "reg" ? <RegistroDia zig={zig} dre={dre} dados={dados} recarregar={recarregar} onSalvo={onSalvo} /> : null}
          {subAtual === "ind" ? <IndicadoresOperacao zig={zig} dre={dre} live={live} dados={dados} onSalvo={onSalvo} /> : null}
          {subAtual === "esc" ? <EscalaFreelancers zig={zig} dados={dados} recarregar={recarregar} onSalvo={onSalvo} /> : null}
          {subAtual === "med" ? <Medidores dados={dados} recarregar={recarregar} /> : null}
          {subAtual === "fec" ? (
            <>
              <FecharMes area="operacao" dados={dados} diretoria={diretoria} aoSalvar={recarregar} />
              <Duvidas dados={dados} aoSalvar={onSalvo} recarregar={recarregar} />
            </>
          ) : null}
          {carregando && !Object.keys(dados).length ? <p className="sjMini opFull">Lendo a cópia da planilha no banco…</p> : null}
        </div>
      </div>
    </>
  );
}
