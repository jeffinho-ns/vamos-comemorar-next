"use client";

import { useEffect, useMemo, useState } from "react";
import { CONTEUDO } from "../conteudo";
import { abrirPdfArea, getArea } from "../operacao/apiArea";
import { Badge } from "../operacao/Cartao";
import { EnviarDuvida } from "../operacao/Duvidas";
import { fmtDataHora } from "../operacao/formato";
import type { PaginaEspelhoProps } from "../paginaEspelho";
import { payloadDe, usePlanilha } from "../usePlanilha";
import "../operacao/operacao.css";

/** Vire para true quando a página estiver montada a partir do espelho da planilha. */
export const PRONTA = true;

const CHAVES = ["getManualPdfInfo"];
const TOTAL_PAGINAS_PADRAO = 118;

/** MANUAL_TOC do painel do Renato (número, título e página). */
const MANUAL_TOC: { part: string; items: { n: number; t: string; p: number }[] }[] = [
  { part: "Parte 1 — A casa", items: [{ n: 1, t: "Bem-vindo e como usar este manual", p: 5 }, { n: 2, t: "A nossa história", p: 6 }, { n: 3, t: "Quem somos: missão, visão e valores", p: 8 }, { n: 4, t: "Horários de funcionamento", p: 10 }, { n: 5, t: "A programação da semana", p: 12 }, { n: 6, t: "Portaria: couvert e entrada", p: 14 }, { n: 7, t: "Cartão de consumo e taxa de serviço", p: 16 }, { n: 8, t: "Organograma: quem responde para quem", p: 18 }] },
  { part: "Parte 2 — Regras que valem para todos", items: [{ n: 9, t: "Uniforme e apresentação pessoal", p: 21 }, { n: 10, t: "Higiene: mãos, alimentos e ambiente", p: 23 }, { n: 11, t: "Postura e comportamento no salão", p: 25 }, { n: 12, t: "Ponto, refeição e intervalo", p: 27 }, { n: 13, t: "As 10 regras de ouro", p: 29 }, { n: 14, t: "O que é falta leve e o que é falta grave", p: 30 }, { n: 15, t: "O Regulamento Interno manda mais que este manual", p: 31 }, { n: 16, t: "Gravação, foto e redes sociais", p: 33 }] },
  { part: "Parte 3 — Como o serviço funciona", items: [{ n: 17, t: "A linha do tempo do turno", p: 36 }, { n: 18, t: "O rádio: como a casa se fala", p: 37 }, { n: 19, t: "Fluxo da portaria: chegada do cliente", p: 39 }, { n: 20, t: "Fluxo do salão: do \"boa noite\" à conta", p: 41 }, { n: 21, t: "Fluxo do pedido: Zig, cozinha e bar", p: 43 }, { n: 22, t: "Mise en place por pedido: como a mesa é montada", p: 45 }, { n: 23, t: "Fluxo da saída: caixa e segurança", p: 47 }, { n: 24, t: "Fluxo da feijoada de domingo", p: 48 }, { n: 25, t: "Ruído, som e artistas", p: 50 }, { n: 26, t: "Os rituais da casa: chope, caipirinha e passador", p: 52 }] },
  { part: "Parte 4 — As funções, uma por uma", items: [{ n: 27, t: "Liderança: Gerente, Chefe de Fila, Chefe de Cozinha, Chefe de Bar", p: 55 }, { n: 28, t: "Salão: Cumim, Suiteiro e Garçom", p: 63 }, { n: 29, t: "Portaria e caixa: Hostess, Segurança e Caixa", p: 67 }, { n: 30, t: "Cozinha: Cozinheiro Líder, Cozinheiro e Auxiliar", p: 72 }, { n: 31, t: "Bar: Subchefe de Bar, Bartender e Barback", p: 75 }, { n: 32, t: "Apoio: Estoquista, Limpeza, Manutenção e Nutricionista", p: 78 }] },
  { part: "Parte 5 — Checklists e rondas", items: [{ n: 33, t: "Como usar os checklists", p: 83 }, { n: 34, t: "Checklists por setor (para imprimir e assinar)", p: 84 }, { n: 35, t: "Ronda \"olhar de cliente\" dos líderes", p: 95 }] },
  { part: "Parte 6 — Quando dá problema", items: [{ n: 36, t: "Frases prontas do atendimento", p: 99 }, { n: 37, t: "Como resolver os 12 problemas mais comuns", p: 101 }] },
  { part: "Parte 7 — Treinamento e avaliação", items: [{ n: 38, t: "Os 7 primeiros dias de quem entra", p: 106 }, { n: 39, t: "Prova rápida do manual", p: 106 }, { n: 40, t: "Ficha de avaliação do colaborador", p: 109 }, { n: 41, t: "Termo de recebimento e confidencialidade", p: 111 }, { n: 42, t: "Contatos e emergência", p: 113 }, { n: 43, t: "Termo de responsabilidade — entrada de menor", p: 116 }] },
];

function capituloDe(pagina: number) {
  let achado: { n: number; t: string; p: number } | null = null;
  MANUAL_TOC.forEach((part) => part.items.forEach((it) => { if (it.p <= pagina) achado = it; }));
  return achado as { n: number; t: string; p: number } | null;
}

function emailUsuario() {
  if (typeof window === "undefined") return "";
  try { const u = JSON.parse(localStorage.getItem("user") || "{}") as { email?: string }; return u.email || ""; } catch { return ""; }
}

export function ManualPagina({ subId, onSub, onSalvo }: PaginaEspelhoProps) {
  const abas = CONTEUDO.manual ?? [];
  const aba = abas.find((item) => item.id === subId) ?? abas[0];
  const { dados, erro } = usePlanilha(CHAVES);
  const info = payloadDe<{ ok?: boolean; totalBytes?: number; updatedAt?: string; error?: string }>(dados, "getManualPdfInfo");
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Clique em \"Abrir manual\" para carregar.");
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [copia, setCopia] = useState<{ capturedAt?: string } | null>(null);
  const total = TOTAL_PAGINAS_PADRAO;
  const cap = useMemo(() => capituloDe(pagina), [pagina]);
  const hits = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 3) return [];
    return MANUAL_TOC.flatMap((part) => part.items).filter((it) => it.t.toLowerCase().includes(q)).slice(0, 25);
  }, [busca]);

  useEffect(() => {
    getArea<{ ok: boolean; copia?: { capturedAt?: string } | null }>("/justino/documentos/manual/info").then((r) => setCopia(r.json?.copia ?? null));
  }, []);

  async function abrir() {
    setStatus("Carregando manual… (na primeira vez a API baixa o PDF em pedaços da planilha; pode levar alguns minutos)");
    const r = await abrirPdfArea("/justino/documentos/manual/pdf");
    if (!r || r.startsWith("erro:")) { setStatus(`Não consegui carregar o manual agora. (${r?.slice(5) || "falha"})`); return; }
    setUrl(r);
    setStatus("");
  }
  function irPara(n: number) {
    setPagina(Math.max(1, Math.min(total, Number(n) || 1)));
  }

  return (
    <>
      {abas.length > 1 ? <div className="sjSubs">{abas.map((item) => <button key={item.id} type="button" className={item.id === aba?.id ? "on" : ""} onClick={() => onSub(item.id)}>{item.label}</button>)}</div> : null}
      {erro ? <p className="sjAlerta">{erro}</p> : null}
      <div key="manual" className="sjStage">
        <div className="sjGrid">
          <section className="sjCard sjBloco opFull">
            <div className="sjRole"><h3>📘 Manual</h3><Badge nivel="b">{url ? `página ${pagina} de ${total}` : "—"}</Badge></div>
            <p className="sjNote">Uso interno. Aqui está o manual oficial de operação da casa: organograma, fluxos do salão/cozinha/bar, a descrição de cada função e os checklists de abertura e fechamento por setor. O acesso fica registrado com o seu e-mail em cada página. <b>Não copie, não fotografe a tela nem encaminhe para fora da equipe</b> — cópia e impressão ficam desabilitadas aqui dentro, mas nenhum sistema evita 100% um print de tela ou foto do monitor; leve isso a sério.</p>
            <p className="sjMini">{info?.ok ? `PDF no Drive: ${((info.totalBytes || 0) / 1048576).toFixed(1)} MB, atualizado em ${fmtDataHora(info.updatedAt)}.` : info?.error ? `Planilha: ${info.error}` : "Aguardando a cópia das informações do manual."}{copia?.capturedAt ? ` Cópia no banco de ${fmtDataHora(copia.capturedAt)}.` : " Ainda sem cópia do PDF no banco (monta na primeira abertura)."}</p>
          </section>
          <section className="sjCard sjBloco opFull">
            <div className="opManual">
              <div>
                <input className="sjInput" placeholder="Buscar no manual (ex.: checklist fechamento, uniforme, feijoada)…" value={busca} onChange={(e) => setBusca(e.target.value)} />
                {busca.trim().length >= 3 ? <div className="opGrupo">{hits.length ? hits.map((h) => <button key={h.n} type="button" className="opManualItem" onClick={() => irPara(h.p)}>{h.n}. {h.t} • pág. {h.p}</button>) : <span className="sjMini">Nada encontrado no sumário (a busca no texto completo das páginas fica pendente).</span>}</div> : null}
                <div className="opManualToc">
                  {MANUAL_TOC.map((part) => (
                    <div key={part.part}>
                      <div className="opManualPart">{part.part}</div>
                      {part.items.map((it) => <button key={it.n} type="button" className={`opManualItem${cap?.p === it.p ? " on" : ""}`} onClick={() => irPara(it.p)}>{it.n}. {it.t}</button>)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="sjToolbar" style={{ margin: "0 0 10px" }}>
                  <button type="button" className="sjAnaliseBtn" onClick={() => irPara(1)}>« Início</button>
                  <button type="button" className="sjAnaliseBtn" onClick={() => irPara(pagina - 1)}>‹ Anterior</button>
                  <input className="sjInput" type="number" min={1} max={total} style={{ maxWidth: 70, textAlign: "center" }} value={pagina} onChange={(e) => irPara(Number(e.target.value))} />
                  <span className="sjMini">de {total}</span>
                  <button type="button" className="sjAnaliseBtn" onClick={() => irPara(pagina + 1)}>Próxima ›</button>
                  <span className="sjMini" style={{ marginLeft: "auto" }}>{cap ? `${cap.n}. ${cap.t}` : ""}</span>
                </div>
                <div className="opManualViewer" onContextMenu={(e) => e.preventDefault()}>
                  {url ? <iframe key={`${pagina}`} src={`${url}#page=${pagina}&toolbar=0&navpanes=0`} title="Manual Operacional" /> : (
                    <div style={{ padding: 20 }}><p className="sjMini">{status}</p><button type="button" className="sjAnaliseBtn" onClick={abrir}>Abrir manual</button></div>
                  )}
                  <div className="opMarca">{emailUsuario() || "uso interno"} • {new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          </section>
          <EnviarDuvida aoSalvar={onSalvo} />
        </div>
      </div>
    </>
  );
}
