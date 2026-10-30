"use client";

import type { DadosPlanilha } from "../usePlanilha";
import { analiseLinhas } from "./analiseTexto";
import { GraficoLinha } from "./GraficoLinha";
import { pontosDre } from "./series";

const MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function mensagemErro(resp: { error?: string; termo?: string; rotulosDisponiveis?: string[] } | null) {
  if (!resp) return "Não consegui carregar o histórico da DRE agora.";
  if (resp.error === "linha_nao_achada") return `Não achei a linha "${resp.termo ?? ""}" na DRE — confira o nome dessa linha na planilha.`;
  if (resp.error === "config_faltando") return "Integração com a DRE (SharePoint) ainda não configurada.";
  return "Não consegui carregar o histórico da DRE agora.";
}

/** Card "Faturamento histórico (DRE) — mês a mês" (getDreFaturamentoHistorico). */
export function HistoricoDre({ dados, onSalvo, forcar }: { dados: DadosPlanilha; onSalvo: () => void; forcar: number }) {
  const { resp, serie } = pontosDre(dados);
  const rotulos = serie.map((item) => `${MES_ABREV[Number(item.mes.slice(5, 7)) - 1]}/${item.mes.slice(2, 4)}`);
  const valores = serie.map((item) => item.valor);
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Faturamento histórico (DRE) — mês a mês</h3>
        <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>
      </div>
      <p className="sjNote">
        Faturamento bruto mensal, direto da DRE (SharePoint) — cobre todo o período que a planilha tiver. O robô ZigPay só captura dia a dia desde 22/09/2026, por isso o histórico mais antigo vem daqui, não da captura automática.
        {serie.length >= 2 ? <span className="sjMini"> Período disponível: {serie[0].label} a {serie[serie.length - 1].label}.</span> : null}
      </p>
      {!resp || !resp.ok ? (
        <>
          <p className="sjMini">{mensagemErro(resp)}</p>
          {resp?.error === "linha_nao_achada" && resp.rotulosDisponiveis?.length ? (
            <p className="sjMini">Linhas encontradas na planilha (primeiras {resp.rotulosDisponiveis.length}): {resp.rotulosDisponiveis.join(" • ")}</p>
          ) : null}
        </>
      ) : serie.length < 2 ? (
        <p className="sjMini">Histórico insuficiente na DRE ainda.</p>
      ) : (
        <GraficoLinha
          rotulos={rotulos}
          series={[{ nome: "Faturamento bruto (DRE)", cor: "#34d399", area: true, valores }]}
          aria="Faturamento bruto mensal da DRE"
          analise={analiseLinhas(rotulos, [{ name: "Faturamento bruto (DRE)", values: valores }]).join(" ")}
          forcar={forcar}
        />
      )}
    </section>
  );
}
