"use client";

import { useState } from "react";
import type { NovidadesAoVivo } from "../FontesNovas";

type Item = NonNullable<NonNullable<NovidadesAoVivo["avaliacoes"]>["itens"]>[number];
type Filtro = "pend" | "aprovada" | "publicada" | "descartada" | "respondida_externa" | "todas";

const VAZIO = "Nenhuma avaliação lida ainda. Rode o login manual e o robô de avaliações (robo-zigpay/login_manual_google.ps1 e robo_google_avaliacoes.ps1).";
const ROTULO: Record<string, string> = {
  novo: "Para responder",
  aprovada: "Copiada, falta publicar",
  publicada: "Publicada",
  descartada: "Descartada",
  respondida_externa: "Já respondida no Google",
};

function statusBase(status: string) {
  const limpo = status.trim().toLowerCase();
  if (!limpo || limpo === "pend" || limpo === "novo") return "novo";
  return limpo;
}

function tom(nota: number) {
  if (nota <= 2) return "baixa";
  if (nota === 3) return "media";
  return "alta";
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

export function MarketingGoogle({ novidades }: { novidades: NovidadesAoVivo | null }) {
  const aval = novidades?.avaliacoes ?? null;
  const itens = aval?.itens ?? [];
  const [locais, setLocais] = useState<Record<number, string>>({});
  const [filtro, setFiltro] = useState<Filtro>("pend");
  const [avisos, setAvisos] = useState<Record<number, string>>({});
  const [avisoGeral, setAvisoGeral] = useState("");
  const comStatus = itens.map((item, indice) => ({ item, indice, status: locais[indice] ?? statusBase(item.status) }));
  const pendentes = comStatus.filter((linha) => linha.status === "novo").length;
  const negativas = comStatus.filter((linha) => linha.status === "novo" && linha.item.nota <= 2).length;
  const visiveis = comStatus
    .filter((linha) => filtro === "todas" || (filtro === "pend" ? linha.status === "novo" : linha.status === filtro))
    .sort((a, b) => Number(a.item.nota > 2) - Number(b.item.nota > 2) || a.item.nota - b.item.nota);
  const media = aval?.media != null
    ? aval.media.toFixed(2).replace(".", ",")
    : itens.length
      ? (itens.reduce((soma, item) => soma + item.nota, 0) / itens.length).toFixed(2).replace(".", ",")
      : null;

  async function copiar(item: Item, indice: number) {
    const texto = item.sugestao.trim() || item.texto.trim();
    if (!texto) {
      setAvisos((atual) => ({ ...atual, [indice]: "Sem texto para copiar." }));
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      setLocais((atual) => ({ ...atual, [indice]: "aprovada" }));
      setAvisoGeral("Resposta copiada. Ela foi para o filtro Copiadas (falta publicar). Cole no Google e marque como publicada.");
      setAvisos((atual) => ({ ...atual, [indice]: "Resposta copiada. Cole no Google e marque como publicada." }));
    } catch {
      setAvisos((atual) => ({ ...atual, [indice]: "Não consegui copiar. Selecione o texto e use o copiar do navegador." }));
    }
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Avaliações do Google</h3>
        <span className="sjBadgeP">{itens.length ? `${pendentes} para responder` : "—"}</span>
      </div>
      <p className="sjNote">O robô lê o Perfil da Empresa do Google 1 vez ao dia (sem nome de cliente). A resposta sugerida segue a skill de respostas do Seu Justino. Nada é publicado sozinho: revise, copie, cole no Google e marque como publicada. Comece pelas negativas. Copiar, publicar e descartar valem só nesta visita: não gravam no servidor.</p>
      <div className="sjToolbar">
        <div className="sjTb">
          <label htmlFor="sjMkAvalFiltro">Mostrar
            <select id="sjMkAvalFiltro" className="sjInput" value={filtro} onChange={(evento) => setFiltro(evento.target.value as Filtro)}>
              <option value="pend">Para responder</option>
              <option value="aprovada">Copiadas (falta publicar)</option>
              <option value="publicada">Publicadas</option>
              <option value="descartada">Descartadas</option>
              <option value="respondida_externa">Já respondidas no Google</option>
              <option value="todas">Todas</option>
            </select>
          </label>
        </div>
      </div>
      {media ? <p className="sjMini">Nota média das avaliações lidas: {media} ({aval?.total ?? itens.length} avaliações) • Para responder: {pendentes} (negativas: {negativas})</p> : null}
      {avisoGeral ? <p className="sjMini" role="status">{avisoGeral}</p> : null}
      {!itens.length ? <p className="sjAlert y">{VAZIO}</p> : null}
      {itens.length && !visiveis.length ? <p className="sjMini">Nenhuma avaliação neste filtro.</p> : null}
      {visiveis.slice(0, 60).map(({ item, indice, status }) => {
        const editavel = status === "novo" || status === "aprovada";
        const resposta = item.sugestao || item.texto;
        return (
          <article key={`${item.quando}-${indice}`} className={`sjCampo sjMkAval ${tom(item.nota)}`}>
            <div className="sjMkTopo">
              <Estrelas nota={item.nota} />
              <span className="sjMini">{item.quando || "sem data"} • {ROTULO[status] ?? status}</span>
            </div>
            <p className="sjMkPre">{item.texto.trim() || "Só estrelas, sem texto."}</p>
            {resposta ? <p className="sjMini">{resposta}</p> : null}
            <div className="sjMkAcoes">
              {editavel ? <button type="button" className="sjAnaliseBtn" onClick={() => { void copiar(item, indice); }}>Copiar resposta</button> : null}
              {editavel ? <a className="sjAnaliseBtn" href="https://business.google.com/reviews" target="_blank" rel="noopener noreferrer">Abrir no Google</a> : null}
              {editavel ? <button type="button" className="sjAnaliseBtn" onClick={() => { setLocais((atual) => ({ ...atual, [indice]: "publicada" })); setAvisoGeral("Marcada como publicada só nesta tela. Não grava no Google nem no servidor."); }}>Marcar como publicada</button> : null}
              {editavel ? <button type="button" className="sjAnaliseBtn" onClick={() => { setLocais((atual) => ({ ...atual, [indice]: "descartada" })); setAvisoGeral("Avaliação descartada só nesta tela."); }}>Descartar</button> : null}
              {!editavel ? <button type="button" className="sjAnaliseBtn" onClick={() => setLocais((atual) => ({ ...atual, [indice]: "novo" }))}>Voltar para responder</button> : null}
            </div>
            {avisos[indice] ? <p className="sjMini" role="status">{avisos[indice]}</p> : null}
          </article>
        );
      })}
      {visiveis.length > 60 ? <p className="sjMini">Mostrando as 60 primeiras de {visiveis.length}.</p> : null}
    </section>
  );
}
