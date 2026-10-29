"use client";

import { useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { CONTEUDO, type BlocoConteudo } from "./conteudo";
import { ehNota } from "./mockValor";
import type { BiLiveData, BiRecente } from "./useBiLive";
import { GraficoFaturamento, BarrasCusto } from "./GraficoDiretoria";
import { AlertasDiretoria, ProjecaoConsolidada, ResponsabilidadeArea } from "./DiretoriaQuadros";
import { TabelaAlertasDre, TabelaCustoDre } from "./DreTabelas";
import { FontesNovas } from "./FontesNovas";
import { type DreAoVivo } from "./dreValor";
import { porDiaDaSemana, type ZigAoVivo } from "./zigValor";
import { campoPainel } from "./campoPainel";
import { ehLancamento, temQuadroLido, TabelaQuadro } from "./quadroLido";
import {
  TabelaCmvAlerta,
  TabelaEventos,
  TabelaFicha,
  TabelaHistoricoDre,
  TabelaHorario,
  TabelaLancamentos,
  TabelaPadraoSemanal,
  TabelaQuadroSemana,
  TabelaSemanas,
  celulaReserva,
  temTabelaReal,
} from "./tabelasReais";

const INSIGHT: Record<string, string> = {
  Segunda: "Noite mais curta. Exemplo: reserva de aniversário em mesa menor e atração acústica no primeiro horário.",
  Terça: "Fluxo parecido com segunda. Exemplo: combo de happy hour e post de bastidor no fim da tarde.",
  Quarta: "Meio de semana pede motivo pra sair. Exemplo: voz e violão cedo e divulgação na terça.",
  Quinta: "A casa enche mais tarde. Exemplo: banda a partir das 21h e reserva com antecedência no Instagram.",
  Sexta: "Pico da semana. Exemplo: fila controlada, mesas grandes e Reels de samba no mesmo dia.",
  Sábado: "Maior público. Exemplo: dois horários de atração e pacote de aniversário com sinal.",
  Domingo: "Almoço e início da noite. Exemplo: feijoada, família e encerramento mais cedo.",
};

function ValorReal({
  valor,
  tipo,
  texto,
}: {
  valor: number | null;
  tipo: "money" | "pct" | "texto" | "int";
  texto: string | null;
}) {
  if (tipo === "texto") return texto || "—";
  if (valor == null) return "—";
  if (tipo === "int") return <AnimatedNumber value={valor} />;
  return <AnimatedNumber value={valor} kind={tipo === "pct" ? "pct" : "money"} />;
}

function selo(pronto: boolean, origem: string, motivo?: string | null) {
  if (pronto) return origem;
  if (motivo === "credenciais_ausentes") return "sem login";
  if (motivo === "login_recusado" || motivo === "forbidden") return "recusado";
  if (motivo === "aguardando_coleta") return "gravando";
  return "falhou";
}

function Aguardando() {
  return (
    <>
      <div className="v">—</div>
      <span className="sjTag">sem fonte</span>
    </>
  );
}

function Indicador({
  paginaId,
  campo,
  zig,
  dre,
  live,
}: {
  paginaId: string;
  campo: string;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
  live: BiLiveData | null;
}) {
  const real = campoPainel(paginaId, campo, zig, dre, live);
  return (
    <article className="sjCard">
      <small>{campo}</small>
      {real ? (
        <>
          <div className="v"><ValorReal valor={real.valor} tipo={real.tipo} texto={real.texto} /></div>
          {real.detalhe ? <p className="sjMini">{real.detalhe}</p> : null}
          <span className={`sjTag ${real.pronto ? "real" : ""}`}>{selo(real.pronto, real.origem, real.origem === "zig" ? zig?.motivo : dre?.motivo)}</span>
        </>
      ) : <Aguardando />}
    </article>
  );
}

function DiasSemana({ campos, zig }: { campos: string[]; zig: ZigAoVivo | null }) {
  const [dia, setDia] = useState(campos[0] ?? "Quinta");
  const leitura = porDiaDaSemana(zig).find((item) => item.nome === dia);
  const temDia = Boolean(leitura && leitura.dias);
  return (
    <section className="sjCard sjBloco">
      <h3>Por dia da semana</h3>
      <div className="sjDias">
        {campos.map((nome) => (
          <button key={nome} type="button" className={nome === dia ? "on" : ""} onClick={() => setDia(nome)}>
            {nome}
          </button>
        ))}
      </div>
      <div key={dia} className="sjSwap">
        <p className="sjInsight">
          {temDia
            ? `${dia}: média de ${leitura?.dias} dia(s) neste mês na ZigPay.`
            : (INSIGHT[dia] ?? "Ainda sem faturamento deste dia no mês.")}
        </p>
        <div className="sjCampos">
          <div className="sjCampo">
            <small>Público médio</small>
            <div className="v">{leitura?.publicoMedio == null ? "—" : <AnimatedNumber value={leitura.publicoMedio} />}</div>
          </div>
          <div className="sjCampo">
            <small>Ticket médio</small>
            <div className="v">{leitura?.ticketMedio == null ? "—" : <AnimatedNumber value={leitura.ticketMedio} kind="money" />}</div>
          </div>
          <div className="sjCampo">
            <small>Faturamento médio</small>
            <div className="v">{leitura?.faturamentoMedio == null ? "—" : <AnimatedNumber value={leitura.faturamentoMedio} kind="money" />}</div>
          </div>
        </div>
      </div>
      <span className={`sjTag ${temDia ? "real" : ""}`}>{temDia ? "zig" : "sem fonte"}</span>
    </section>
  );
}

function TabelaBanco({
  colunas,
  aoVivo,
}: {
  colunas: string[];
  aoVivo: { quando: string; linhas: BiRecente[]; freshIds: number[] } | null;
}) {
  const linhas = aoVivo?.linhas ?? [];
  return (
    <div className="sjTableInner">
      <table>
        <thead>
          <tr>{colunas.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.length ? linhas.map((row) => (
            <tr key={row.id} className={aoVivo?.freshIds.includes(row.id) ? "is-fresh" : undefined}>
              {colunas.map((col) => {
                const c = col.toLowerCase();
                const texto = celulaReserva(col, row, aoVivo?.quando || "—");
                return (
                  <td key={col}>
                    {c.includes("pax") || c.includes("pessoa") ? <AnimatedNumber value={row.pessoas} /> : texto}
                  </td>
                );
              })}
            </tr>
          )) : (
            <tr><td colSpan={colunas.length}>Ainda sem cópia no banco.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function etiquetaBloco(
  paginaId: string,
  campos: string[],
  temTabela: boolean,
  listaReservas: boolean,
  aoVivo: { linhas: BiRecente[] } | null,
  zig: ZigAoVivo | null,
  dre: DreAoVivo | null,
  live: BiLiveData | null,
  titulo: string,
) {
  if (listaReservas) return aoVivo?.linhas.length ? "banco" : "sem fonte";
  if (titulo === "Custo por categoria" || titulo === "Alertas Financeiro") return dre?.disponivel ? "dre" : selo(false, "dre", dre?.motivo);
  if (temTabelaReal(titulo)) return zig?.disponivel ? "zig" : live?.hoje ? "banco" : "sem fonte";
  const comFonte = campos.some((campo) => campoPainel(paginaId, campo, zig, dre, live));
  const semFonte = campos.some((campo) => !campoPainel(paginaId, campo, zig, dre, live));
  if (!comFonte && (semFonte || temTabela)) return "sem fonte";
  return null;
}

function TabelasDoBloco({
  titulo,
  escolha,
  zig,
  dre,
  live,
}: {
  titulo: string;
  escolha: string;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
  live: BiLiveData | null;
}) {
  if (/quadro geral da semana/i.test(titulo)) return <TabelaQuadroSemana live={live} />;
  if (/padrão semanal/i.test(titulo)) return <TabelaPadraoSemanal zig={zig} />;
  if (/ticket médio semanal/i.test(titulo)) return <TabelaSemanas zig={zig} />;
  if (/venda por horário/i.test(titulo)) return <TabelaHorario zig={zig} escolha={escolha} />;
  if (/eventos cadastrados/i.test(titulo)) return <TabelaEventos zig={zig} />;
  if (/ficha técnica/i.test(titulo)) return <TabelaFicha zig={zig} />;
  if (/alertas • comida/i.test(titulo)) return <TabelaCmvAlerta zig={zig} tipo="comida" />;
  if (/alertas • bebida/i.test(titulo)) return <TabelaCmvAlerta zig={zig} tipo="bebida" />;
  if (/faturamento histórico \(dre\)/i.test(titulo)) return <TabelaHistoricoDre dre={dre} />;
  if (/últimos envios • financeiro/i.test(titulo)) {
    return <TabelaLancamentos zig={zig} area="financeiro" colunas={["Data", "Faturamento", "Impostos", "Cartão", "Aluguel"]} chaves={["date", "fnRevenueInput", "fnTax", "fnCard", "fnRent"]} />;
  }
  if (/últimos envios • marketing/i.test(titulo)) {
    return <TabelaLancamentos zig={zig} area="marketing" colunas={["Data", "Tráfego pago", "Atrações", "Outros", "Reservas", "Comparecimento", "Faturamento gerado"]} chaves={["date", "mkTraffic", "mkAttractions", "mkOther", "mkReservas", "mkAttendance", "mkRevenue"]} />;
  }
  if (/últimos envios • operação/i.test(titulo) || /perdas \/ desperdício/i.test(titulo)) {
    return <TabelaLancamentos zig={zig} area="operacao" colunas={["Data", "Público", "Perdas", "Manutenção", "Ocorrências"]} chaves={["date", "opPublico", "opLoss", "opMaintenance", "date"]} />;
  }
  if (/rh estrutural — envios/i.test(titulo)) {
    return <TabelaLancamentos zig={zig} area="rh" colunas={["Mês", "RH estrutural", "Extras", "Colaboradores ativos"]} chaves={["date", "rhCore", "rhExtras", "rhActive"]} />;
  }
  return null;
}

function Bloco({
  paginaId,
  bloco,
  aoVivo,
  zig,
  dre,
  live,
}: {
  paginaId: string;
  bloco: BlocoConteudo;
  aoVivo: { quando: string; linhas: BiRecente[]; freshIds: number[] } | null;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
  live: BiLiveData | null;
}) {
  const opcoes = bloco.seletor ?? [];
  const [escolha, setEscolha] = useState(opcoes[0] ?? "");
  if (bloco.titulo === "Por dia da semana") return <DiasSemana campos={bloco.campos} zig={zig} />;
  if (ehLancamento(bloco.titulo)) {
    return (
      <section className="sjCard sjBloco">
        <h3>{bloco.titulo}</h3>
        <p className="sjNota">Este lançamento continua no painel do Seu Justino. Aqui a tela só mostra leitura já gravada.</p>
      </section>
    );
  }
  const notas = bloco.campos.filter(ehNota);
  const campos = bloco.campos.filter((campo) => !ehNota(campo));
  const listaReservas = /lista de reservas/i.test(bloco.titulo);
  const tabelas = bloco.tabelas ?? [];
  const indiceSeletor = opcoes.indexOf(escolha);
  const tabelasVisiveis = opcoes.length && tabelas.length === opcoes.length
    ? [tabelas[Math.max(0, indiceSeletor)]]
    : tabelas;
  return (
    <section className="sjCard sjBloco">
      <h3>{bloco.titulo}</h3>
      {opcoes.length ? (
        <div className="sjDias">
          {opcoes.map((nome) => (
            <button key={nome} type="button" className={nome === escolha ? "on" : ""} onClick={() => setEscolha(nome)}>
              {nome}
            </button>
          ))}
        </div>
      ) : null}
      <div key={escolha || "fixo"} className={opcoes.length ? "sjSwap" : undefined}>
        {notas.length ? (
          <div className="sjNotas">
            {notas.map((nota) => <p key={nota} className="sjNota">{nota}</p>)}
          </div>
        ) : null}
        {campos.length ? (
          <div className="sjCampos">
            {campos.map((campo) => {
              const real = campoPainel(paginaId, campo, zig, dre, live);
              return (
                <div key={campo} className="sjCampo">
                  <small>{campo}</small>
                  {real ? (
                    <>
                      <div className="v"><ValorReal valor={real.valor} tipo={real.tipo} texto={real.texto} /></div>
                      {real.detalhe ? <p className="sjMini">{real.detalhe}</p> : null}
                      <span className={`sjTag ${real.pronto ? "real" : ""}`}>{selo(real.pronto, real.origem, real.origem === "zig" ? zig?.motivo : dre?.motivo)}</span>
                    </>
                  ) : <Aguardando />}
                </div>
              );
            })}
          </div>
        ) : null}
        {bloco.titulo === "Custo por categoria" ? <TabelaCustoDre dre={dre} /> : null}
        {bloco.titulo === "Alertas Financeiro" ? <TabelaAlertasDre dre={dre} faturamento={zig?.faturamentoMes ?? null} /> : null}
        {bloco.titulo === "Custo por categoria" || bloco.titulo === "Alertas Financeiro" ? null : temQuadroLido(bloco.titulo) ? (
          <TabelaQuadro titulo={bloco.titulo} zig={zig} />
        ) : temTabelaReal(bloco.titulo) ? (
          <TabelasDoBloco titulo={bloco.titulo} escolha={escolha} zig={zig} dre={dre} live={live} />
        ) : tabelasVisiveis.map((tabela) => (
          listaReservas ? (
            <TabelaBanco key={tabela.colunas.join("|")} colunas={tabela.colunas} aoVivo={aoVivo} />
          ) : (
            <p key={tabela.colunas.join("|")} className="sjMini">Ainda sem cópia no banco.</p>
          )
        ))}
        {(() => {
          const etiqueta = etiquetaBloco(paginaId, campos, tabelasVisiveis.length > 0 && !listaReservas, listaReservas, aoVivo, zig, dre, live, bloco.titulo);
          if (!etiqueta) return null;
          const real = etiqueta === "banco" || etiqueta === "dre" || etiqueta === "zig";
          return <span className={`sjTag ${real ? "real" : ""}`}>{etiqueta}</span>;
        })()}
      </div>
    </section>
  );
}

export function PainelConteudo({
  paginaId,
  subId,
  onSub,
  live,
  freshIds,
}: {
  paginaId: string;
  subId: string;
  onSub: (id: string) => void;
  live: BiLiveData | null;
  freshIds: number[];
}) {
  const abas = CONTEUDO[paginaId] ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  if (!aba) return null;

  const quando = live?.recentesEm === "hoje" ? "Hoje" : (live?.recentesEm ?? "—");
  const aoVivo = {
    quando,
    linhas: live?.recentes ?? [],
    freshIds,
  };
  const zig = live?.zig ?? null;
  const dre = live?.dre ?? null;

  return (
    <>
      {abas.length > 1 ? (
        <div className="sjSubs">
          {abas.map((item) => (
            <button key={item.id} type="button" className={item.id === aba.id ? "on" : ""} onClick={() => onSub(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div key={`${paginaId}:${aba.id}`} className="sjStage">
      <div className="sjGrid">
        <FontesNovas paginaId={paginaId} zig={zig} novidades={live?.novidades ?? null} />
        {aba.blocos.map((bloco) => (
          bloco.titulo === "Faturamento"
            ? <GraficoFaturamento key={bloco.titulo} zig={zig} />
            : bloco.titulo === "Custo por área"
              ? <BarrasCusto
                  key={bloco.titulo}
                  custos={
                    zig?.projecao?.areas?.length
                      ? zig.projecao.areas.map((area) => ({ label: area.label || "", valor: area.real || 0 }))
                      : zig?.custos || []
                  }
                  carregando={Boolean(zig?.zigCarregando)}
                />
            : bloco.titulo === "Projeção consolidada do mês (última data enviada por área)"
              ? <ProjecaoConsolidada key={bloco.titulo} zig={zig} />
            : bloco.titulo === "Alertas de diretoria"
              ? <AlertasDiretoria key={bloco.titulo} zig={zig} />
            : bloco.titulo === "Responsabilidade por área e impacto no resultado"
              ? <ResponsabilidadeArea key={bloco.titulo} zig={zig} />
              : bloco.titulo === "Indicadores" || bloco.titulo === "📊 Indicadores de Eventos"
            ? bloco.campos.map((campo) => (
              <Indicador key={campo} paginaId={paginaId} campo={campo} zig={zig} dre={dre} live={live} />
            ))
            : <Bloco key={bloco.titulo} paginaId={paginaId} bloco={bloco} aoVivo={aoVivo} zig={zig} dre={dre} live={live} />
        ))}
      </div>
      </div>
    </>
  );
}
