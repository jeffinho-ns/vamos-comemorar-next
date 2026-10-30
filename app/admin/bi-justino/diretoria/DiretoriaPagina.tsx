"use client";

import { useCallback, useMemo } from "react";
import { DuvidasBox } from "../marketing/DuvidasBox";
import { lerOverview, lerZig } from "../marketing/espelhoDados";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { usePlanilha } from "../usePlanilha";
import { consolidar, consolidadoPronto, AREA_DE_CUSTO, CHAVES_CUSTO, LABEL_AREA } from "./consolidado";
import { DiretoriaAdministracao } from "./DiretoriaAdministracao";
import { DiretoriaKpis } from "./DiretoriaKpis";
import { AlertasDiretoriaEspelho, AprovacoesPendentes, ProjecaoConsolidadaEspelho, ResponsabilidadeEspelho } from "./DiretoriaQuadrosEspelho";
import { alertasDiretoria, CHAVES_DIRETORIA, eventosRealizados, pendentesAuditoria } from "./diretoriaCalculo";
import { CustoPorArea, GraficoFaturamentoDiretoria } from "./GraficoFaturamentoDiretoria";

/** Página Diretoria (master) montada a partir do espelho da planilha, igual ao painel do Renato. */
export const PRONTA = true;

const CHAVES = [...CHAVES_DIRETORIA];

export function DiretoriaPagina({ onSalvo }: PaginaEspelhoProps) {
  const { dados, erro, carregando, recarregar } = usePlanilha(CHAVES);
  const salvo = useCallback(() => {
    recarregar();
    onSalvo();
  }, [recarregar, onSalvo]);
  const zig = useMemo(() => lerZig(dados), [dados]);
  const overview = useMemo(() => lerOverview(dados), [dados]);
  const pronto = consolidadoPronto(dados);
  const consolidado = useMemo(() => (pronto ? consolidar(dados) : null), [dados, pronto]);
  const pendentes = useMemo(() => pendentesAuditoria(dados), [dados]);
  const alertas = useMemo(() => (consolidado ? alertasDiretoria(consolidado, pendentes) : []), [consolidado, pendentes]);
  const eventos = useMemo(() => eventosRealizados(dados), [dados]);
  const custos = consolidado ? CHAVES_CUSTO.map((k) => ({ label: LABEL_AREA[AREA_DE_CUSTO[k]], value: consolidado.actual[k] || 0 })) : [];
  const aguardando = carregando || !pronto;

  return (
    <div className="sjStage">
      <div className="sjGrid">
        {erro ? <p className="sjAlert r">{erro}</p> : null}
        <DuvidasBox area="diretoria" dados={dados} onSalvo={salvo} />
      </div>
      <DiretoriaKpis o={overview} c={consolidado} zig={zig} carregando={aguardando} />
      <div className="sjGrid">
        <GraficoFaturamentoDiretoria zig={zig} eventosDia={eventos.porDia} eventosMes={eventos.porMes} />
        <CustoPorArea itens={custos} carregando={aguardando} />
        <ProjecaoConsolidadaEspelho c={consolidado} onAtualizar={salvo} />
        <AlertasDiretoriaEspelho alertas={alertas} carregando={aguardando} />
        <AprovacoesPendentes itens={pendentes} carregando={aguardando && !dados["getAuditoriaOpItens"]} onSalvo={salvo} />
        <ResponsabilidadeEspelho c={consolidado} />
        <section className="sjCard sjBloco">
          <p className="sjNota"><b>Metodologia:</b> custos externos à área permanecem ancorados na média histórica e, quando pertinente, escalam por faturamento. Custos realmente fixos permanecem fixos; custos percentuais acompanham receita; custos semi-fixos usam uma referência saudável por faixa de faturamento. O objetivo é medir o efeito controlável de cada gestor sem atribuir a ele despesas que não controla. <b>Bônus projetado</b> só aparece pra quem tem acesso de administrador no BI — ele depende de salário-base, que é dado sensível.</p>
        </section>
        <DiretoriaAdministracao dados={dados} onAtualizar={salvo} />
      </div>
    </div>
  );
}
