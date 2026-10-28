"use client";

import { useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { CONTEUDO } from "./conteudo";
import { PainelConteudo } from "./PainelConteudo";
import { GRUPO_LABEL, PAGINAS, type Pagina } from "./paginas";
import { useBiLive, type BiLiveData } from "./useBiLive";
import { avisoDre } from "./dreValor";
import { avisoZig } from "./zigValor";

function FaixaAoVivo({ data }: { data: BiLiveData | null }) {
  const itens = [
    ["Reservas hoje", data?.hoje.reservas ?? 0],
    ["Pessoas hoje", data?.hoje.pessoas ?? 0],
    ["Check-ins", data?.hoje.checkins ?? 0],
    ["Convidados", data?.hoje.convidados ?? 0],
    ["Agenda em 30 dias", data?.agenda?.reservas ?? 0],
    ["Reservas no mês", data?.mes?.reservas ?? 0],
  ] as const;
  const ultimo = data?.ultimoDia;
  return (
    <div className="sjFaixa">
      <div className="sjGrid">
        {itens.map(([label, value]) => (
          <article key={label} className="sjCard">
            <small>{label}</small>
            <div className="v"><AnimatedNumber value={value} /></div>
            <span className="sjTag real">banco</span>
          </article>
        ))}
      </div>
      {ultimo && (data?.hoje.reservas ?? 0) === 0 ? (
        <p className="sjSub">Último dia com reserva no banco: {ultimo.data} · {ultimo.reservas} reserva · {ultimo.pessoas} pessoas.</p>
      ) : null}
    </div>
  );
}

export function BiShell() {
  const { data, error, connected, freshIds, reload } = useBiLive();
  const [paginaId, setPaginaId] = useState(PAGINAS[0].id);
  const [subId, setSubId] = useState(CONTEUDO[PAGINAS[0].id]?.[0]?.id ?? "principal");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    setores: true,
    eventos: true,
    docs: false,
  });

  const pagina = PAGINAS.find((item) => item.id === paginaId) ?? PAGINAS[0];

  function abrir(item: Pagina) {
    setPaginaId(item.id);
    setSubId(CONTEUDO[item.id]?.[0]?.id ?? "principal");
  }

  const grupos = ["topo", "setores", "eventos", "meio", "docs", "fim"] as const;

  return (
    <div className="sjbi">
      <a className="sjSkip" href="#bi-conteudo">Pular para o conteúdo</a>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap"
      />
      <header className="sjHead">
        <div>
          <h1>Seu Justino BI</h1>
          <p className="sjSub">
            O que já está no banco aparece na hora. A planilha só entra depois que o servidor grava a cópia.
          </p>
          {avisoZig(data?.zig) ? <p className="sjAlerta">{avisoZig(data?.zig)}</p> : null}
          {avisoDre(data?.dre) && avisoDre(data?.dre) !== avisoZig(data?.zig) ? <p className="sjAlerta">{avisoDre(data?.dre)}</p> : null}
        </div>
        <p className="sjLive">
          <span className={`sjDot ${connected ? "on" : ""}`} />
          {connected ? "Ao vivo" : "Reconectando"}
          {error ? <button type="button" onClick={reload}>Tentar de novo</button> : null}
        </p>
      </header>
      <div className="sjBody">
        <nav className="sjSide" aria-label="Menus do BI">
          {grupos.map((grupo) => {
            const itens = PAGINAS.filter((item) => item.grupo === grupo);
            const titulo = GRUPO_LABEL[grupo];
            const botoes = itens.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sjItem ${item.id === pagina.id ? "on" : ""}`}
                onClick={() => abrir(item)}
              >
                {item.label}
              </button>
            ));
            if (!titulo) return <div key={grupo}>{botoes}</div>;
            return (
              <div key={grupo} className={`sjGroup ${abertos[grupo] ? "open" : ""}`}>
                <button
                  type="button"
                  className="sjGroupHead"
                  onClick={() => setAbertos((atual) => ({ ...atual, [grupo]: !atual[grupo] }))}
                >
                  {titulo}
                  <span className="sjCaret" aria-hidden="true">▾</span>
                </button>
                <div className="sjKids">{botoes}</div>
              </div>
            );
          })}
        </nav>
        <main id="bi-conteudo" className="sjMain">
          {pagina.id === "master" || pagina.id === "reservas" ? (
            <div key={pagina.id} className="sjStage">
              <FaixaAoVivo data={data} />
            </div>
          ) : null}
          <PainelConteudo
            paginaId={pagina.id}
            subId={subId}
            onSub={setSubId}
            live={data}
            freshIds={freshIds}
          />
        </main>
      </div>
    </div>
  );
}
