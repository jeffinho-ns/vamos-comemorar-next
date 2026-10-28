"use client";

import { useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { CONTEUDO, type BlocoConteudo } from "./conteudo";
import { ehNota } from "./mockValor";
import type { BiLiveData, BiRecente } from "./useBiLive";
import { GraficoFaturamento, BarrasCusto } from "./GraficoDiretoria";
import { TabelaAlertasDre, TabelaCustoDre } from "./DreTabelas";
import { FontesNovas } from "./FontesNovas";
import { campoDre, type DreAoVivo } from "./dreValor";
import { campoZig, type ZigAoVivo } from "./zigValor";

const INSIGHT: Record<string, string> = {
  Segunda: "Noite mais curta. Exemplo: reserva de aniversário em mesa menor e atração acústica no primeiro horário.",
  Terça: "Fluxo parecido com segunda. Exemplo: combo de happy hour e post de bastidor no fim da tarde.",
  Quarta: "Meio de semana pede motivo pra sair. Exemplo: voz e violão cedo e divulgação na terça.",
  Quinta: "A casa enche mais tarde. Exemplo: banda a partir das 21h e reserva com antecedência no Instagram.",
  Sexta: "Pico da semana. Exemplo: fila controlada, mesas grandes e Reels de samba no mesmo dia.",
  Sábado: "Maior público. Exemplo: dois horários de atração e pacote de aniversário com sinal.",
  Domingo: "Almoço e início da noite. Exemplo: feijoada, família e encerramento mais cedo.",
};

function celulaReserva(coluna: string, row: BiRecente, quando: string) {
  const c = coluna.toLowerCase();
  if (c.includes("data")) return quando;
  if (c.includes("cliente") || c.includes("nome")) return row.nome;
  if (c.includes("pax") || c.includes("pessoa")) return String(row.pessoas);
  if (c.includes("tipo") || c.includes("status")) return row.status;
  if (c.includes("hora")) return row.hora || "—";
  if (c.includes("observ")) return row.checkedIn ? "Check-in feito" : "—";
  if (c.includes("enviado")) return "Agilizai";
  return "—";
}

function ValorReal({ valor, tipo, texto }: { valor: number | null; tipo: "money" | "pct" | "texto"; texto: string | null }) {
  if (tipo === "texto") return texto || "—";
  if (valor == null) return "—";
  return <AnimatedNumber value={valor} kind={tipo === "pct" ? "pct" : "money"} />;
}

function Aguardando() {
  return (
    <>
      <div className="v">—</div>
      <span className="sjTag">aguardando</span>
    </>
  );
}

function Indicador({
  paginaId,
  campo,
  zig,
  dre,
}: {
  paginaId: string;
  campo: string;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
}) {
  const real = campoZig(paginaId, campo, zig);
  const planilha = campoDre(paginaId, campo, dre, zig?.faturamentoMes);
  return (
    <article className="sjCard">
      <small>{campo}</small>
      {real ? (
        <>
          <div className="v"><ValorReal valor={real.valor} tipo={real.tipo === "pct" ? "pct" : "money"} texto={null} /></div>
          {real.detalhe ? <p className="sjMini">{real.detalhe}</p> : null}
          <span className={`sjTag ${real.pronto ? "real" : ""}`}>{real.pronto ? "zig" : "aguardando"}</span>
        </>
      ) : planilha ? (
        <>
          <div className="v"><ValorReal valor={planilha.valor} tipo={planilha.tipo} texto={planilha.texto} /></div>
          {planilha.detalhe ? <p className="sjMini">{planilha.detalhe}</p> : null}
          <span className={`sjTag ${planilha.pronto ? "real" : ""}`}>{planilha.pronto ? "dre" : "aguardando"}</span>
        </>
      ) : <Aguardando />}
    </article>
  );
}

function DiasSemana({ campos }: { campos: string[] }) {
  const [dia, setDia] = useState(campos[0] ?? "Quinta");
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
        <p className="sjInsight">{INSIGHT[dia] ?? "Leitura de exemplo deste dia, pronta pra trocar pelo texto real."}</p>
        <div className="sjCampos">
          {["Público médio", "Ticket médio", "Faturamento médio"].map((campo) => (
            <div key={campo} className="sjCampo">
              <small>{campo}</small>
              <div className="v">—</div>
            </div>
          ))}
        </div>
      </div>
      <span className="sjTag">aguardando</span>
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

function etiquetaBloco(paginaId: string, campos: string[], temTabela: boolean, listaReservas: boolean, aoVivo: { linhas: BiRecente[] } | null, zig: ZigAoVivo | null, dre: DreAoVivo | null, titulo: string) {
  if (listaReservas) return aoVivo?.linhas.length ? "banco" : "aguardando";
  if (titulo === "Custo por categoria" || titulo === "Alertas Financeiro") return dre?.disponivel ? "dre" : "aguardando";
  const comFonte = campos.some((campo) => campoZig(paginaId, campo, zig) || campoDre(paginaId, campo, dre, zig?.faturamentoMes));
  const semFonte = campos.some((campo) => !campoZig(paginaId, campo, zig) && !campoDre(paginaId, campo, dre, zig?.faturamentoMes));
  if (!comFonte && (semFonte || temTabela)) return "aguardando";
  return null;
}

function Bloco({
  paginaId,
  bloco,
  aoVivo,
  zig,
  dre,
}: {
  paginaId: string;
  bloco: BlocoConteudo;
  aoVivo: { quando: string; linhas: BiRecente[]; freshIds: number[] } | null;
  zig: ZigAoVivo | null;
  dre: DreAoVivo | null;
}) {
  const opcoes = bloco.seletor ?? [];
  const [escolha, setEscolha] = useState(opcoes[0] ?? "");
  if (bloco.titulo === "Por dia da semana") return <DiasSemana campos={bloco.campos} />;
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
              const real = campoZig(paginaId, campo, zig);
              const planilha = campoDre(paginaId, campo, dre, zig?.faturamentoMes);
              return (
                <div key={campo} className="sjCampo">
                  <small>{campo}</small>
                  {real ? (
                    <>
                      <div className="v"><ValorReal valor={real.valor} tipo={real.tipo === "pct" ? "pct" : "money"} texto={null} /></div>
                      {real.detalhe ? <p className="sjMini">{real.detalhe}</p> : null}
                      <span className={`sjTag ${real.pronto ? "real" : ""}`}>{real.pronto ? "zig" : "aguardando"}</span>
                    </>
                  ) : planilha ? (
                    <>
                      <div className="v"><ValorReal valor={planilha.valor} tipo={planilha.tipo} texto={planilha.texto} /></div>
                      {planilha.detalhe ? <p className="sjMini">{planilha.detalhe}</p> : null}
                      <span className={`sjTag ${planilha.pronto ? "real" : ""}`}>{planilha.pronto ? "dre" : "aguardando"}</span>
                    </>
                  ) : <Aguardando />}
                </div>
              );
            })}
          </div>
        ) : null}
        {bloco.titulo === "Custo por categoria" ? <TabelaCustoDre dre={dre} /> : null}
        {bloco.titulo === "Alertas Financeiro" ? <TabelaAlertasDre dre={dre} faturamento={zig?.faturamentoMes ?? null} /> : null}
        {bloco.titulo === "Custo por categoria" || bloco.titulo === "Alertas Financeiro" ? null : tabelasVisiveis.map((tabela) => (
          listaReservas ? (
            <TabelaBanco key={tabela.colunas.join("|")} colunas={tabela.colunas} aoVivo={aoVivo} />
          ) : (
            <p key={tabela.colunas.join("|")} className="sjMini">Ainda sem cópia no banco.</p>
          )
        ))}
        {(() => {
          const etiqueta = etiquetaBloco(paginaId, campos, tabelasVisiveis.length > 0 && !listaReservas, listaReservas, aoVivo, zig, dre, bloco.titulo);
          if (!etiqueta) return null;
          return <span className={`sjTag ${etiqueta === "aguardando" ? "" : "real"}`}>{etiqueta}</span>;
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
              ? <BarrasCusto key={bloco.titulo} custos={zig?.custos || []} carregando={Boolean(zig?.zigCarregando)} />
              : bloco.titulo === "Indicadores" || bloco.titulo === "📊 Indicadores de Eventos"
            ? bloco.campos.map((campo) => (
              <Indicador key={campo} paginaId={paginaId} campo={campo} zig={zig} dre={dre} />
            ))
            : <Bloco key={bloco.titulo} paginaId={paginaId} bloco={bloco} aoVivo={aoVivo} zig={zig} dre={dre} />
        ))}
      </div>
      </div>
    </>
  );
}
