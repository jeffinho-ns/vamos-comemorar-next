"use client";

import { Recolhivel, Tabela } from "./MarketingInstagramUi";

const CORES = [
  { hex: "#C0622D", texto: "#C0622D terracota / laranja queimado — calor e boteco (cor de destaque)", borda: false },
  { hex: "#1A1410", texto: "#1A1410 carvão — fundo noturno, palco", borda: true },
  { hex: "#F2B84B", texto: "#F2B84B âmbar — chope gelado, brilho", borda: false },
  { hex: "#F6EFE6", texto: "#F6EFE6 creme — textos e respiro", borda: false },
  { hex: "#1F5B3E", texto: "#1F5B3E verde garrafa — acento pontual", borda: false },
];

const BIOS: readonly (readonly string[])[] = [
  ["A", "Bar, samba e boteco contemporâneo na Vila Madalena 🍻 Aniversários, eventos e happy hour. Reserve pelo link 👇 (108)", "Clareza geral: o que é + pra quem + CTA"],
  ["B", "Chope gelado, samba e pagode no coração da Vila Madalena | Aniversários e eventos corporativos | Reserva no link 👇 (114)", "Captação de aniversário e corporativo"],
  ["C", "O boteco da Vila Madalena: roda de samba, feijoada no domingo e palco 360º | Aniversários e eventos 🎉 Reserve 👇 (111)", "Diferenciais reais da casa (Manual Operacional)"],
];

const DESTAQUES: readonly (readonly string[])[] = [
  ["Reservas", "Como reservar (passo a passo em 3 stories), tolerância de 15 minutos, horário de cada dia, botão/WhatsApp. Atualize quando mudar a regra."],
  ["Programação", "Um story por dia: terça som ambiente + chope pela metade até 1h • quarta roda de samba + open de chope Heineken/Amstel R$ 69,90 até 23h • quinta roda de samba + chope pela metade até 0h • sexta bandas 20h–2h, DJ até 3h, palco 360º • sábado 14h–5h em blocos • domingo feijoada até 17h e roda de samba 15h–18h. (Manual Operacional ago/2026 — confirmar antes de publicar)"],
  ["Aniversário", "Como funciona, benefícios vigentes (confirmar — o Manual de Marketing 2022 citava mesa decorada com balões, entrada VIP para o aniversariante e benefício por nº de convidados), fotos reais de comemorações com autorização, depoimentos."],
  ["Eventos", "Corporativo e social: espaços, capacidade, exemplos reais, como pedir orçamento, perguntas frequentes."],
  ["Cardápio", "Chope e caipirinhas, petiscos campeões, feijoada de domingo (R$ 89,90 — confirmar), couvert por dia. Foto boa + preço atualizado."],
];

export function MarketingInstagramPerfil() {
  return (
    <>
      <Recolhivel titulo="1. Otimização do perfil (bio e @)">
        <h4 className="sjMkH4">Nome de usuário (@) e nome do perfil</h4>
        <ul className="sjMkLista">
          <li><b>Mantenha o @seujustino.</b> Trocar o @ de uma marca conhecida custa reconhecimento e links antigos; o ganho de busca vem do campo Nome, que o Instagram indexa. Se o @ for compartilhado entre Madalena, Itaim e Tatuapé, vale uma conta por unidade — confirmar a estrutura atual.</li>
          <li>Campo Nome (máx. 30 caracteres): <b>Seu Justino Vila Madalena</b> (25, recomendada para busca por bairro); <b>Seu Justino | Bar & Samba</b> (25); <b>Seu Justino | Bar e Eventos</b> (27).</li>
          <li>Categoria do perfil: <b>Bar</b> (ou Restaurante / Casa de shows se o objetivo de eventos pesar mais). Preencha endereço, horário e botão de reserva no perfil profissional.</li>
        </ul>
        <h4 className="sjMkH4">3 biografias (limite 150 caracteres — todas conferidas)</h4>
        <Tabela colunas={["#", "Bio", "Foco"]} linhas={BIOS} />
        <p className="sjMini"><b>Prova social real hoje: 128 mil seguidores.</b> Exemplo: “+128 mil amigos no Instagram | Bar e samba na Vila Madalena 🍻 Aniversários e eventos | Reserve 👇” (até 150 caracteres; atualize o número quando mudar). Use só o que for verdadeiro: “desde 2012” (confirmar — o Manual de Marketing 2022 cita a reabertura em 2012), “capacidade para 380 pessoas” (Manual Operacional), “+ de X aniversários” e “nota X no Google” (preencher).</p>
        <h4 className="sjMkH4">Link da bio (árvore de links)</h4>
        <p className="sjMini"><b>Hoje:</b> seujustino.com.br/link tem 16 botões e nenhum de aniversário. Reduza para os 6 abaixo, troque rótulos vagos por verbos claros e audite os links ocultos de apostas encontrados na página.</p>
        <ol className="sjMkOl">
          <li><b>🎂 Reservar aniversário</b> — WhatsApp com mensagem pronta (“Oi! Quero reservar aniversário para __ pessoas no dia __”).</li>
          <li><b>🏢 Eventos corporativos e sociais</b> — formulário curto de orçamento (data, nº de pessoas, tipo de evento).</li>
          <li><b>🍻 Reserva de mesa</b> — botão do Instagram/WhatsApp (tolerância de 15 minutos, conforme Manual Operacional).</li>
          <li><b>📅 Programação da semana</b> — imagem ou página atualizada toda segunda.</li>
          <li><b>🍽️ Cardápio</b> e <b>📍 Como chegar</b> (mapa).</li>
        </ol>
        <p className="sjMini">Use um único destino principal para reserva (um número de WhatsApp).</p>
      </Recolhivel>
      <Recolhivel titulo="2. Identidade visual e destaques">
        <h4 className="sjMkH4">Paleta sugerida <span className="sjMini">alinhe com a identidade já existente da marca, se houver — Criação e Design</span></h4>
        <div className="sjMkPaleta">
          {CORES.map((cor) => (
            <div key={cor.hex} className="sjMkCor">
              <div className={`sjMkAmostra${cor.borda ? " sjMkAmostraBorda" : ""}`} style={{ background: cor.hex }} />
              <p className="sjMini"><b>{cor.hex}</b> {cor.texto.replace(cor.hex, "").trim()}</p>
            </div>
          ))}
        </div>
        <ul className="sjMkLista">
          <li><b>Estilo:</b> boteco contemporâneo — fotografia quente e real (luz ambiente, gente em movimento, mão no chope, palco 360º), sem banco de imagem. Textos grandes e curtos sobre fundo escuro; no máximo 2 fontes.</li>
          <li><b>Capas dos Reels e carrosséis</b> com o mesmo molde (fundo carvão + título creme + destaque em terracota/âmbar).</li>
          <li>Regra do grid: alternar ambiente, pessoas, comida-bebida e texto para o perfil contar a história em 3 segundos.</li>
        </ul>
        <h4 className="sjMkH4">5 destaques essenciais</h4>
        <p className="sjMini"><b>Hoje o perfil tem 7:</b> Réveillon, Informações, Aniversário, Justinou, Delivery, Menu, Eventos. Manter Aniversário, Eventos e Menu; transformar Informações em Reservas; criar Programação; mandar Réveillon e Delivery para o fim e usar Justinou para clima de clientes.</p>
        <Tabela colunas={["Destaque", "O que fixar dentro (para reter e converter)"]} linhas={DESTAQUES} />
        <p className="sjMini">Capas dos destaques: ícone simples em terracota sobre carvão, mesmo traço — nome com no máximo 10 caracteres.</p>
      </Recolhivel>
    </>
  );
}
