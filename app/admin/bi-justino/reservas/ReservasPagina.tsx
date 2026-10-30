"use client";

import { useMemo, useState } from "react";
import { CONTEUDO } from "../conteudo";
import { eventosPaxPorData } from "../eventos/indicadores";
import type { Evento } from "../eventos/tipos";
import { usePermissoesArea } from "../operacao/apiArea";
import { FecharMes, fechamentosDe } from "../operacao/FecharMes";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import { CrmDionisio } from "./CrmDionisio";
import { ListaReservas } from "./ListaReservas";
import { NovaReserva } from "./NovaReserva";
import { QuadroSemana } from "./QuadroSemana";
import type { ReservaDia, ReservaEntry } from "./tipos";
import "../operacao/operacao.css";

/** Página montada a partir do espelho da planilha (cópia do painel do Renato). */
export const PRONTA = true;

const CHAVES = ["getReservations", "getReservationEntries", "getCrmReservas", "getCrmFunil", "getCrmConfig", "getEventos", "getIgAtivacoes", "getMonthClosures:reservas"];

export function ReservasPagina({ subId, onSub, live, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.reservas ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const { diretoria } = usePermissoesArea();
  const [editando, setEditando] = useState<ReservaEntry | null>(null);
  const entradas = payloadDe<{ items?: ReservaEntry[] }>(dados, "getReservationEntries")?.items ?? [];
  const porData = useMemo(() => Object.fromEntries((payloadDe<{ docs?: ReservaDia[] }>(dados, "getReservations")?.docs ?? []).map((d) => [d.date, d])), [dados]);
  const eventosPax = useMemo(() => eventosPaxPorData(payloadDe<{ items?: Evento[] }>(dados, "getEventos")?.items ?? []), [dados]);
  const ativacoes = payloadDe<{ items?: { id: string; titulo?: string; data?: string; tipo?: string }[] }>(dados, "getIgAtivacoes")?.items ?? [];
  const fechamentos = fechamentosDe(dados, "reservas");
  const aoMudar = () => { onSalvo(); recarregar(); };

  return (
    <>
      {abas.length > 1 ? (
        <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div>
      ) : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="reservas" className="sjStage">
        <div className="sjGrid">
          <CrmDionisio dados={dados} recarregar={recarregar} />
          <NovaReserva editando={editando} ativacoes={ativacoes} fechamentos={fechamentos} diretoria={diretoria} aoSalvar={aoMudar} aoCancelar={() => setEditando(null)} />
          <FecharMes area="reservas" dados={dados} diretoria={diretoria} aoSalvar={recarregar} />
          <QuadroSemana porData={porData} eventosPax={eventosPax} live={live} recarregar={recarregar} />
          <ListaReservas entradas={entradas} fechamentos={fechamentos} diretoria={diretoria} live={live} aoEditar={setEditando} aoMudar={aoMudar} recarregar={recarregar} />
        </div>
      </div>
    </>
  );
}
