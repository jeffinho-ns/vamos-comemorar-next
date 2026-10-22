"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { GRUPO_LABEL, PAGINAS, type Kpi, type Pagina, type RealKey } from "./paginas";
import { useBiLive, type BiLiveData } from "./useBiLive";

function realValor(live: BiLiveData | null, key: RealKey) {
  if (!live) return 0;
  if (key === "reservas") return live.hoje.reservas;
  if (key === "pessoas") return live.hoje.pessoas;
  if (key === "checkins") return live.hoje.checkins;
  if (key === "convidados") return live.hoje.convidados ?? 0;
  if (key === "agenda") return live.agenda?.reservas ?? 0;
  if (key === "agendaPessoas") return live.agenda?.pessoas ?? 0;
  return live.mes?.reservas ?? 0;
}

function valorDe(kpi: Kpi, live: BiLiveData | null, drift: number) {
  if (kpi.real) return realValor(live, kpi.real);
  return Math.max(0, kpi.base + drift);
}

export function BiShell() {
  const { data, error, connected, freshIds, reload } = useBiLive();
  const [paginaId, setPaginaId] = useState(PAGINAS[0].id);
  const [subId, setSubId] = useState(PAGINAS[0].subabas[0].id);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    setores: true,
    eventos: true,
    docs: false,
  });
  const [drift, setDrift] = useState<Record<string, number>>({});

  const pagina = PAGINAS.find((item) => item.id === paginaId) ?? PAGINAS[0];
  const sub = pagina.subabas.find((item) => item.id === subId) ?? pagina.subabas[0];

  const mockIds = useMemo(
    () => PAGINAS.flatMap((item) => item.subabas.flatMap((aba) => aba.kpis.filter((kpi) => !kpi.real).map((kpi) => kpi.id))),
    [],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDrift((atual) => {
        const proximo = { ...atual };
        for (const id of mockIds) {
          const passo = Math.round((Math.random() - 0.35) * 3);
          proximo[id] = (proximo[id] || 0) + passo;
        }
        return proximo;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [mockIds]);

  function abrir(item: Pagina) {
    setPaginaId(item.id);
    setSubId(item.subabas[0].id);
  }

  const grupos = ["topo", "setores", "eventos", "meio", "docs", "fim"] as const;

  return (
    <div className="sjbi">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap"
      />
      <header className="sjHead">
        <div>
          <h1>Seu Justino BI</h1>
          <p className="sjSub">
            Mesmos menus do painel. O que ainda não está no banco aparece como simulado e muda sozinho.
          </p>
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
                  <span>{abertos[grupo] ? "▾" : "▸"}</span>
                </button>
                <div className="sjKids">{botoes}</div>
              </div>
            );
          })}
        </nav>
        <main className="sjMain">
          {pagina.subabas.length > 1 ? (
            <div className="sjSubs">
              {pagina.subabas.map((aba) => (
                <button key={aba.id} type="button" className={aba.id === sub.id ? "on" : ""} onClick={() => setSubId(aba.id)}>
                  {aba.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="sjGrid">
            {sub.kpis.map((kpi) => (
              <article key={kpi.id} className="sjCard">
                <small>{kpi.label}</small>
                <div className="v">
                  <AnimatedNumber value={valorDe(kpi, data, drift[kpi.id] || 0)} kind={kpi.kind} />
                </div>
                <span className={`sjTag ${kpi.real ? "real" : ""}`}>{kpi.real ? "banco" : "simulado"}</span>
              </article>
            ))}
            {pagina.id === "reservas" && sub.id === "hoje" ? (
              <section className="sjCard sjTable">
                <h3>{data?.recentesEm === "hoje" ? "Movimento de hoje" : "Último movimento no banco"}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Hora</th>
                      <th>Pessoas</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentes ?? []).map((row) => (
                      <tr key={row.id} style={freshIds.includes(row.id) ? { background: "#3a2418" } : undefined}>
                        <td>{row.nome}</td>
                        <td>{row.hora || "—"}</td>
                        <td><AnimatedNumber value={row.pessoas} /></td>
                        <td>{row.status}{row.checkedIn ? " · check-in" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
            {sub.tabela ? (
              <section className="sjCard sjTable">
                <h3>{sub.tabela.titulo}</h3>
                <span className="sjTag">simulado</span>
                <table>
                  <thead>
                    <tr>{sub.tabela.colunas.map((col) => <th key={col}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sub.tabela.linhas.map((linha) => (
                      <tr key={linha.join("|")}>
                        {linha.map((celula, indice) => <td key={`${indice}-${celula}`}>{celula}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
