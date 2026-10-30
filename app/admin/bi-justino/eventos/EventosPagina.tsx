"use client";

import { useState } from "react";
import { CONTEUDO } from "../conteudo";
import { usePermissoesArea } from "../operacao/apiArea";
import { Nota } from "../operacao/Cartao";
import { FecharMes, fechamentosDe } from "../operacao/FecharMes";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import { CotacaoForm, CotacoesLista } from "./Cotacoes";
import { EventoForm } from "./EventoForm";
import { EventosLista, TarefasHoje } from "./EventosLista";
import { IndicadoresEventos } from "./IndicadoresEventos";
import { PacotesPdf } from "./PacotesPdf";
import type { Cotacao, Evento, Tarefa } from "./tipos";
import "../operacao/operacao.css";

/** Página montada a partir do espelho da planilha (cópia do painel do Renato). */
export const PRONTA = true;

const CHAVES = ["getEventos", "getEventoTarefas", "getEventoCotacoes", "getEventoPacotesPdfInfo", "getMonthClosures:eventos"];

export function EventosPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.eventos ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const subAtual = aba?.id ?? "principal";
  const { dados, erro, recarregar } = usePlanilha(CHAVES);
  const { diretoria } = usePermissoesArea();
  const [editando, setEditando] = useState<Evento | null>(null);
  const [cotEditando, setCotEditando] = useState<Cotacao | null>(null);
  const eventos = payloadDe<{ items?: Evento[] }>(dados, "getEventos")?.items ?? [];
  const tarefas = payloadDe<{ items?: Tarefa[] }>(dados, "getEventoTarefas")?.items ?? [];
  const cotacoes = payloadDe<{ items?: Cotacao[] }>(dados, "getEventoCotacoes")?.items ?? [];
  const aoMudar = () => { onSalvo(); recarregar(); };

  return (
    <>
      <div className="sjSubs">
        {abas.map((item) => <button key={item.id} type="button" className={item.id === subAtual ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}
      </div>
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key={`eventos:${subAtual}`} className="sjStage">
        <div className="sjGrid">
          {subAtual === "cotacoes" ? (
            <>
              <Nota><b>Cotações</b> — monta a proposta pro cliente aqui. Salva como rascunho (edite à vontade), depois <b>Submeter pra aprovação</b>. Só a Diretoria aprova ou recusa; aprovando, o contrato já sai preenchido automaticamente (modelo oficial + dados daqui) — mas o <b>envio pro cliente é sempre um clique separado</b>, ninguém manda nada sozinho. Os campos &quot;por extenso&quot; (duração, pax, valor) vão direto pro texto do contrato — confira antes de submeter.</Nota>
              <CotacaoForm editando={cotEditando} tarefas={tarefas} diretoria={diretoria} aoSalvar={aoMudar} aoCancelar={() => setCotEditando(null)} aoMudarTarefas={recarregar} />
              <CotacoesLista cotacoes={cotacoes} diretoria={diretoria} aoEditar={setCotEditando} aoMudar={aoMudar} recarregar={recarregar} />
            </>
          ) : (
            <>
              <Nota><b>Eventos privados/corporativos</b> — festa fechada, casamento, corporativo, com contrato e sinal. Separado da Reserva de mesa do dia a dia, que continua na aba Reservas.</Nota>
              <IndicadoresEventos eventos={eventos} cotacoes={cotacoes} recarregar={recarregar} />
              <TarefasHoje tarefas={tarefas} eventos={eventos} recarregar={recarregar} />
              <EventoForm editando={editando} tarefas={tarefas} fechamentos={fechamentosDe(dados, "eventos")} diretoria={diretoria} aoSalvar={() => { setEditando(null); aoMudar(); }} aoCancelar={() => setEditando(null)} aoMudarTarefas={recarregar} />
              <FecharMes area="eventos" dados={dados} diretoria={diretoria} aoSalvar={recarregar} />
              <EventosLista eventos={eventos} aoEditar={setEditando} aoMudar={aoMudar} recarregar={recarregar} />
              <PacotesPdf />
            </>
          )}
        </div>
      </div>
    </>
  );
}
