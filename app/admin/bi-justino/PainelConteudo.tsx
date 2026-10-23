"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { CONTEUDO, type BlocoConteudo } from "./conteudo";
import { baseNumero, chaveCampo, ehNota, textoMock, tipoCampo, type TipoNumero } from "./mockValor";
import type { BiLiveData, BiRecente } from "./useBiLive";

const INSIGHT: Record<string, string> = {
  Segunda: "Noite mais curta. Exemplo: reserva de aniversário em mesa menor e atração acústica no primeiro horário.",
  Terça: "Fluxo parecido com segunda. Exemplo: combo de happy hour e post de bastidor no fim da tarde.",
  Quarta: "Meio de semana pede motivo pra sair. Exemplo: voz e violão cedo e divulgação na terça.",
  Quinta: "A casa enche mais tarde. Exemplo: banda a partir das 21h e reserva com antecedência no Instagram.",
  Sexta: "Pico da semana. Exemplo: fila controlada, mesas grandes e Reels de samba no mesmo dia.",
  Sábado: "Maior público. Exemplo: dois horários de atração e pacote de aniversário com sinal.",
  Domingo: "Almoço e início da noite. Exemplo: feijoada, família e encerramento mais cedo.",
};

function numeroDe(label: string, drift: number) {
  const tipo = tipoCampo(label);
  if (tipo === "texto" || tipo === "data") return null;
  const base = baseNumero(label, tipo);
  const valor = Math.max(0, base + drift);
  return tipo === "pct" ? Math.min(100, valor) : valor;
}

function CelulaNumero({ label, driftId, drift }: { label: string; driftId: string; drift: Record<string, number> }) {
  const tipo = tipoCampo(label);
  const valor = numeroDe(label, drift[driftId] || 0);
  if (valor == null || tipo === "texto" || tipo === "data") return textoMock(label);
  return <AnimatedNumber value={valor} kind={tipo as TipoNumero} />;
}

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

function Indicador({ campo, blocoTitulo, drift }: { campo: string; blocoTitulo: string; drift: Record<string, number> }) {
  const id = chaveCampo(blocoTitulo, campo);
  const tipo = tipoCampo(campo);
  const valor = numeroDe(campo, drift[id] || 0);
  return (
    <article className="sjCard">
      <small>{campo}</small>
      <div className="v">
        {valor == null || tipo === "texto" || tipo === "data" ? textoMock(campo) : <AnimatedNumber value={valor} kind={tipo as TipoNumero} />}
      </div>
      <span className="sjTag">simulado</span>
    </article>
  );
}

function DiasSemana({ campos, drift }: { campos: string[]; drift: Record<string, number> }) {
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
      <p className="sjInsight">{INSIGHT[dia] ?? "Leitura de exemplo deste dia, pronta pra trocar pelo texto real."}</p>
      <div className="sjCampos">
        {["Público médio", "Ticket médio", "Faturamento médio"].map((campo) => (
          <div key={campo} className="sjCampo">
            <small>{campo}</small>
            <div className="v">
              <CelulaNumero label={`${dia} ${campo}`} driftId={chaveCampo(dia, campo)} drift={drift} />
            </div>
          </div>
        ))}
      </div>
      <span className="sjTag">simulado</span>
    </section>
  );
}

function TabelaMock({
  baseId,
  colunas,
  drift,
  aoVivo,
}: {
  baseId: string;
  colunas: string[];
  drift: Record<string, number>;
  aoVivo: { quando: string; linhas: BiRecente[]; freshIds: number[] } | null;
}) {
  const linhas = [0, 1, 2];
  return (
    <div className="sjTableInner">
      <table>
        <thead>
          <tr>{colunas.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {aoVivo && aoVivo.linhas.length
            ? aoVivo.linhas.map((row) => (
              <tr key={row.id} className={aoVivo.freshIds.includes(row.id) ? "is-fresh" : undefined}>
                {colunas.map((col) => {
                  const c = col.toLowerCase();
                  const texto = celulaReserva(col, row, aoVivo.quando);
                  return (
                    <td key={col}>
                      {c.includes("pax") || c.includes("pessoa") ? <AnimatedNumber value={row.pessoas} /> : texto}
                    </td>
                  );
                })}
              </tr>
            ))
            : linhas.map((linha) => (
              <tr key={linha}>
                {colunas.map((col, indice) => (
                  <td key={col}>
                    <CelulaNumero label={`${col} ${linha}`} driftId={`t:${baseId}:${indice}:${linha}`} drift={drift} />
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Bloco({
  bloco,
  drift,
  aoVivo,
}: {
  bloco: BlocoConteudo;
  drift: Record<string, number>;
  aoVivo: { quando: string; linhas: BiRecente[]; freshIds: number[] } | null;
}) {
  const opcoes = bloco.seletor ?? [];
  const [escolha, setEscolha] = useState(opcoes[0] ?? "");
  if (bloco.titulo === "Por dia da semana") return <DiasSemana campos={bloco.campos} drift={drift} />;
  const baseId = opcoes.length ? `${bloco.titulo}:${escolha}` : bloco.titulo;
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
      {notas.length ? (
        <div className="sjNotas">
          {notas.map((nota) => <p key={nota} className="sjNota">{nota}</p>)}
        </div>
      ) : null}
      {campos.length ? (
        <div className="sjCampos">
          {campos.map((campo) => (
            <div key={campo} className="sjCampo">
              <small>{campo}</small>
              <div className="v">
                <CelulaNumero label={campo} driftId={chaveCampo(baseId, campo)} drift={drift} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {tabelasVisiveis.map((tabela) => (
        <TabelaMock
          key={tabela.colunas.join("|")}
          baseId={baseId}
          colunas={tabela.colunas}
          drift={drift}
          aoVivo={listaReservas ? aoVivo : null}
        />
      ))}
      <span className={`sjTag ${listaReservas && aoVivo?.linhas.length ? "real" : ""}`}>
        {listaReservas && aoVivo?.linhas.length ? "banco" : "simulado"}
      </span>
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
  const [drift, setDrift] = useState<Record<string, number>>({});

  const chaves = useMemo(() => {
    if (!aba) return [];
    const ids: string[] = [];
    for (const bloco of aba.blocos) {
      const selecoes = bloco.seletor?.length ? bloco.seletor : [""];
      for (const sel of selecoes) {
        const base = sel ? `${bloco.titulo}:${sel}` : bloco.titulo;
        for (const campo of bloco.campos) {
          if (numeroDe(campo, 0) != null) ids.push(chaveCampo(base, campo));
        }
        for (const tabela of bloco.tabelas ?? []) {
          tabela.colunas.forEach((col, indice) => {
            if (numeroDe(col, 0) == null) return;
            for (let linha = 0; linha < 3; linha += 1) ids.push(`t:${base}:${indice}:${linha}`);
          });
        }
      }
      if (bloco.titulo === "Por dia da semana") {
        for (const dia of bloco.campos) {
          for (const campo of ["Público médio", "Ticket médio", "Faturamento médio"]) {
            ids.push(chaveCampo(dia, campo));
          }
        }
      }
    }
    return ids;
  }, [aba]);

  useEffect(() => {
    if (!chaves.length) return undefined;
    const timer = window.setInterval(() => {
      setDrift((atual) => {
        const proximo = { ...atual };
        for (const id of chaves) {
          proximo[id] = (proximo[id] || 0) + Math.round((Math.random() - 0.35) * 3);
        }
        return proximo;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [chaves]);

  if (!aba) return null;

  const quando = live?.recentesEm === "hoje" ? "Hoje" : (live?.recentesEm ?? "—");
  const aoVivo = {
    quando,
    linhas: live?.recentes ?? [],
    freshIds,
  };

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
      <div className="sjGrid">
        {aba.blocos.map((bloco) => (
          bloco.titulo === "Indicadores" || bloco.titulo === "📊 Indicadores de Eventos"
            ? bloco.campos.map((campo) => <Indicador key={campo} campo={campo} blocoTitulo={bloco.titulo} drift={drift} />)
            : <Bloco key={bloco.titulo} bloco={bloco} drift={drift} aoVivo={aoVivo} />
        ))}
      </div>
    </>
  );
}
