"use client";

import { useState } from "react";
import type { NovidadesAoVivo } from "../FontesNovas";
import { MarketingInstagramEditorial } from "./MarketingInstagramEditorial";
import { MarketingInstagramLeitura } from "./MarketingInstagramLeitura";
import { MarketingInstagramPerfil } from "./MarketingInstagramPerfil";
import { Tabela } from "./MarketingInstagramUi";

type Conta = NonNullable<NovidadesAoVivo["instagram"]>;
type Ativacao = { id: string; data: string; tipo: string; titulo: string; oferta: string; obs: string };

const TIPOS = [
  ["reel", "Reel"],
  ["story", "Story"],
  ["carrossel", "Carrossel"],
  ["foto", "Foto"],
  ["promocao", "Promoção do dia"],
  ["evento", "Evento"],
  ["parceria", "Parceria"],
  ["outro", "Outro"],
] as const;

const PLACAR: readonly (readonly string[])[] = [
  ["Reels por semana", "—", "4"],
  ["Carrosséis por semana", "—", "2"],
  ["Fotos por semana", "—", "a definir (base 21/10: ≈ 1,9)"],
  ["Mediana de alcance dos Reels", "—", "a definir (base 21/10: 6.387)"],
  ["Salvamentos por 1.000 alcançados (Reels)", "—", "a definir (base 21/10: 5,3)"],
  ["Cliques no link ÷ visitas ao perfil", "—", "a definir (base 21/10: 6,3%)"],
  ["Reservas com origem Instagram por semana", "—", "a definir após 30 dias"],
  ["Reservas com origem informada", "—", "≥ 80%"],
];

const VAZIO: Ativacao = { id: "", data: "", tipo: "reel", titulo: "", oferta: "", obs: "" };

function numero(valor: number | null | undefined) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR");
}

function Intro({ insta }: { insta: Conta | null }) {
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Instagram • @seujustino — leitura da conta e plano</h3>
        <span className="sjBadgeP" title="Status da conexão com a API do Instagram">{insta ? "CONECTADO" : "SEM LEITURA"}</span>
      </div>
      <p className="sjNote"><b>Como foi feita:</b> a conta é lida pela API oficial do Instagram. Os cards de indicadores reais e o acompanhamento anual são o que vale para medir o efeito do plano. Bio, link da bio e destaques vêm de uma leitura pública de 19/10/2026. Onde há valor, benefício ou preço, está marcado para confirmar antes de publicar. O bloco “Avaliação com dados reais” é a leitura datada de 21/10/2026 e não substitui o card ao vivo.</p>
    </section>
  );
}

function Placar({ insta }: { insta: Conta | null }) {
  return (
    <section className="sjCard sjBloco">
      <div className="sjRole">
        <h3>Placar do plano</h3>
        <span className="sjMini">linha de base de 21/10/2026 • o “hoje” vem da API e das reservas</span>
      </div>
      {!insta ? <p className="sjMini">Disponível quando a conta estiver conectada e com uma leitura.</p> : (
        <>
          <p className="sjMini">A leitura atual trouxe seguidores, alcance e posts. Reels por semana, mediana, cliques no link e reservas com origem não vieram neste payload — a coluna Hoje fica em branco. Os alvos são os do plano, com a base publicada em 21/10/2026.</p>
          <Tabela colunas={["Indicador", "Hoje", "Alvo"]} linhas={PLACAR} />
          <h4 className="sjMkH4">Cumprimento do cronograma (últimas 4 semanas)</h4>
          <p className="sjMini">A grade do que foi publicado não veio nesta leitura (faltam as datas dos posts). Plano: 4 Reels por semana (terça, quinta, sexta e domingo) e 2 carrosséis (segunda e quarta). A grade, quando chegar, mostra o que foi publicado sem cobrar o dia exato.</p>
        </>
      )}
    </section>
  );
}

function Indicadores({ insta }: { insta: Conta | null }) {
  const [formato, setFormato] = useState("");
  const [ordem, setOrdem] = useState("top");
  return (
    <section className="sjCard sjBloco">
      <h3>Indicadores reais da conta (API oficial do Instagram)</h3>
      <p className="sjMini">{!insta ? "Ainda sem leitura da API neste painel." : insta.data ? `Última leitura em ${insta.data}.` : "Leitura sem data informada."}</p>
      <div className="sjCampos">
        <div className="sjCampo"><small>Seguidores</small><div className="v">{numero(insta?.seguidores)}</div></div>
        <div className="sjCampo"><small>Alcance em 30 dias</small><div className="v">{numero(insta?.alcance30)}</div></div>
        <div className="sjCampo"><small>Posts lidos</small><div className="v">{insta ? numero(insta.posts) : "—"}</div></div>
      </div>
      <p className="sjMini">Visualizações, visitas, cliques, formatos e ranking de posts não vieram nesta leitura. A tabela de 21/10/2026 está no bloco recolhível e não preenche estes cards.</p>
      <div className="sjMkAcoes">
        <b>Ranking de posts</b>
        <label className="sjMini" htmlFor="sjMkRankFormato">Formato
          <select id="sjMkRankFormato" className="sjInput" value={formato} onChange={(evento) => setFormato(evento.target.value)}>
            <option value="">Todos os formatos</option>
            <option value="REEL">Reels</option>
            <option value="FOTO">Fotos</option>
            <option value="CARROSSEL">Carrosséis</option>
          </select>
        </label>
        <label className="sjMini" htmlFor="sjMkRankOrdem">Ordem
          <select id="sjMkRankOrdem" className="sjInput" value={ordem} onChange={(evento) => setOrdem(evento.target.value)}>
            <option value="top">Melhores por alcance</option>
            <option value="pior">Piores por alcance</option>
          </select>
        </label>
        <span className="sjMini">posts dos últimos 60 dias</span>
      </div>
      <p className="sjMini">Ainda sem posts dos últimos 60 dias nesta leitura{formato || ordem === "pior" ? " — o filtro não tem lista para ordenar." : "."}</p>
    </section>
  );
}

function Ativacoes() {
  const [form, setForm] = useState(VAZIO);
  const [itens, setItens] = useState<Ativacao[]>([]);
  const [aviso, setAviso] = useState("");
  function salvar() {
    if (!form.titulo.trim()) {
      setAviso("Informe o título da ação.");
      return;
    }
    setItens((lista) => [{ ...form, id: `${Date.now()}`, titulo: form.titulo.trim() }, ...lista]);
    setForm(VAZIO);
    setAviso("Ação registrada só nesta visita. Não grava no servidor.");
  }
  return (
    <section className="sjCard sjBloco">
      <h3>Ativações do Instagram (o que foi executado)</h3>
      <p className="sjMini">Registre cada ação (Reel de convite, Story de aniversário, promoção do dia). É esse cadastro que permite ligar a ação às reservas que ela gerou. A lista de posts da API não veio nesta leitura.</p>
      <div className="sjMkGrade">
        <label className="sjMini">Data da ação<input className="sjInput" type="date" value={form.data} onChange={(evento) => setForm({ ...form, data: evento.target.value })} /></label>
        <label className="sjMini">Tipo
          <select className="sjInput" value={form.tipo} onChange={(evento) => setForm({ ...form, tipo: evento.target.value })}>
            {TIPOS.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </label>
        <label className="sjMini sjMkSpan2">Título<input className="sjInput" value={form.titulo} placeholder="Ex.: Reel de convite — chope pela metade na terça" onChange={(evento) => setForm({ ...form, titulo: evento.target.value })} /></label>
        <label className="sjMini">Oferta / gancho (opcional)<input className="sjInput" value={form.oferta} placeholder="Ex.: Open de chope R$ 69,90" onChange={(evento) => setForm({ ...form, oferta: evento.target.value })} /></label>
        <label className="sjMini sjMkSpan2">Post vinculado (opcional)
          <select className="sjInput" defaultValue=""><option value="">— sem post vinculado —</option></select>
        </label>
        <label className="sjMini sjMkSpan2">Observação (opcional)<input className="sjInput" value={form.obs} placeholder="Palavra-chave, público-alvo, ajuste feito…" onChange={(evento) => setForm({ ...form, obs: evento.target.value })} /></label>
      </div>
      <div className="sjMkAcoes">
        <button type="button" className="sjAnaliseBtn" onClick={salvar}>Registrar ação</button>
        {aviso ? <span className="sjMini" role="status">{aviso}</span> : null}
      </div>
      {itens.length ? (
        <Tabela
          colunas={["Data", "Tipo", "Título", "Oferta", "Observação"]}
          linhas={itens.map((item) => [item.data || "—", TIPOS.find(([valor]) => valor === item.tipo)?.[1] ?? item.tipo, item.titulo, item.oferta || "—", item.obs || "—"])}
        />
      ) : <p className="sjMini">Nenhuma ação registrada nesta tela.</p>}
    </section>
  );
}

export function MarketingInstagram({ novidades }: { novidades: NovidadesAoVivo | null }) {
  const insta = novidades?.instagram ?? null;
  return (
    <>
      <Intro insta={insta} />
      <Placar insta={insta} />
      <Indicadores insta={insta} />
      <section className="sjCard sjBloco">
        <h3>Acompanhamento anual • ano atual × ano anterior</h3>
        <p className="sjMini">Cada mês é a janela de 1 a 30 (a API limita o intervalo a 30 dias); o mês corrente é parcial. Seguidores só existem a partir do dia em que o BI começou a registrar. Ainda sem série mensal nesta leitura — o gráfico fica em branco.</p>
      </section>
      <Ativacoes />
      <section className="sjCard sjBloco">
        <h3>Retorno em reservas por ação</h3>
        <p className="sjMini">Nenhuma ação ligada a reservas nesta leitura. Diretas e janela dependem das reservas com origem Instagram, que não vieram neste payload.</p>
        <p className="sjMini"><b>Como ler:</b> Diretas são reservas lançadas com origem Instagram ligada à ação — é a medida confiável. Janela são as reservas do dia da ação e dos 3 seguintes, contra a média das mesmas janelas nas 4 semanas anteriores; isso é correlação, não prova. Reservas lançadas em lote pela grade semanal ficam fora da janela. Decisões fortes só com 4 a 6 semanas de dados.</p>
      </section>
      <MarketingInstagramLeitura />
      <MarketingInstagramPerfil />
      <MarketingInstagramEditorial />
    </>
  );
}
