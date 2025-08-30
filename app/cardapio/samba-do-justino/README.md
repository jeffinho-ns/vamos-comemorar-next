# Samba do Justino - Cardápio

## Alterações Realizadas

### Header Redesenhado
- **Removido**: Header azul original com fundo gradiente
- **Adicionado**: Novo header com banners rotativos e logo overlay

### Estrutura do Header
1. **Logo Overlay**: 
   - Posicionada no canto esquerdo superior dos banners
   - Arquivo: `/public/samba-do-justino.png`
   - Fundo branco semi-transparente com blur e bordas arredondadas
   - Sombra para destaque visual
   - Animação de hover e clique
   - Ícone musical animado com drop-shadow
   - **Tamanho**: Reduzida (h-10) para não interferir no banner
   - **Funcionalidade**: Abre sidebar ao clicar

2. **Banners Rotativos**:
   - Substituíram o header azul
   - Imagens: 
     - `/banne-agilizai-mobile.jpg` (link para `/decoracao-aniversario`)
     - `/banne-oniphotos-mobile.jpg` (link para `https://oniphotos.com/`)
   - Rotação automática a cada 5 segundos
   - Indicadores visuais na parte inferior
   - Links funcionais mantidos
   - **Tamanho**: Aumentado para visualização completa (h-80 md:h-96)

### Sidebar Interativo
- **Acesso**: Clicando na logo no canto esquerdo dos banners
- **Layout**: Sidebar deslizante da esquerda
- **Conteúdo**:
  - **Header**: Logo + título + botão de fechar
  - **Informações do Evento**:
    - Data: 30 de Agosto
    - Local: Mirante
    - Horário: 21h às 02h
  - **Descrição**: "Uma noite especial com samba, drinks e muita animação! 🎵✨"
  - **Open Bar Preview**: Informações sobre bebidas inclusas
  - **Patrocinadores**: Lista dos patrocinadores do evento

### Melhorias Visuais
- **Responsividade**: Layout adaptável para mobile e desktop
- **Animações**: Transições suaves com Framer Motion
- **Indicadores**: Pontos indicadores para os banners
- **Efeitos**: Gradientes e sombras para melhor aparência
- **Sidebar**: Animação spring para abertura/fechamento

### Funcionalidades Mantidas
- ✅ Rotação automática dos banners
- ✅ Links funcionais dos banners
- ✅ Tracking do Google Analytics
- ✅ Cardápio completo com categorias
- ✅ Seção Open Bar
- ✅ Animações e transições

### Novas Funcionalidades
- ✅ Logo clicável que abre sidebar
- ✅ Sidebar com informações completas do evento
- ✅ Overlay para fechar sidebar
- ✅ Tracking de clique na logo

### Arquivos de Imagem Utilizados
- `/public/samba-do-justino.png` - Logo principal
- `/public/banne-agilizai-mobile.jpg` - Banner Agilizai
- `/public/banne-oniphotos-mobile.jpg` - Banner Oni Photos

### Tecnologias Utilizadas
- Next.js 15
- Framer Motion (animações)
- Tailwind CSS (estilização)
- React Icons (ícones)
- Google Analytics (tracking)

## Como Testar
1. Execute `npm run dev`
2. Acesse `/cardapio/samba-do-justino`
3. Verifique a logo no canto esquerdo dos banners
4. Clique na logo para abrir o sidebar
5. Teste o fechamento do sidebar (clique no X ou no overlay)
6. Verifique a rotação dos banners
7. Teste os links dos banners
8. Verifique a responsividade em diferentes tamanhos de tela

## Interações do Usuário
- **Logo**: Clique para abrir sidebar com informações do evento
- **Banners**: Clique para navegar para os links (Agilizai ou Oni Photos)
- **Sidebar**: Clique no X ou no overlay para fechar
- **Cardápio**: Navegação por categorias e visualização de produtos


