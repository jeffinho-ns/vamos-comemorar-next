"use client";

import { useState } from "react";
import { chamarBi, payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { GoogleAvaliacao, GoogleAvaliacoesResp } from "./espelhoTipos";

type Filtro = "pend" | "aprovada" | "publicada" | "descartada" | "respondida_externa" | "todas";

const VAZIO = "Nenhuma avaliação lida ainda. Rode o login manual e o robô de avaliações (robo-zigpay/login_manual_google.ps1 e robo_google_avaliacoes.ps1).";
const ROTULO: Record<string, string> = {
  novo: "Para responder",
  aprovada: "Copiada, falta publicar",
  publicada: "Publicada",
  descartada: "Descartada",
  respondida_externa: "Já respondida no Google",
};

function pendente(r: GoogleAvaliacao) {
  return r.status === "novo" && !r.respondida;
}
function tom(nota: number) {
  return nota <= 2 ? "baixa" : nota === 3 ? "media" : "alta";
}
function quando(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Estrelas({ nota }: { nota: number }) {
  const cheias = Math.max(0, Math.min(5, Math.round(nota)));
  return (
    <span className={`sjMkEstrelas ${tom(cheias)}`} role="img" aria-label={`${cheias} de 5 estrelas`}>
      {"★".repeat(cheias)}
      <span className="sjMkOff">{"★".repeat(5 - cheias)}</span>
    </span>
  );
}

function Avaliacao({ r, onSalvo }: { r: GoogleAvaliacao; onSalvo: () => void }) {
  const [texto, setTexto] = useState(r.textoFinal || r.sugestao || "");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const edit = r.status === "novo" || r.status === "aprovada";

  async function decidir(status: string, textoFinal: string) {
    const res = await chamarBi<{ ok?: boolean; error?: string }>("/api/bi/justino/marketing/avaliacoes/decidir", { id: r.id, status, textoFinal });
    if (!res.ok || !res.json?.ok) {
      setAviso(`Não consegui gravar: ${res.json?.error || "sem resposta"}`);
      return false;
    }
    onSalvo();
    return true;
  }

  async function acao(tipo: "copiar" | "publicada" | "sugerir" | "descartada" | "novo") {
    setOcupado(true);
    setAviso("");
    try {
      if (tipo === "sugerir") {
        const res = await chamarBi<{ ok?: boolean; error?: string; sugestao?: string }>("/api/bi/justino/marketing/avaliacoes/sugerir", { id: r.id });
        if (res.ok && res.json?.ok) {
          setTexto(res.json.sugestao || "");
          setAviso("Nova sugestão gerada.");
          onSalvo();
        } else setAviso(`Não consegui gerar: ${res.json?.error || "sem resposta"}`);
        return;
      }
      const final = texto.trim();
      if (tipo === "copiar") {
        try {
          await navigator.clipboard.writeText(final);
        } catch {
          setAviso("Não consegui copiar: selecione o texto e use Ctrl+C.");
          return;
        }
        if (await decidir("aprovada", final)) setAviso("Resposta copiada. Cole no Google e depois toque em \"Já publiquei\".");
        return;
      }
      if (tipo === "publicada" && !final) {
        setAviso("Sem texto de resposta.");
        return;
      }
      if (await decidir(tipo, tipo === "novo" || tipo === "descartada" ? "" : final)) {
        setAviso(`Marcada como ${tipo === "publicada" ? "publicada" : tipo === "descartada" ? "descartada" : "para responder"}.`);
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className={`sjCampo sjMkAval ${tom(r.nota)}`}>
      <div className="sjMkTopo">
        <Estrelas nota={r.nota} />
        <span className="sjMini">{r.quando || ""} • {ROTULO[r.status] ?? r.status}{r.origem === "modelo" ? " • modelo padrão (sem IA)" : ""}</span>
      </div>
      <p className="sjMkPre">{r.texto.trim() || <i>(só estrelas, sem texto)</i>}</p>
      {edit || texto ? (
        <label className="sjMini">Resposta sugerida (edite se quiser; a saudação usa &quot;Olá!&quot;, acrescente o nome se desejar)
          <textarea className="sjInput" rows={4} value={texto} readOnly={!edit} onChange={(e) => setTexto(e.target.value)} />
        </label>
      ) : null}
      <div className="sjMkAcoes">
        {edit ? (
          <>
            <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void acao("copiar"); }}>📋 Copiar resposta</button>
            <a className="sjAnaliseBtn" href="https://business.google.com/reviews" target="_blank" rel="noopener noreferrer">Abrir no Google ↗</a>
            <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void acao("publicada"); }}>✅ Já publiquei</button>
            <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void acao("sugerir"); }}>↻ Nova sugestão</button>
            <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void acao("descartada"); }}>Descartar</button>
          </>
        ) : <button type="button" className="sjAnaliseBtn" disabled={ocupado} onClick={() => { void acao("novo"); }}>↩ Voltar para responder</button>}
      </div>
      {aviso ? <p className="sjMini" role="status">{aviso}</p> : null}
    </article>
  );
}

/** Sub-aba "⭐ Avaliações do Google" (loadAvaliacoes / avalRender / avalAcao). */
export function MarketingGoogle({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const resp = payloadDe<GoogleAvaliacoesResp>(dados, "getGoogleAvaliacoes");
  const todas = resp?.rows ?? [];
  const [filtro, setFiltro] = useState<Filtro>("pend");
  const pend = todas.filter(pendente);
  const neg = pend.filter((r) => r.nota <= 2).length;
  const media = todas.length ? todas.reduce((s, r) => s + r.nota, 0) / todas.length : 0;
  const ult = todas.reduce((m, r) => Math.max(m, r.capturedAt || 0), 0);
  const lista = todas
    .filter((r) => filtro === "todas" || (filtro === "pend" ? pendente(r) : r.status === filtro))
    .sort((a, b) => ((a.nota <= 2 ? 0 : 1) - (b.nota <= 2 ? 0 : 1)) || a.nota - b.nota || b.capturedAt - a.capturedAt);

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>⭐ Avaliações do Google</h3>
        <span className="sjBadgeP">{todas.length ? `${pend.length} para responder` : "—"}</span>
      </div>
      <p className="sjNote">O robô lê o Perfil da Empresa do Google 1 vez ao dia (sem nome de cliente). A resposta sugerida segue a skill de respostas do Seu Justino. <b>Nada é publicado sozinho:</b> revise, copie, cole no Google e marque como publicada. Comece pelas negativas.</p>
      <div className="sjToolbar">
        <div className="sjTb">
          <label htmlFor="sjMkAvalFiltro">Mostrar
            <select id="sjMkAvalFiltro" className="sjInput" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
              <option value="pend">Para responder</option>
              <option value="aprovada">Copiadas (falta publicar)</option>
              <option value="publicada">Publicadas</option>
              <option value="descartada">Descartadas</option>
              <option value="respondida_externa">Já respondidas no Google</option>
              <option value="todas">Todas</option>
            </select>
          </label>
        </div>
        <button type="button" className="sjAnaliseBtn" onClick={onSalvo}>↻ Atualizar tela</button>
      </div>
      {todas.length ? <p className="sjMini">Nota média das avaliações lidas: <b>{media.toFixed(2).replace(".", ",")}</b> ({todas.length} avaliações) • Para responder: <b>{pend.length}</b> (negativas: <b className={neg ? "sjNeg" : ""}>{neg}</b>) • Última leitura: {quando(ult)}</p> : null}
      {!resp ? <p className="sjMini">Carregando avaliações…</p> : !todas.length ? <p className="sjAlert y">{VAZIO}</p> : null}
      {todas.length && !lista.length ? <p className="sjMini">Nenhuma avaliação neste filtro.</p> : null}
      {lista.slice(0, 60).map((r) => <Avaliacao key={`${r.id}-${r.status}-${r.sugestao.length}`} r={r} onSalvo={onSalvo} />)}
      {lista.length > 60 ? <p className="sjMini">Mostrando as 60 primeiras de {lista.length}.</p> : null}
    </section>
  );
}
