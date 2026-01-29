# 📋 Panorama Geral do Sistema de Reservas

## 🎯 Visão Geral

Sistema de gestão de reservas para múltiplos estabelecimentos (restaurantes e baladas) com regras específicas por tipo de estabelecimento e horários de funcionamento.

---

## 🏢 Tipos de Estabelecimentos

### 1. **Restaurantes** (Seu Justino ID 1, Pracinha ID 8)
- **Característica**: Reservas por algumas horas (geralmente 2h), não bloqueiam o dia todo
- **Disponibilidade**: Calculada por **overlap de horário** (dentro de 2h)
- **Regra de Giro**:
  - **1º Giro**: Reservas normais com mesa atribuída
  - **2º Giro**: Reservas viram "Espera Antecipada (Bistrô)" - sem mesa física

### 2. **Baladas** (Highline)
- **Característica**: Reservas bloqueiam a mesa para o **dia todo**
- **Disponibilidade**: Se há reserva confirmada em qualquer horário, mesa fica indisponível o dia inteiro
- **Área Deck (area_id = 2)**: Lógica especial de travamento

---

## ⏰ Regras de Horário (Justino/Pracinha)

### **Terça a Sexta**
- **1º Giro**: 18:00–21:00 → Reserva normal com mesa
- **2º Giro**: A partir de 21:00 (inclui madrugada até 06:00) → Espera Antecipada (Bistrô)

### **Sábado**
- **1º Giro**: 12:00–15:00 → Reserva normal com mesa
- **2º Giro**: A partir de 15:00 (inclui madrugada até 06:00) → Espera Antecipada (Bistrô)

### **Domingo**
- **1º Giro**: 12:00–15:00 → Reserva normal com mesa
- **2º Giro**: A partir de 15:00 → Espera Antecipada (Bistrô)

---

## 🔄 Fluxo de Disponibilidade de Mesas

### **Frontend (`ReservationModal.tsx`)**

#### 1. **Carregamento Inicial**
```typescript
useEffect(() => {
  loadTables();
}, [formData.area_id, formData.reservation_date, formData.reservation_time, ...]);
```
- **IMPORTANTE**: `reservation_time` está nas dependências para recalcular quando muda o horário

#### 2. **Ordem de Processamento** (CRÍTICO)

1. **Busca mesas do endpoint** `/api/restaurant-tables/:areaId/availability`
   - Endpoint retorna `is_reserved` baseado em bloqueio do dia todo (para outros estabelecimentos)
   - **Para Justino/Pracinha**: Endpoint sempre retorna `is_reserved: false` (backend já trata)

2. **Lógica do Highline (se aplicável)**
   - Se Highline + Deck: Busca reservas confirmadas e marca como indisponível

3. **Reset para Justino/Pracinha** ⚠️ **DEPOIS do Highline**
   ```typescript
   if (isSeuJustino || isPracinha) {
     fetched = fetched.map(t => ({ ...t, is_reserved: false }));
   }
   ```
   - **Por quê depois?** Para não ser sobrescrito pela lógica do Highline

4. **Cálculo de Overlap (Justino/Pracinha)**
   - Busca reservas ativas da data/área
   - Filtra status não-bloqueantes: `cancelada`, `completed`, `finalizada`, `no_show`, `espera antecipada`
   - Calcula overlap de horário (diferença < 2h)
   - Marca apenas mesas com overlap como `is_reserved: true`

5. **Aplicação do 2º Giro**
   ```typescript
   if (isSecondGiroBistro) {
     fetched = fetched.map(t => ({ 
       ...t, 
       is_reserved: false, // Mostrar como disponível
       is_second_giro: true // Flag para aviso visual
     }));
   }
   ```

#### 3. **Renderização**

- **Dropdown simples**: Mostra `🟡 (2º Giro - Espera Antecipada)` se `is_second_giro: true`
- **Checkboxes múltiplas**: Mostra aviso visual "🟡 2º Giro (Espera Antecipada)"
- **Aviso abaixo do horário**: Box laranja explicando que será convertido para Espera Antecipada

### **Backend (`restaurantReservations.js`)**

#### 1. **Validação de 2º Giro**
```javascript
const isSecondGiroBistro =
  (weekday >= 2 && weekday <= 5 && reservationMinutes >= 21 * 60) ||
  (weekday === 6 && reservationMinutes >= 15 * 60) ||
  (weekday === 0 && reservationMinutes >= 15 * 60);
```

#### 2. **Conversão Automática**
- Se `isSecondGiroBistro`:
  - `finalEsperaAntecipada = true`
  - `finalTableNumber = null`
  - Adiciona nota: "ESPERA ANTECIPADA (Bistrô)"
  - Cria entrada na `waitlist` automaticamente

---

## 🐛 Problemas Identificados e Corrigidos

### **Bug 1: Mesas aparecendo indisponíveis no 1º giro**
**Causa**: 
- Lógica do Highline executava ANTES do reset do Justino/Pracinha
- `is_reserved` do endpoint estava sendo herdado

**Solução**:
- Reset do Justino/Pracinha movido para **DEPOIS** da lógica do Highline
- Garantir que `is_reserved` sempre começa como `false` para restaurantes

### **Bug 2: Status não atualizava ao mudar horário**
**Causa**: 
- `useEffect` não tinha `formData.reservation_time` nas dependências

**Solução**:
- Adicionado `formData.reservation_time` nas dependências
- Agora recalcula disponibilidade quando horário muda

### **Bug 3: 2º giro bloqueava mesas visualmente**
**Causa**: 
- Mesas eram marcadas como `is_reserved: true` no 2º giro

**Solução**:
- Mesas aparecem como `is_reserved: false` mas com flag `is_second_giro: true`
- Aviso visual mostra que será convertido para Espera Antecipada

---

## 📊 Estrutura de Dados

### **RestaurantTable**
```typescript
{
  id: number;
  area_id: number;
  table_number: string;
  capacity: number;
  is_reserved: boolean; // false no 2º giro
  is_second_giro?: boolean; // true apenas no 2º giro (flag visual)
}
```

### **Reservation (Backend)**
```javascript
{
  table_number: null, // null no 2º giro
  status: 'NOVA' | 'CONFIRMADA' | 'CANCELADA' | ...,
  notes: 'ESPERA ANTECIPADA (Bistrô)',
  espera_antecipada: true,
  has_bistro_table: true
}
```

---

## 🔍 Pontos de Atenção

### **1. Ordem de Processamento é CRÍTICA**
- Reset do Justino/Pracinha deve ser **DEPOIS** da lógica do Highline
- Cálculo de overlap deve ser **DEPOIS** do reset

### **2. Status Não-Bloqueantes**
Lista completa de status que **NÃO** bloqueiam mesa:
- `cancelada`, `cancelled`, `canceled`, `cancel`
- `completed`, `concluida`, `concluída`, `concluido`, `concluído`
- `finalizada`, `finalized`, `finalizado`
- `no_show`, `no-show`, `no show`
- `espera antecipada` (não bloqueia mesa física)

### **3. Overlap de Horário**
- Janela de 2 horas (120 minutos)
- Exemplo: Reserva 19:00 bloqueia mesas de 17:00 a 21:00

### **4. Madrugada (Cruzamento de Meia-Noite)**
- Horários tipo 00:30, 01:00 são tratados como continuação do mesmo dia
- Exemplo: Sexta 01:00 = 25:00 (>= 21:00) = 2º giro

---

## 🚀 Melhorias Futuras Sugeridas

1. **Cache de Disponibilidade**
   - Cachear resultado de disponibilidade por (data, área, horário)
   - Invalidar quando nova reserva é criada

2. **Logs de Debug**
   - Adicionar logs detalhados no cálculo de disponibilidade
   - Mostrar quais reservas estão causando bloqueio

3. **Validação no Backend**
   - Backend também validar overlap antes de criar reserva
   - Retornar erro se mesa já está ocupada

4. **UI/UX**
   - Tooltip explicando por que mesa está indisponível
   - Mostrar horário da reserva conflitante

5. **Testes**
   - Testes unitários para função `isSecondGiroBistroJustinoPracinha`
   - Testes de integração para fluxo completo

---

## 📝 Arquivos Principais

### **Frontend**
- `app/components/ReservationModal.tsx` - Modal admin de reservas
- `app/reservar/ReservationForm.tsx` - Formulário público

### **Backend**
- `routes/restaurantReservations.js` - Criação/edição de reservas
- `routes/restaurantTables.js` - Endpoint de disponibilidade

---

## ✅ Checklist de Validação

Ao testar reservas, verificar:

- [ ] **1º Giro sem reservas**: Todas as mesas aparecem disponíveis
- [ ] **1º Giro com reserva ativa**: Apenas mesas com overlap aparecem indisponíveis
- [ ] **2º Giro**: Mesas aparecem disponíveis mas com aviso visual
- [ ] **2º Giro ao salvar**: Reserva é convertida para Espera Antecipada (sem mesa)
- [ ] **Mudança de horário**: Disponibilidade recalcula corretamente
- [ ] **Status cancelado**: Não bloqueia mesa
- [ ] **Espera Antecipada**: Não bloqueia mesa física

---

**Última atualização**: 28/01/2026
**Versão**: 2.0 (Regra de 2º giro expandida para todos os dias)
