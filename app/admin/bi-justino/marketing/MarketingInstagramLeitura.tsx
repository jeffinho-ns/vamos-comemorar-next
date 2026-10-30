"use client";

import { Recolhivel, Tabela } from "./MarketingInstagramUi";

const CONTA: readonly (readonly string[])[] = [
  ["Seguidores", "128.915", "Segue 2 contas; 739 publicações no histórico."],
  ["Alcance", "246.778", "≈ 191% da base: a conta alcança quase o dobro dos seguidores em 30 dias — o que passa do tamanho da base vem dos Reels."],
  ["Visualizações", "682.770", "≈ 2,8 visualizações por conta alcançada."],
  ["Interações", "25.128", "≈ 10,2% do alcance; 17.082 contas engajadas (6,9% do alcance)."],
  ["Visitas ao perfil", "17.460", "≈ 7,1% do alcance — o perfil recebe visita; bio e destaques precisam converter."],
  ["Cliques no link da bio", "1.101", "≈ 6,3% das visitas ao perfil. Link com 16 botões e sem aniversário: é onde há folga."],
];

const FORMATOS: readonly (readonly string[])[] = [
  ["Reel", "14", "17.562", "6.387", "94", "185", "2.356"],
  ["Foto", "16", "2.672", "2.099", "1", "1", "14"],
  ["Carrossel", "7", "2.192", "2.398", "3", "7", "28"],
];

const FATOS = [
  "Fato: Reels entregam 6,6× o alcance médio de uma foto e centenas de vezes mais envios; foto e carrossel ficam em ≈ 2% da base (os piores, ≈ 600–700 de alcance: cartaz/foto de drinks de 11/10, carrossel Outubro Rosa de 19/10, foto do risoto de 06/10).",
  "Fato: os Reels que mais alcançaram são momentos reais de samba/pagode com legenda curta (\"quem mais?\", \"Aí não dá né\", \"Amamos samba!\"). Os piores Reels são mais institucionais ou de chamada.",
  "Hipótese: o que viraliza é a emoção do público cantando, não o produto nem a chamada. Vale testar mais Reels desse tipo, com a venda (reserva) no Story e no link — não na legenda do Reel.",
  "Hipótese: fotos e carrosséis estão sendo usados como divulgação (cartaz, prato, campanha), formato que pouco alcança. O carrossel só deve ficar onde é utilidade (programação por dia, como reservar).",
  "Limite dos dados: a API não traz horário de pico por post nem reservas geradas. Reels por dia da semana têm só 1–3 amostras cada. Não dá para concluir o melhor dia ainda.",
];

const MUDANCAS = [
  "Reels de 1 por semana para 4, priorizando momentos de samba/pagode do público e legenda curta. Medir pela mediana de alcance (hoje 6.387), não pela média.",
  "Reduzir fotos de divulgação (16 em 60 dias, alcance mediano 2.099) e trocar parte por Reels ou por carrosséis de utilidade.",
  "Atacar o clique no link (6,3% das 17 mil visitas): reduzir os 16 botões, incluir Aniversário/Reserva no topo e auditar o site. Cada ponto percentual a mais são ≈ 175 cliques por mês.",
  "Não prometer viral: os dois recordes mostram que o teto é alto, mas o piso de um Reel (2.341–2.601) é parecido com o de uma foto mediana — o ganho vem de consistência.",
];

const DIAGNOSTICO: readonly (readonly string[])[] = [
  ["Bio confusa", "Tenta falar de tudo (bar, balada, restaurante, eventos) sem uma frase-âncora", "Bio em 4 blocos (o que é + pra quem + prova + CTA) — etapa 1"],
  ["Falta de informação", "Horários, programação, preços de entrada e como reservar não estão fixos no perfil", "Destaques Programação, Reservas e Cardápio — etapa 2"],
  ["Posts que não engajam", "Conteúdo de divulgação sem gancho, sem formato certo para o objetivo", "Pilares + Reels (alcance) / Carrosséis (salvar) / Stories (conversão) — etapas 3 e 4"],
  ["Poucos posts dos pontos fortes", "Pontos fortes reais da casa não viram conteúdo recorrente", "Pilar Autoridade: chope gelado, roda de samba, palco 360º, feijoada, boteco contemporâneo"],
  ["Foco só em captação de aniversário", "Venda demais, relação de menos; quem não vai fazer aniversário não tem motivo para seguir", "Regra 60/25/15: 60% conexão e autoridade, 25% utilidade, 15% venda explícita"],
  ["Contato de reserva difuso", "Sem caminho único e curto até a reserva", "1 link na bio com botões por objetivo + CTA padronizado em todo conteúdo"],
];

export function MarketingInstagramLeitura() {
  return (
    <>
      <Recolhivel titulo="Avaliação com dados reais da conta (API oficial, 21/10/2026)" inicioAberto>
        <p className="sjNote"><b>Fonte:</b> API oficial do Instagram, lida em 21/10/2026 (sem avisos). Janela de 30 dias para os totais; posts de 23/08 a 20/10 (37 posts) para os formatos. O que for opinião está marcado como hipótese. Estes números são a leitura datada e não alimentam os cards de indicadores reais.</p>
        <h4 className="sjMkH4">Números da conta (30 dias)</h4>
        <Tabela colunas={["Indicador", "Valor", "Leitura"]} linhas={CONTA.map(([indicador, valor, leitura]) => [indicador, <b key={indicador}>{valor}</b>, leitura])} />
        <h4 className="sjMkH4">Desempenho por formato (média por post)</h4>
        <Tabela colunas={["Formato", "Posts", "Alcance médio", "Alcance mediano", "Salvos", "Envios", "Interações"]} linhas={FORMATOS} />
        <p className="sjMini">Mesmo tirando os dois Reels virais (81 mil e 71 mil de alcance, 62% do alcance de todos os Reels), a média dos outros 12 Reels é 7.839 — cerca de 3× o de uma foto. Salvamentos por 1.000 alcançados: Reel 5,3 × foto 0,4.</p>
        <h4 className="sjMkH4">O que os dados mostram</h4>
        <ul className="sjMkLista">{FATOS.map((item) => <li key={item}>{item}</li>)}</ul>
        <h4 className="sjMkH4">O que muda no plano</h4>
        <ul className="sjMkLista">{MUDANCAS.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="sjMini"><b>Próxima medição:</b> repetir em 21/11 e comparar mediana de alcance dos Reels, salvos por 1.000 alcançados, taxa de clique no link e reservas com origem Instagram (a origem vem do BI, não da API). Metas numéricas: definir depois de 30 dias do novo ritmo.</p>
      </Recolhivel>
      <Recolhivel titulo="Ponto de partida: o que incomoda × o que fazer" inicioAberto>
        <Tabela colunas={["O que incomoda hoje", "Causa provável", "Correção neste plano"]} linhas={DIAGNOSTICO} />
        <p className="sjMini"><b>Cruzamento com o BI (Insights, 8 semanas fechadas):</b> terça, quarta, quinta e domingo aparecem como dias fracos (problema de fluxo); sábado como dia forte; sexta como médio. Por isso o plano concentra os Reels de convite nos dias fracos e usa o sábado para captar aniversário e evento. Reconfira o Insights toda segunda-feira.</p>
      </Recolhivel>
    </>
  );
}
