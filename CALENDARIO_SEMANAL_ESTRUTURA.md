# Estrutura do Calendário Semanal Melhorado

## Diagrama de Componentes

```
WeeklyCalendar
├── Header da Semana
│   ├── Navegação (Anterior, Hoje, Próximo)
│   ├── Informações da Semana (Data, Estatísticas)
│   └── Controles (Grade/Detalhado, Mostrar/Ocultar Vazios)
├── Visualização em Grade
│   ├── Cabeçalho dos Dias
│   │   ├── Coluna de Horários
│   │   └── Colunas dos 7 Dias (Dom-Sáb)
│   └── Slots de Horário
│       ├── Coluna de Horário (18:00-23:30)
│       └── Reservas por Dia/Horário
│           ├── Indicador de Quantidade
│           ├── Botão Adicionar (se vazio)
│           └── Cards de Reserva
│               ├── Nome do Cliente
│               ├── Status (Confirmada, Check-in, etc.)
│               ├── Informações (Pessoas, Área, Mesa, Telefone)
│               └── Botões de Ação (Editar, Excluir)
└── Visualização Detalhada
    └── Cards por Dia
        ├── Header do Dia (Data, Estatísticas, Botão Nova Reserva)
        └── Grid de Horários
            └── Card por Horário
                ├── Header (Horário, Contadores)
                ├── Lista de Reservas (se houver)
                └── Botão Adicionar (se vazio)
```

## Fluxo de Dados

```
API (restaurant-reservations)
    ↓
loadEstablishmentData()
    ↓
setReservations()
    ↓
weekData (useMemo)
    ├── Filtra reservas por data
    ├── Agrupa por horário
    ├── Calcula estatísticas
    └── Organiza por dia da semana
    ↓
Renderização
    ├── Visualização em Grade
    └── Visualização Detalhada
```

## Estados do Componente

```typescript
interface WeeklyCalendarState {
  currentWeek: Date           // Semana atual selecionada
  viewMode: 'grid' | 'detailed'  // Tipo de visualização
  showEmptySlots: boolean     // Mostrar slots vazios
}
```

## Dados Processados

```typescript
interface DayData {
  date: Date                  // Data do dia
  dayName: string            // Nome do dia (Segunda, Terça, etc.)
  dayNumber: string          // Número do dia (01, 02, etc.)
  monthName: string          // Nome do mês (Jan, Fev, etc.)
  timeSlots: TimeSlot[]      // Slots de horário do dia
  totalReservations: number  // Total de reservas do dia
  totalPeople: number        // Total de pessoas do dia
}

interface TimeSlot {
  time: string               // Horário (18:00, 18:30, etc.)
  reservations: Reservation[] // Reservas neste horário
  totalPeople: number        // Total de pessoas neste horário
}
```

## Funcionalidades por Visualização

### Visualização em Grade
- **Layout**: Tabela com dias nas colunas e horários nas linhas
- **Uso**: Visão geral rápida da semana
- **Ideal para**: Controle diário e identificação de padrões

### Visualização Detalhada
- **Layout**: Cards expandidos por dia e horário
- **Uso**: Gestão detalhada de cada reserva
- **Ideal para**: Edição e análise profunda

## Integração com API

### Endpoints Utilizados
- `GET /api/restaurant-reservations?establishment_id={id}`
- `POST /api/restaurant-reservations`
- `PUT /api/restaurant-reservations/{id}`
- `DELETE /api/restaurant-reservations/{id}`

### Filtros Aplicados
- **Estabelecimento**: Filtra por establishment_id
- **Data**: Processa datas em formato ISO
- **Status**: Mantém todos os status de reserva

## Responsividade

### Breakpoints
- **Mobile**: Scroll horizontal na grade
- **Tablet**: Grid adaptativo na visualização detalhada
- **Desktop**: Layout completo com todas as funcionalidades

### Adaptações
- **Grade**: Largura mínima de 1000px com scroll
- **Detalhada**: Grid responsivo (1-3 colunas)
- **Cards**: Tamanho adaptativo baseado no conteúdo

