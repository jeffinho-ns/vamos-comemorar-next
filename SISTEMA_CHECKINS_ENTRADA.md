# Sistema de Check-ins na Entrada

## 📋 Visão Geral

Página dedicada para facilitar o trabalho do pessoal na entrada do estabelecimento, permitindo check-in rápido e organizado de todos os tipos de visitantes.

## 🎯 Funcionalidades Implementadas

### 1. **Menu de Navegação**
- Botão "Check-ins" adicionado ao menu admin e promoter
- Posicionado logo abaixo do "Scanner QR Code"
- Ícone: `MdCheckCircle`

### 2. **Filtros Intuitivos**
A página possui 4 filtros principais:

#### **Estabelecimento**
- Seleção do estabelecimento para visualizar check-ins

#### **Data**
- Seletor de data para ver check-ins do dia específico
- Padrão: data atual

#### **Período**
- **Todos**: Todos os horários
- **Almoço**: 11h às 15h
- **Tarde**: 15h às 18h
- **Jantar**: 18h às 22h
- **Noite**: 22h em diante

#### **Busca**
- Busca por nome, telefone ou qualquer informação
- Campo com clear button (X)
- Busca em tempo real

### 3. **Estatísticas em Tempo Real**

Dashboard com 4 cards mostrando:
- **Reservas**: Check-ins feitos / Total de reservas
- **Convidados (Reservas)**: Check-ins feitos / Total de convidados
- **Promoters**: Check-ins feitos / Total de promoters
- **Convidados (Promoters)**: Check-ins feitos / Total de convidados

### 4. **Seções de Check-in**

#### **🔷 Reservas de Mesas**
- Mostra todas as reservas normais e grandes
- Informações exibidas:
  - Nome do cliente
  - Horário da reserva
  - Número de pessoas
  - Mesa (quando disponível)
  - Tipo de evento (para reservas grandes)
- Cards com cores:
  - **Branco**: Aguardando check-in
  - **Verde**: Check-in realizado
- Botão grande: "Fazer Check-in"

#### **🔷 Convidados de Reservas**
- Lista todos os convidados das listas de reservas
- Informações:
  - Nome do convidado
  - Nome do dono da lista
  - WhatsApp
  - Tipo de evento
- Cores similares ao anterior
- Botão: "Fazer Check-in"

#### **🔷 Promoters**
- Exibe promoters dos eventos do dia
- Card com fundo laranja
- Informações:
  - Nome do promoter
  - Evento
  - Telefone
- Apenas informativo (check-in a ser implementado no backend)

#### **🔷 Convidados de Promoters**
- Lista convidados das listas de eventos
- Informações:
  - Nome do convidado
  - Nome do promoter
  - Evento
  - Telefone
  - Badge VIP (quando aplicável ⭐)
- Status visual:
  - **Branco**: Pendente
  - **Verde**: Check-in feito
  - **Vermelho**: No-Show
- Botão: "Fazer Check-in"

## 🎨 Design e UX

### Cores por Categoria
- **Azul** (`border-blue-500`): Reservas de mesas
- **Roxo** (`border-purple-500`): Convidados de reservas
- **Laranja** (`border-orange-500`): Promoters
- **Verde** (`border-green-500`): Convidados de promoters

### Feedback Visual
- ✅ Check-mark verde quando check-in realizado
- ⏳ Estado pendente com hover azul
- Animações suaves ao carregar (framer-motion)
- Horário do check-in exibido após confirmação

### Responsividade
- Grid adaptável: 1 coluna (mobile) → 3 colunas (desktop)
- Filtros em grid responsivo
- Cards com tamanho adequado para toque

## 🔌 Integração com API

### Endpoints Utilizados

#### Reservas
- `GET /api/restaurant-reservations?establishment_id={id}&date={date}`
- `GET /api/large-reservations?establishment_id={id}&date={date}`
- `POST /api/restaurant-reservations/{id}/checkin`
- `POST /api/large-reservations/{id}/checkin`

#### Listas de Convidados
- `GET /api/admin/guest-lists?month={month}&establishment_id={id}`
- `GET /api/admin/guest-lists/{id}/guests`
- `POST /api/admin/guests/{id}/checkin`

#### Eventos e Promoters
- `GET /api/v1/eventos?date={date}`
- `GET /api/v1/eventos/{id}/promoters`
- `GET /api/v1/eventos/{id}/promoter/{promoter_id}/listas`
- `PUT /api/v1/eventos/checkin/{convidado_id}`

## 🚀 Como Usar

### Para o Pessoal da Entrada

1. **Acesse a página**: Menu lateral → "Check-ins"

2. **Configure os filtros**:
   - Selecione o estabelecimento
   - Confirme a data (geralmente já é a data atual)
   - Escolha o período se necessário (almoço, jantar, etc.)

3. **Localize a pessoa**:
   - Use a busca digitando o nome ou telefone
   - Ou navegue pelos cards visualmente

4. **Faça o check-in**:
   - Clique no botão verde "Fazer Check-in"
   - Aguarde a confirmação (✅)
   - O card ficará verde automaticamente

5. **Atualize quando necessário**:
   - Clique no botão "Atualizar" no topo

## 💡 Dicas de Uso

- **Busca rápida**: Digite qualquer parte do nome ou número
- **Estatísticas**: Veja o progresso em tempo real no topo
- **Cores**: Cada seção tem uma cor para facilitar a identificação
- **VIP**: Convidados VIP têm estrela dourada ⭐
- **Mobile friendly**: Funciona perfeitamente em tablets na entrada

## 📱 Acesso

**URL**: `/admin/checkins`

**Permissões**: 
- ✅ Admin
- ✅ Promoter

## 🎯 Benefícios

1. **Rapidez**: Check-in com um clique
2. **Organização**: Tudo separado por categoria
3. **Visibilidade**: Estatísticas em tempo real
4. **Busca**: Encontre qualquer pessoa rapidamente
5. **Filtros**: Veja apenas o que importa (horário, data)
6. **Sem confusão**: Cores e ícones diferentes para cada tipo

## 🔄 Atualizações Futuras (Sugestões)

- [ ] Check-in em lote (múltiplos convidados)
- [ ] Histórico de check-ins do dia
- [ ] Notificações sonoras ao fazer check-in
- [ ] QR Code reader integrado
- [ ] Impressão de relatório do dia
- [ ] Check-in de promoters no backend
- [ ] Modo offline com sincronização posterior

---

**Desenvolvido em**: 28/10/2024  
**Localização**: `vamos-comemorar-next/app/admin/checkins/page.tsx`

