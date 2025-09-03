# Sistema de Reservas do Restaurante - Integração

## Visão Geral

Este documento descreve a integração completa do sistema de reservas do restaurante no projeto `vamos-comemorar-next`. O sistema foi projetado para gerenciar reservas, passantes (walk-ins), lista de espera e relatórios de um restaurante.

## Estrutura do Sistema

### 1. Páginas Criadas

- **Dashboard Principal**: `/admin/restaurant-reservations`
- **Gestão de Passantes**: `/admin/walk-ins`
- **Lista de Espera**: `/admin/waitlist`
- **Relatórios**: `/admin/reports`
- **Configurações**: `/admin/settings`

### 2. Componentes Reutilizáveis

- **ReservationModal**: Modal para criar/editar reservas
- **WalkInModal**: Modal para criar/editar passantes
- **WaitlistModal**: Modal para gerenciar lista de espera

### 3. APIs Criadas (Frontend)

Todas as APIs do frontend fazem proxy para o backend `vamos-comemorar-api`:

- `/api/restaurant-reservations` - CRUD de reservas
- `/api/walk-ins` - CRUD de passantes
- `/api/waitlist` - CRUD de lista de espera
- `/api/restaurant-areas` - CRUD de áreas do restaurante
- `/api/special-dates` - CRUD de datas especiais
- `/api/reports/reservations` - Relatórios de reservas

## Integração com Backend

### Endpoints Necessários no Backend

O backend `vamos-comemorar-api` deve implementar os seguintes endpoints:

#### 1. Reservas do Restaurante
```
GET    /api/restaurant-reservations     - Listar reservas
POST   /api/restaurant-reservations     - Criar reserva
GET    /api/restaurant-reservations/:id - Buscar reserva específica
PUT    /api/restaurant-reservations/:id - Atualizar reserva
DELETE /api/restaurant-reservations/:id - Deletar reserva
```

#### 2. Passantes (Walk-ins)
```
GET    /api/walk-ins     - Listar passantes
POST   /api/walk-ins     - Criar passante
GET    /api/walk-ins/:id - Buscar passante específico
PUT    /api/walk-ins/:id - Atualizar passante
DELETE /api/walk-ins/:id - Deletar passante
```

#### 3. Lista de Espera
```
GET    /api/waitlist     - Listar lista de espera
POST   /api/waitlist     - Adicionar à lista de espera
GET    /api/waitlist/:id - Buscar entrada específica
PUT    /api/waitlist/:id - Atualizar entrada
DELETE /api/waitlist/:id - Remover da lista
```

#### 4. Áreas do Restaurante
```
GET    /api/restaurant-areas     - Listar áreas
POST   /api/restaurant-areas     - Criar área
GET    /api/restaurant-areas/:id - Buscar área específica
PUT    /api/restaurant-areas/:id - Atualizar área
DELETE /api/restaurant-areas/:id - Deletar área
```

#### 5. Datas Especiais
```
GET    /api/special-dates     - Listar datas especiais
POST   /api/special-dates     - Criar data especial
GET    /api/special-dates/:id - Buscar data específica
PUT    /api/special-dates/:id - Atualizar data especial
DELETE /api/special-dates/:id - Deletar data especial
```

#### 6. Relatórios
```
GET    /api/reports/reservations - Relatórios de reservas
```

## Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. restaurant_areas
```sql
CREATE TABLE `restaurant_areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity_lunch` int(11) DEFAULT 0,
  `capacity_dinner` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);
```

#### 2. restaurant_reservations
```sql
CREATE TABLE `restaurant_reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) NOT NULL,
  `client_phone` varchar(20) DEFAULT NULL,
  `client_email` varchar(255) DEFAULT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `number_of_people` int(11) NOT NULL DEFAULT 1,
  `area_id` int(11) NOT NULL,
  `table_number` varchar(50) DEFAULT NULL,
  `status` enum('NOVA','CONFIRMADA','CANCELADA','CONCLUIDA','NO_SHOW') DEFAULT 'NOVA',
  `origin` enum('WIDGET','TELEFONE','PESSOAL','SITE','OUTRO') DEFAULT 'WIDGET',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  KEY `created_by` (`created_by`),
  FOREIGN KEY (`area_id`) REFERENCES `restaurant_areas` (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
);
```

#### 3. walk_ins
```sql
CREATE TABLE `walk_ins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) NOT NULL,
  `client_phone` varchar(20) DEFAULT NULL,
  `number_of_people` int(11) NOT NULL DEFAULT 1,
  `arrival_time` timestamp NULL DEFAULT current_timestamp(),
  `area_id` int(11) DEFAULT NULL,
  `table_number` varchar(50) DEFAULT NULL,
  `status` enum('ATIVO','FINALIZADO','CANCELADO') DEFAULT 'ATIVO',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  KEY `created_by` (`created_by`),
  FOREIGN KEY (`area_id`) REFERENCES `restaurant_areas` (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
);
```

#### 4. waitlist
```sql
CREATE TABLE `waitlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) NOT NULL,
  `client_phone` varchar(20) DEFAULT NULL,
  `client_email` varchar(255) DEFAULT NULL,
  `number_of_people` int(11) NOT NULL DEFAULT 1,
  `preferred_time` time DEFAULT NULL,
  `status` enum('AGUARDANDO','CHAMADO','ATENDIDO','CANCELADO') DEFAULT 'AGUARDANDO',
  `position` int(11) DEFAULT NULL,
  `estimated_wait_time` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);
```

#### 5. special_dates
```sql
CREATE TABLE `special_dates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `capacity_lunch` int(11) DEFAULT 0,
  `capacity_dinner` int(11) DEFAULT 0,
  `is_blocked` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
);
```

## Navegação Integrada

O sistema foi integrado ao menu de administração existente. Os novos itens aparecem no menu lateral:

- Reservas Restaurante
- Passantes
- Lista de Espera
- Relatórios
- Configurações

## Funcionalidades Implementadas

### 1. Dashboard Principal
- Estatísticas em tempo real
- Reservas recentes
- Passantes ativos
- Ações rápidas
- Visão geral da ocupação

### 2. Gestão de Reservas
- Criar/editar/deletar reservas
- Filtros por data, status e área
- Status: Nova, Confirmada, Cancelada, Concluída, No Show
- Origem: Widget, Telefone, Pessoal, Site, Outro

### 3. Gestão de Passantes
- Registrar clientes que chegaram sem reserva
- Atribuir mesa e área
- Status: Ativo, Finalizado, Cancelado

### 4. Lista de Espera
- Adicionar clientes à lista de espera
- Horário preferido
- Status: Aguardando, Chamado, Atendido, Cancelado
- Posição na fila

### 5. Relatórios
- Relatórios de ocupação
- Análise de reservas por período
- Estatísticas de passantes
- Performance por área

### 6. Configurações
- Gerenciar áreas do restaurante
- Configurar datas especiais
- Definir capacidades
- Bloquear datas

## Próximos Passos

1. **Implementar endpoints no backend** `vamos-comemorar-api`
2. **Testar integração** entre frontend e backend
3. **Adicionar autenticação** e autorização
4. **Implementar notificações** em tempo real
5. **Adicionar exportação** de relatórios
6. **Implementar sistema de check-in** com QR Code

## Tecnologias Utilizadas

- **Frontend**: Next.js 13+, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express (vamos-comemorar-api)
- **Banco de Dados**: MySQL
- **Ícones**: React Icons (Material Design)

## Estrutura de Arquivos

```
vamos-comemorar-next/
├── app/
│   ├── admin/
│   │   ├── restaurant-reservations/
│   │   │   └── page.tsx
│   │   ├── walk-ins/
│   │   │   └── page.tsx
│   │   ├── waitlist/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── restaurant-reservations/
│   │   ├── walk-ins/
│   │   ├── waitlist/
│   │   ├── restaurant-areas/
│   │   ├── special-dates/
│   │   └── reports/
│   └── components/
│       ├── ReservationModal.tsx
│       ├── WalkInModal.tsx
│       └── WaitlistModal.tsx
└── MySql/
    └── u621081794_vamos.sql (atualizado)
```

O sistema está pronto para integração com o backend e pode ser facilmente expandido com novas funcionalidades conforme necessário.
