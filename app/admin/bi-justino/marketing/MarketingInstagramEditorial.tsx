"use client";

import { Recolhivel, Tabela } from "./MarketingInstagramUi";

const PILARES: readonly (readonly string[])[] = [
  ["1. Conexão", "Roda de samba, palco 360º, gente cantando, o chope tirado, bastidores da equipe, o clima do boteco", "Topo — descoberta e identificação", "35%"],
  ["2. Autoridade", "Chope extremamente gelado e o ritual, feijoada, petiscos, a história da casa, parceiros, bastidores da cozinha e do bar", "Meio — prova de qualidade e diferencial", "25%"],
  ["3. Utilidade", "O que tem em cada dia, guia de happy hour, roteiro Vila Madalena/Beco do Batman, como reservar, o que levar no aniversário", "Meio — salvamentos e compartilhamentos", "25%"],
  ["4. Venda", "Aniversário, evento corporativo e social, promoção do dia, abertura de agenda — com oferta e CTA claros", "Fundo — conversão em reserva ou orçamento", "15%"],
];

const GRADE: readonly (readonly string[])[] = [
  ["Segunda — casa fechada", "—", "Programação da semana (salvar)", "Enquete de happy hour; bastidores", "Planejar a semana; atualizar o destaque Programação"],
  ["Terça", "Reel de convite: chope pela metade + som ambiente, terça de conversa", "—", "Teaser da roda de quarta; contagem regressiva", "Dia fraco no BI → gerar fluxo"],
  ["Quarta", "—", "Venda: aniversário ou evento corporativo (alternar)", "Open de chope; roda de samba ao vivo; CTA de reserva", "Dia fraco → fluxo + captação"],
  ["Quinta", "Roda de samba (clima + chope pela metade até 0h)", "—", "Ao vivo da roda; enquete quem vem", "Dia fraco → fluxo"],
  ["Sexta", "Teaser do palco 360º (bandas 20h–2h, DJ até 3h) — quinta à noite ou sexta ao meio-dia", "—", "Stories da noite; reserva de última hora", "Dia médio → empurrar para forte"],
  ["Sábado", "—", "—", "Jornada do dia em blocos (14h→5h); captar aniversário e evento", "Dia forte → converter público engajado"],
  ["Domingo", "Feijoada + roda de samba 15h–18h — sábado à noite ou domingo de manhã", "—", "Fila da feijoada; último dia da semana", "Dia fraco → família e grupos"],
];

const REEL: readonly (readonly string[])[] = [
  ["0–3 s • Gancho", "Corte rápido: balão estourando + chope sendo tirado. Fala: “Vai fazer aniversário na Vila Madalena? Antes de reservar em qualquer lugar, vê isso.”", "ANIVERSÁRIO NA VILA?"],
  ["3–10 s", "Mesa decorada, grupo chegando, brinde. “Mesa decorada, chope extremamente gelado e palco 360º tocando samba.”", "Mesa decorada • Chope gelado • Samba ao vivo"],
  ["10–20 s", "Três cortes: entrada do aniversariante, benefício para o grupo, roda de samba. “Aniversariante com reserva tem benefício a partir de [__] convidados.” (preencher conforme a regra vigente)", "Reserva = benefício pro aniversariante"],
  ["20–27 s • Prova social", "Foto ou vídeo curto de um aniversário real, com autorização, ou depoimento de 5 s.", "Mais de [__] aniversários aqui (só se for verdade)"],
  ["27–30 s • CTA", "“Comenta ANIVERSÁRIO que eu te mando o passo a passo da reserva — ou chama no link da bio.”", "COMENTA ANIVERSÁRIO"],
];

const CARROSSEL: readonly (readonly string[])[] = [
  ["1 — Capa", "“Qual dia do Seu Justino combina com você?” Fundo carvão, título creme, destaque terracota."],
  ["2 — Terça", "“Pra conversar sem pressa”: som ambiente e chope pela metade até 1h."],
  ["3 — Quarta", "“Pra sambar no meio da semana”: roda de samba + open de chope Heineken/Amstel R$ 69,90 até 23h (confirmar)."],
  ["4 — Quinta", "“Roda de samba + chope pela metade até 0h”."],
  ["5 — Sexta", "“Pra virar a noite”: bandas 20h–2h, DJ até 3h, palco 360º."],
  ["6 — Sábado", "“O dia inteiro”: das 14h às 5h, atrações mudando em blocos."],
  ["7 — Domingo", "“Feijoada em família”: buffet até 17h e roda de samba 15h–18h (valor: confirmar)."],
  ["8 — CTA", "“Salva e manda pra galera que combina com o seu dia. Reserve pelo link da bio (aniversários e eventos também).”"],
];

const FORMATOS = [
  "Reels (alcance): 15–30 s, gancho nos 3 primeiros segundos, legenda queimada, áudio da própria casa quando possível.",
  "Carrosséis (salvamento): capa forte + 1 ideia por slide + CTA “salva e manda pra galera”.",
  "Stories (conexão e venda): 1 elemento interativo e 1 CTA por dia para a reserva.",
  "Revisão semanal: toda segunda, abra o Insights do BI, veja o dia-foco e ajuste o Reel da semana para ele.",
];

export function MarketingInstagramEditorial() {
  return (
    <>
      <Recolhivel titulo="3. Linha editorial e pilares de conteúdo">
        <Tabela colunas={["Pilar", "O que publicar", "Papel no funil", "Peso"]} linhas={PILARES} />
        <p className="sjMini"><b>Regra de ouro:</b> a cada 1 post de venda, publique pelo menos 5 de conexão, autoridade ou utilidade. A captação vira consequência do conteúdo que ensina e emociona.</p>
      </Recolhivel>
      <Recolhivel titulo="4. Cronograma semanal e formatos">
        <p className="sjNote"><b>Ponto de partida real (API, 22/09–21/10):</b> 15 publicações em 30 dias, 4 Reels (≈ 1 por semana). <b>Cadência sugerida:</b> 4 Reels • 2 carrosséis • Stories em todo dia de funcionamento, 5 a 8 por dia. Teste horários por 3–4 semanas e ajuste pelos Insights da conta.</p>
        <Tabela colunas={["Dia", "Reels", "Carrossel", "Stories", "Objetivo (cruzado com o BI)"]} linhas={GRADE} />
        <ul className="sjMkLista">{FORMATOS.map((item) => <li key={item}>{item}</li>)}</ul>
      </Recolhivel>
      <Recolhivel titulo="5. Scripts de validação (Reels + Carrossel)">
        <h4 className="sjMkH4">Reels de alta retenção — “Aniversário no Seu Justino em 30 segundos”</h4>
        <Tabela colunas={["Tempo", "Cena / fala", "Texto na tela"]} linhas={REEL} />
        <p className="sjMini"><b>Execução:</b> vertical 9:16, legenda queimada, cortes de 1–3 s, luz real do bar, áudio da casa. <b>Legenda:</b> “Aniversário na Vila Madalena com roda de samba, chope gelado e palco 360º. Comenta ANIVERSÁRIO e reserve pelo link da bio.” <b>Sucesso:</b> retenção até o fim, compartilhamentos e DMs com a palavra-chave.</p>
        <h4 className="sjMkH4">Carrossel estratégico — “Qual dia do Seu Justino combina com você?”</h4>
        <Tabela colunas={["Slide", "Conteúdo"]} linhas={CARROSSEL} />
        <p className="sjMini"><b>Legenda:</b> “Seu Justino, bar na Vila Madalena com roda de samba, pagode, chope gelado e feijoada aos domingos. Qual dia combina com você? Salva este post, marca quem vai com você e reserve pelo link da bio. Aniversários e eventos corporativos também.” <b>Por que funciona:</b> é utilidade (vira guia salvo), o formato por slides aumenta o tempo de permanência e a pergunta da capa convida ao comentário — e alimenta os dias fracos do BI.</p>
      </Recolhivel>
    </>
  );
}
