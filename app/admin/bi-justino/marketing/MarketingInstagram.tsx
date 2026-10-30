"use client";

import { useState } from "react";
import { chamarBi, payloadDe, type DadosPlanilha } from "../usePlanilha";
import type { IgAtivacoesResp, IgRetornoResp, InstagramResp } from "./espelhoTipos";
import { cronograma, fmtInt, pctTexto, placarDoPlano, porFormato, rankingPosts, num, variacaoSeguidores } from "./instagramCalculo";
import { MarketingInstagramAnual } from "./MarketingInstagramAnual";
import { MarketingInstagramAtivacoes, MarketingInstagramRetorno } from "./MarketingInstagramAtivacoes";
import { MarketingInstagramEditorial } from "./MarketingInstagramEditorial";
import { MarketingInstagramLeitura } from "./MarketingInstagramLeitura";
import { MarketingInstagramPerfil } from "./MarketingInstagramPerfil";
import { Tabela } from "./MarketingInstagramUi";

const DIAS_CURTO = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

function dataCurta(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${DIAS[new Date(`${iso}T12:00:00`).getDay()]} ${dia}/${mes}/${ano}`;
}

function SeloPlacar({ cls, texto }: { cls: "g" | "y" | "r"; texto: string }) {
  const classe = cls === "g" ? "sjBadgeG" : cls === "r" ? "sjBadgeR" : "sjBadgeY";
  return <span className={classe}>{texto}</span>;
}

function Intro({ resp }: { resp: InstagramResp | null }) {
  const conectado = Boolean(resp?.ok && resp.configurado);
  const leitura = resp?.atual?.date ? ` • leitura de ${dataCurta(resp.atual.date)}` : "";
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>📸 Instagram • @seujustino — leitura da conta e plano</h3>
        <span className={conectado ? "sjBadgeG" : "sjBadgeR"} title="Status da conexão com a API do Instagram">{!resp ? "⏳ verificando…" : conectado ? `Conectado${leitura}` : "Desconectado"}</span>
      </div>
      <p className="sjNote"><b>Como foi feita:</b> a conta está <b>conectada pela API oficial do Instagram</b>: os cards <b>Indicadores reais</b> e <b>Acompanhamento anual</b> (alcance, visitas ao perfil, cliques no link, engajamento, desempenho por formato, top posts e comparação ano a ano) atualizam sozinhos todo dia às 6h e são o que vale para medir o efeito do plano. Bio, link da bio e destaques vêm de uma leitura pública de 19/10/2026 (sem login). Onde há valor, benefício ou preço, está marcado <i>(confirmar)</i>: confirme que está vigente antes de publicar. <span className="sjMini">O selo verde/vermelho no topo mostra se a conta está conectada.</span></p>
    </section>
  );
}

function Placar({ resp, retorno }: { resp: InstagramResp | null; retorno: IgRetornoResp | null }) {
  const linhas = resp ? placarDoPlano(resp, retorno) : null;
  const grade = resp?.posts ? cronograma(resp.posts) : [];
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>🎯 Placar do plano</h3>
        <span className="sjMini">linha de base de 21/10/2026 • tudo vem da API e das reservas</span>
      </div>
      {!linhas ? <p className="sjMini">Disponível quando a conta estiver conectada e com uma leitura.</p> : (
        <>
          <p className="sjMini">Metas numéricas só existem para Reels (4) e carrosséis (2) por semana, vindas do plano. As demais seguem a linha de base de 21/10 e ganham meta depois de 30 dias do novo ritmo.</p>
          <Tabela
            colunas={["Indicador", "Hoje", "Alvo", "Status"]}
            linhas={linhas.map((l) => [<span key={l.indicador}><b>{l.indicador}</b><br /><span className="sjMini">{l.sub}</span></span>, <b key={`${l.indicador}-h`}>{l.hoje}</b>, l.alvo, <SeloPlacar key={`${l.indicador}-s`} cls={l.selo.cls} texto={l.selo.texto} />])}
          />
          <h4 className="sjMkH4">Cumprimento do cronograma (últimas 4 semanas)</h4>
          <Tabela
            colunas={["Semana", ...DIAS_CURTO, "Reels", "Carrosséis"]}
            linhas={grade.map((w) => [
              <span key={w.semana}><b>{w.semana.slice(8, 10)}/{w.semana.slice(5, 7)}</b>{w.atual ? <><br /><span className="sjMini">em andamento</span></> : null}</span>,
              ...w.celulas.map((c, i) => <span key={`${w.semana}-${i}`}>{c.icones || <span className="sjMini">—</span>}{c.plano ? <><br /><span className="sjMini" style={{ opacity: 0.7 }}>{c.plano}</span></> : null}</span>),
              <span key={`${w.semana}-r`}><b>{w.reel}</b>/4 {w.atual ? null : w.reel >= 4 ? <span className="sjBadgeG">ok</span> : <span className="sjBadgeR">falta</span>}</span>,
              <span key={`${w.semana}-c`}><b>{w.car}</b>/2 {w.atual ? null : w.car >= 2 ? <span className="sjBadgeG">ok</span> : <span className="sjBadgeY">falta</span>}</span>,
            ])}
          />
          <p className="sjMini">🎬 Reel • 🗂️ carrossel • 🖼️ foto</p>
        </>
      )}
      <p className="sjMini">Plano: 4 Reels por semana (terça, quinta, sexta e domingo) e 2 carrosséis (segunda e quarta). A grade mostra o que foi realmente publicado, sem cobrar o dia exato (alguns Reels são postados na véspera).</p>
    </section>
  );
}

function Indicadores({ resp, onSalvo }: { resp: InstagramResp | null; onSalvo: () => void }) {
  const [formato, setFormato] = useState("");
  const [ordem, setOrdem] = useState<"top" | "pior">("top");
  const [status, setStatus] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const a = resp?.atual ?? null;
  const posts = resp?.posts ?? [];
  const formatos = porFormato(posts);
  const ranking = rankingPosts(posts, formato, ordem);
  const reach = num(a?.reach30);
  const inter = num(a?.interactions30);
  const visitas = num(a?.profileViews30);
  const cliques = num(a?.websiteClicks30);
  const eng = reach && reach > 0 && inter != null ? pctTexto((inter / reach) * 100) : "—";
  const clk = visitas && visitas > 0 && cliques != null ? pctTexto((cliques / visitas) * 100) : "—";
  const dSeg = a ? variacaoSeguidores(a, resp?.historico ?? []) : null;

  async function buscarAgora() {
    setOcupado(true);
    setStatus("Buscando…");
    const r = await chamarBi<{ ok?: boolean; error?: string; posts?: number }>("/api/bi/justino/marketing/instagram/atualizar", {});
    setOcupado(false);
    if (!r.ok || !r.json?.ok) return setStatus(`Não consegui buscar do Instagram: ${r.json?.error || "erro"}`);
    setStatus(`Instagram atualizado: ${r.json.posts ?? 0} posts lidos.`);
    onSalvo();
  }

  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>📊 Indicadores reais da conta (API oficial do Instagram)</h3>
        <span>
          <button type="button" className="sjAnaliseBtn sjMkGrafBtn" onClick={onSalvo}>🔄 Atualizar</button>{" "}
          {resp?.configurado ? <button type="button" className="sjAnaliseBtn sjMkGrafBtn" disabled={ocupado} onClick={() => { void buscarAgora(); }}>⬇️ Buscar do Instagram agora</button> : null}
        </span>
      </div>
      {status ? <p className="sjMini" role="status">{status}</p> : null}
      {!resp ? <p className="sjMini">Carregando…</p>
        : !resp.ok ? <p className="sjMini">Não consegui carregar os indicadores agora.</p>
          : !resp.configurado ? <p className="sjMini">🔌 <b>Conta ainda não conectada.</b> Quando o token estiver no Apps Script, os números reais de alcance, engajamento, Reels e posts aparecem aqui sozinhos.</p>
            : !a ? <p className="sjMini">Conectada, mas ainda sem leitura — rode atualizarInstagram_ no Apps Script ou use &quot;Buscar do Instagram agora&quot;.</p>
              : (
                <>
                  <p className="sjMini">✅ Leitura de <b>{dataCurta(a.date)}</b> (últimos 30 dias).{a.avisos ? <span style={{ color: "var(--yellow)" }}> Avisos: {a.avisos}</span> : null}</p>
                  <div className="sjCampos">
                    <div className="sjCampo"><small>Seguidores</small><div className="v">{fmtInt(a.followers)}</div><span className="sjMini">{dSeg == null ? "" : `${dSeg >= 0 ? "+" : ""}${fmtInt(dSeg)} em ~30 dias`}</span></div>
                    <div className="sjCampo"><small>Alcance (30d)</small><div className="v">{fmtInt(a.reach30)}</div><span className="sjMini">contas alcançadas</span></div>
                    <div className="sjCampo"><small>Visualizações (30d)</small><div className="v">{fmtInt(a.views30)}</div></div>
                    <div className="sjCampo"><small>Visitas ao perfil (30d)</small><div className="v">{fmtInt(a.profileViews30)}</div></div>
                    <div className="sjCampo"><small>Cliques no link (30d)</small><div className="v">{fmtInt(a.websiteClicks30)}</div><span className="sjMini">= {clk} das visitas</span></div>
                    <div className="sjCampo"><small>Interações ÷ alcance</small><div className="v">{eng}</div><span className="sjMini">{fmtInt(a.interactions30)} interações</span></div>
                  </div>
                  {formatos.length ? (
                    <>
                      <p><b>Desempenho por formato</b> <span className="sjMini">(posts dos últimos 60 dias; médias por post)</span></p>
                      <Tabela colunas={["Formato", "Posts", "Alcance médio", "Alcance mediano", "Salvamentos médios", "Compartilhamentos médios", "Interações médias"]} linhas={formatos.map((f) => [<b key={f.formato}>{f.formato}</b>, f.n, fmtInt(f.reach), fmtInt(f.reachMed), fmtInt(f.saved), fmtInt(f.shares), fmtInt(f.inter)])} />
                    </>
                  ) : null}
                </>
              )}
      <div className="sjMkAcoes">
        <b>Ranking de posts</b>
        <select className="sjInput" value={formato} onChange={(e) => setFormato(e.target.value)} aria-label="Formato">
          <option value="">Todos os formatos</option>
          <option value="REEL">Reels</option>
          <option value="FOTO">Fotos</option>
          <option value="CARROSSEL">Carrosséis</option>
        </select>
        <select className="sjInput" value={ordem} onChange={(e) => setOrdem(e.target.value === "pior" ? "pior" : "top")} aria-label="Ordem">
          <option value="top">Melhores por alcance</option>
          <option value="pior">Piores por alcance</option>
        </select>
        <span className="sjMini">posts dos últimos 60 dias</span>
      </div>
      {ranking.length ? (
        <Tabela
          colunas={["Data", "Hora", "Formato", "Alcance", "Salvos", "Envios", "Legenda"]}
          linhas={ranking.map((p) => [dataCurta(p.date), p.hora || "—", p.tipo, fmtInt(p.reach), fmtInt(p.saved), fmtInt(p.shares), p.permalink ? <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer">{(p.legenda || "(sem legenda)").slice(0, 70)}</a> : (p.legenda || "(sem legenda)").slice(0, 70)])}
        />
      ) : <p className="sjMini">Sem posts nesse filtro.</p>}
    </section>
  );
}

/** Sub-aba "Instagram" do Marketing: mesmos cards e ordem do painel do Renato, lendo do espelho. */
export function MarketingInstagram({ dados, onSalvo }: { dados: DadosPlanilha; onSalvo: () => void }) {
  const resp = payloadDe<InstagramResp>(dados, "getInstagram");
  const retorno = payloadDe<IgRetornoResp>(dados, "getIgRetorno");
  const ativacoes = payloadDe<IgAtivacoesResp>(dados, "getIgAtivacoes")?.items ?? [];
  return (
    <>
      <Intro resp={resp} />
      <Placar resp={resp} retorno={retorno} />
      <Indicadores resp={resp} onSalvo={onSalvo} />
      <MarketingInstagramAnual resp={resp} />
      <MarketingInstagramAtivacoes itens={ativacoes} posts={resp?.posts ?? []} onSalvo={onSalvo} />
      <MarketingInstagramRetorno retorno={retorno} onSalvo={onSalvo} />
      <MarketingInstagramLeitura />
      <MarketingInstagramPerfil />
      <MarketingInstagramEditorial />
    </>
  );
}
