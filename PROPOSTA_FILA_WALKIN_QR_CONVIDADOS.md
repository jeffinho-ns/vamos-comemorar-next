# Proposta de Implementação: Fila Walk-in e Check-in via QR Code por Convidado

Este documento detalha as alterações **passo a passo**, **sem quebrar** fluxos atuais de reserva, lista de convidados e check-in.

---

## Visão geral dos arquivos envolvidos

| Funcionalidade | Front-end (vamos-comemorar-next) | Back-end (vamos-comemorar-api) |
|----------------|----------------------------------|--------------------------------|
| 1. Walk-in     | `app/reservar/ReservationForm.tsx` | `routes/restaurantReservations.js` ou `routes/waitlist.js` |
| 2. QR por convidado | `app/lista/[token]/page.tsx` | `routes/guestListPublic.js` + migração em `guests` |
| 3. Validação check-in admin | `app/admin/qrcode/page.tsx` | `routes/checkin.js` (estender) |

---

# FUNCIONALIDADE 1 — Fluxo Walk-in (Fila de Espera) em `/reservar`

**Arquivo principal:** `app/reservar/ReservationForm.tsx`

## Objetivo

Adicionar ao formulário a pergunta **“Está no Estabelecimento?”** (SIM/NÃO).  
Se **SIM**: bloquear Data/Hora, preencher com “agora”, manter só Área Preferida ativa e enviar `is_walkin: true`, `status: 'WAITING_LIST'`, `table_type: 'BISTRO'`.  
Se **NÃO**: manter o fluxo atual intacto.

## Passos no front-end

### 1. Estado e campo “Está no Estabelecimento?”

- Adicionar estado booleano, por exemplo:
  - `const [isWalkIn, setIsWalkIn] = useState<boolean>(false);`
- Inserir **antes** da seção “Reservation Details” (Data / Área / Horário) um bloco:

```tsx
{/* Está no Estabelecimento? — NOVO, não alterar nada acima */}
<div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Está no Estabelecimento?
  </label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="isWalkIn"
        checked={!isWalkIn}
        onChange={() => setIsWalkIn(false)}
        className="w-4 h-4 text-orange-500"
      />
      <span>NÃO</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="isWalkIn"
        checked={isWalkIn}
        onChange={() => setIsWalkIn(true)}
        className="w-4 h-4 text-orange-500"
      />
      <span>SIM</span>
    </label>
  </div>
</div>
```

- **Regra:** não remover nem refatorar os campos existentes; apenas envolver condicionalmente (if/else).

### 2. Quando `isWalkIn === true`: Data e Hora automáticos e bloqueados

- Em um `useEffect` que depende de `isWalkIn`:
  - Se `isWalkIn === true`:
    - Definir `reservation_date` como a data de hoje em `YYYY-MM-DD`.
    - Definir `reservation_time` como o horário atual no formato `HH:mm` (e depois garantir `HH:mm:ss` no submit).
  - Exemplo:

```tsx
useEffect(() => {
  if (isWalkIn) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setReservationData(prev => ({ ...prev, reservation_date: date, reservation_time: time }));
  }
}, [isWalkIn]);
```

- Nos inputs de **Data da Reserva** e **Horário**:
  - Adicionar `disabled={isWalkIn}` e `readOnly={isWalkIn}` quando fizer sentido para acessibilidade.
  - Manter `value` e `onChange` atuais quando `!isWalkIn`.

### 3. Validação no submit para walk-in

- Em `validateForm()` (ou equivalente), **no início**:
  - Se `isWalkIn === true`:
    - não validar horários de janela (Highline/Seu Justino) como obrigatórios;
    - garantir que `reservation_date` e `reservation_time` existam (já preenchidos pelo efecto).
  - Se `isWalkIn === false`, manter **toda** a lógica atual de validação (datas, horários, áreas, etc.).

### 4. Payload e endpoint no `handleSubmit`

- **Antes** do `fetch` atual que chama `restaurant-reservations`:
  - Se `isWalkIn === true`:
    - Construir payload com:
      - `is_walkin: true`
      - `status: 'WAITING_LIST'`
      - `table_type: 'BISTRO'`
      - `reservation_date` e `reservation_time` já preenchidos (momento atual).
    - Decisão de backend (ver seção Back-end abaixo):
      - **Opção A:** chamar `POST /api/waitlist` com os mesmos dados mapeados (client_name, client_phone, establishment_id, preferred_date = hoje, preferred_area_id = área escolhida, number_of_people, has_bistro_table: true, etc.).
      - **Opção B:** chamar o mesmo `POST /api/restaurant-reservations` e deixar o backend, ao ver `is_walkin` e `status: 'WAITING_LIST'`, criar/atualizar registro na waitlist ou em tabela específica de walk-in.
- Se `isWalkIn === false`, **não alterar** o payload nem o endpoint atuais.

### 5. Feedback após confirmação (walk-in)

- Na tela de confirmação (`step === 'confirmation'`), adicionar um **if**:
  - Se a reserva foi feita em modo walk-in (`isWalkIn` ou flag devolvida pela API, ex.: `result.is_walkin`):
    - Exibir mensagem clara:
      - *“Você está na fila de espera e foi alocado em um Bistrô. Aguarde o chamado da recepção.”*
  - Caso contrário, manter o bloco atual de “Reserva Confirmada!” e detalhes.

### 6. Reset ao sair do formulário / nova reserva

- No reset (ex.: “Nova Reserva” ou ao voltar para o passo do formulário), incluir:
  - `setIsWalkIn(false);`
- Assim o próximo uso volta ao fluxo normal por padrão.

---

## Back-end para Walk-in

- **Opção recomendada (menos invasiva):** quando o front envia `is_walkin: true`, o front chama **`POST /api/waitlist`** com os dados já aceitos por essa rota (`client_name`, `client_phone`, `client_email`, `establishment_id`, `number_of_people`, `preferred_date`, `preferred_area_id`, `has_bistro_table: true`). Nenhuma mudança na lógica atual de `restaurant-reservations`.
- **Opção alternativa:** estender `POST /api/restaurant-reservations` para aceitar `is_walkin`, `status`, `table_type` e, nesse caso, inserir em `waitlist` (ou tabela equivalente) em vez de em `restaurant_reservations`, sem alterar o fluxo quando `is_walkin` não for enviado.

---

# FUNCIONALIDADE 2 — QR Code individual por convidado (`/lista/[token]`)

**Arquivo principal:** `app/lista/[token]/page.tsx`

## Objetivo

- Para cada convidado **salvo** no backend, existir **um** QR Code único.
- O QR é gerado **somente depois** do nome ser salvo com sucesso.
- Nunca gerar QR para “vagas vazias”.
- O QR contém um **token único** (`qr_code_token`), imutável (não muda ao editar nome) e de uso único (invalidado após check-in).
- Dono da reserva tratado como convidado especial e com QR próprio.

## Passos no front-end

### 1. Tipo do convidado

- No tipo `Guest` (ou equivalente), incluir campos que a API passa a devolver:
  - `qr_code_token?: string | null`
  - `checked_in?: boolean`
  - `checkin_time?: string | null` (ou `checked_in_at`)
  - `is_owner?: boolean` (opcional)
- Exemplo:

```ts
type Guest = {
  id: number;
  name: string;
  status: string;
  checked_in?: boolean;
  checkin_time?: string;
  qr_code_token?: string | null;
  is_owner?: boolean;
};
```

### 2. Exibição na tabela: Nome, Status, “Ver QR”

- Para cada convidado em `guests`:
  - Mostrar **Nome** e **Status** (PENDENTE ou CHECKED_IN, com base em `checked_in`/`status`).
  - Só mostrar o botão **“Ver QR Code”** se o convidado tiver `qr_code_token` (ou seja, já salvo no backend com token).
- Não gerar QR para linhas vazias ou para convidados ainda não persistidos.

### 3. Modal ou página “Meu QR Code”

- Ao clicar em “Ver QR Code”:
  - Abrir modal (ou rota interna como `lista/[token]/meu-qr/[guestToken]`) que:
    - Use o valor do QR como **URL** ou **token puro**, conforme combinado com o backend (ex.: `https://site/guest-checkin/<qr_code_token>` ou só o token).
  - Gerar o QR com `QRCodeSVG` a partir desse valor.
  - Exibir nome do convidado e status (PENDENTE/CHECKED_IN).
- O convidado acessa e vê seu próprio QR pelo link da lista (mesma página `lista/[token]`), então o “Ver QR Code” deve estar acessível para quem tem o link da lista.

### 4. Dono da reserva como convidado com QR

- A API deve retornar um “convidado” correspondente ao dono (ex.: `is_owner: true`) já com `qr_code_token`.
- No front, tratar esse registro como qualquer outro convidado na tabela: mesmo layout de Nome + Status + “Ver QR Code”.
- A criação desse convidado-owner e a atribuição de `qr_code_token` são responsabilidade do **backend** ao criar/vincular a lista (ou por endpoint específico). O front apenas exibe os convidados retornados por `GET /api/guest-list/:token`.

---

## Back-end para QR por convidado

### 1. Migração na tabela `guests`

- Adicionar colunas (exemplo em PostgreSQL):

```sql
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS qr_code_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_qr_code_token ON guests(qr_code_token);
```

- Usar **token aleatório seguro** (ex.: `crypto.randomBytes(32).toString('hex')`), nunca ID numérico no QR.

### 2. Ao criar convidado (`POST /api/guest-list/:token/guests`)

- Após o `INSERT` do convidado:
  - Gerar `qr_code_token` único.
  - Fazer `UPDATE guests SET qr_code_token = $1 WHERE id = $2`.
- Na resposta, incluir `qr_code_token` (e, se aplicável, `is_owner`) para o front exibir o botão “Ver QR Code” imediatamente após salvar.

### 3. Dono como convidado

- Ao criar a lista (ex.: em `add-guest-list` ou fluxo equivalente), criar um registro em `guests` com `is_owner = true`, nome = owner da reserva, e gerar `qr_code_token` da mesma forma.
- Ou expor um endpoint “criar convidado owner” e chamá-lo quando a lista for criada/aberta pela primeira vez.

### 4. GET `/api/guest-list/:token`

- Incluir na resposta dos convidados os campos `qr_code_token`, `checked_in_at` (ou `checkin_time`), `is_owner`, para o front montar a tabela e o botão “Ver QR Code”.

---

# FUNCIONALIDADE 3 — Validação de Check-in em `/admin/qrcode`

**Arquivo principal:** `app/admin/qrcode/page.tsx`

## Objetivo

- **Não alterar** o fluxo atual de leitura do QR nem a UI do leitor.
- Estender a validação para aceitar **dois tipos** de conteúdo no QR:
  1. **Reserva principal / convidado antigo (convidados):** fluxo já existente (ex.: convidados com `qr_code`).
  2. **Convidado da lista (guest):** novo fluxo por `qr_code_token` da tabela `guests`.

## Passos no back-end (`routes/checkin.js`)

### 1. Identificar o tipo do QR

- Ao receber `qrCodeData` em `POST /api/checkin`:
  - **Se** for URL de convidado, por exemplo:  
    `https://.../guest-checkin/<token>` ou prefixo `vc_guest_`:
    - Extrair o token e tratar como **guest**.
  - **Senão**, manter o fluxo atual (busca em `convidados` por `qr_code = qrCodeData`).

### 2. Novo fluxo para guest

- Ao identificar token de guest:
  1. Buscar em `guests` por `qr_code_token = <token>`.
  2. Se não existir → retornar erro claro: “QR inválido ou não encontrado”.
  3. Carregar a `guest_list` e a reserva ligada (restaurant ou large).
  4. Verificar se a reserva está “ativa” e se a data da reserva é **a de hoje** (ou conforme regra de negócio).
  5. Se o convidado já tiver `checked_in = true` (ou `checked_in_at` preenchido) → retornar erro: “QR já utilizado”.
  6. Se tudo válido:
     - `UPDATE guests SET checked_in = TRUE, checked_in_at = CURRENT_TIMESTAMP WHERE id = $1` (e manter `checkin_time` se já existir na tabela).
  7. Resposta de sucesso no mesmo formato que o fluxo atual (ex.: `{ message, convidado: guest.name }`), para o modal do admin continuar igual.

### 3. Formato do valor no QR (guest)

- Definir um padrão, por exemplo:
  - URL: `https://<dominio>/guest-checkin/<qr_code_token>`
  - Ou apenas a string `vc_guest_<qr_code_token>`.
- O front da lista usa o **mesmo** formato ao gerar o QR no “Ver QR Code”. O admin envia esse valor bruto para `POST /api/checkin`; o backend faz o parse e escolhe o fluxo (guest vs convidado antigo).

---

## Passos no front-end (`app/admin/qrcode/page.tsx`)

- **Não mudar** a lógica de câmera, leitura do QR nem a chamada `validateQRCode(qrCodeValue)`.
- Continuar enviando `qrCodeData: qrCodeValue` para `POST /api/checkin`.
- Apenas garantir que mensagens de erro retornadas pela API (QR inválido, já utilizado, reserva inativa) sejam exibidas no mesmo bloco de `validationMessage` já existente.
- Se a API padronizar o corpo de sucesso (ex.: `convidado`), o modal atual que mostra “Participante: …” já reflete o check-in do guest sem alteração.

---

## Atualização em tempo real em `app/admin/eventos/[id]/check-ins`

- Manter ou usar **SWR** / polling para a lista de check-ins.
- O backend, ao registrar check-in de guest, pode emitir evento (ex.: Socket.IO) pela `guest_list_id` ou pelo `evento_id` da reserva, para a página de check-ins atualizar sem reload.
- Se já existir canal por reserva/evento, incluir nesse canal a notificação de “guest check-in” usando o mesmo payload que hoje existe para convidado (ex.: `convidado_checkin`), para que o painel de check-ins já reaja.

---

# BANCO DE DADOS E SEGURANÇA

## Migração sugerida para `guests`

```sql
-- PostgreSQL
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS qr_code_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_qr_code_token ON guests(qr_code_token);
COMMENT ON COLUMN guests.qr_code_token IS 'Token único no QR; imutável e de uso único';
COMMENT ON COLUMN guests.checked_in_at IS 'Timestamp do check-in via QR';
COMMENT ON COLUMN guests.is_owner IS 'True se for o dono da reserva';
```

- **Segurança:** nunca usar IDs numéricos dentro do QR; sempre `qr_code_token` aleatório.
- **Performance:** índices em `qr_code_token` e, se fizer sentido, em `(guest_list_id, checked_in)` para listagens e dashboards.

---

# CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **ReservationForm:** estado `isWalkIn`, bloco “Está no Estabelecimento?”, efeito que preenche data/hora quando walk-in, desabilitar Data/Hora quando walk-in, validação condicionada, payload/endpoint walk-in, mensagem de fila de espera na confirmação, reset de `isWalkIn`.
- [ ] **Back-end walk-in:** definir se walk-in usa `POST /api/waitlist` (recomendado) ou extensão de `restaurant-reservations`; em ambos os casos, não quebrar o fluxo atual.
- [ ] **Migração `guests`:** `qr_code_token`, `checked_in_at`, `is_owner`.
- [ ] **guest-list API:** gerar e persistir `qr_code_token` em `POST .../guests`; retornar em `GET .../:token`; criar convidado-owner com QR quando aplicável.
- [ ] **Lista [token]:** tipo `Guest` com `qr_code_token`; botão “Ver QR Code” só se houver token; modal/página de exibição do QR com valor acordado (URL ou `vc_guest_...`).
- [ ] **checkin API:** detectar guest por URL/prefixo; validar token, reserva ativa, dia atual, não utilizado; atualizar `guests` e responder no formato atual.
- [ ] **admin/qrcode:** sem mudança na leitura; exibir erros da API no mesmo `validationMessage`.
- [ ] **admin/eventos/[id]/check-ins:** SWR/polling ou Socket para refletir check-in de guest em tempo real.

---

# Ordem sugerida de implementação

1. Migração em `guests` e alterações em `guestListPublic.js` (QR por convidado no backend).
2. Ajustes em `app/lista/[token]/page.tsx` (botão “Ver QR”, modal e tipo `Guest`).
3. Extensão de `routes/checkin.js` para guest por `qr_code_token` e teste com admin/qrcode.
4. Walk-in: estado e UI em `ReservationForm.tsx` e, em seguida, integração com waitlist (ou restaurant-reservations, conforme definido).
5. Dono da reserva como convidado com QR (backend + front da lista).
6. Revisão de SWR/polling/Socket na página de check-ins do admin.

Com isso, as três funcionalidades ficam cobertas de forma incremental e sem quebrar os fluxos atuais.

---

# Apêndice A — Pontos exatos de inserção em ReservationForm.tsx

## Estado `isWalkIn`

**Onde:** Logo após os outros `useState` do formulário (ex.: após `const [promoterEventsError, setPromoterEventsError] = useState<string | null>(null);` por volta da linha ~178).

**O que adicionar:**
```tsx
const [isWalkIn, setIsWalkIn] = useState<boolean>(false);
```

## Bloco “Está no Estabelecimento?”

**Onde:** Imediatamente **antes** do comentário `{/* Reservation Details */}` e do `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` que contém “Data da Reserva” e “Área Preferida” (por volta da linha ~1812).

**O que adicionar:** o bloco de radio buttons “Está no Estabelecimento?” (SIM/NÃO) descrito na seção da Funcionalidade 1, passo 1.

## Desabilitar Data e Hora quando walk-in

**Onde:** Nos inputs de Data e Horário.

- **Data da Reserva:** no `<input type="date" ...>` que usa `value={reservationData.reservation_date}` — adicionar `disabled={isWalkIn}` e `readOnly={isWalkIn}`.
- **Horário:** no `<select value={reservationData.reservation_time} ...>` — adicionar `disabled={isWalkIn}`.

## `useEffect` para preencher data/hora em walk-in

**Onde:** Junto dos outros `useEffect` do componente (por exemplo após os que dependem de `reservationData.reservation_date` ou `selectedEstablishment`). O efeito deve depender de `isWalkIn` e, quando `isWalkIn === true`, chamar `setReservationData` com `reservation_date` e `reservation_time` do momento atual.

## Condição no `handleSubmit` e payload walk-in

**Onde:** No início de `handleSubmit`, **antes** de montar o `payload` atual e de chamar `validateForm()` (ou logo após passar na validação). Incluir um `if (isWalkIn)` que:
- monta payload com data/hora atuais, `is_walkin: true`, `status: 'WAITING_LIST'`, `table_type: 'BISTRO'`;
- chama `POST /api/waitlist` (ou o endpoint acordado) em vez de `restaurant-reservations`;
- em caso de sucesso, define `setStep('confirmation')` e eventualmente uma flag para exibir a mensagem de fila de espera (ex.: `setBirthdayGuestListCreated(false)` e um novo estado `setIsWalkInSubmission(true)` ou reutilizar `isWalkIn`);
- em caso de erro, trata como hoje;
- retorna cedo (`return`) para não executar o resto do `handleSubmit`.
- Quando `!isWalkIn`, o fluxo segue **igual** ao atual (mesmo payload, mesmo endpoint, mesma lógica).

## Mensagem de confirmação walk-in

**Onde:** Dentro do bloco de confirmação (`step === 'confirmation'`), **antes** ou **no lugar** do texto “Sua reserva foi realizada com sucesso...”. Incluir:

```tsx
{isWalkIn && (
  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <p className="text-amber-800 font-medium">
      Você está na fila de espera e foi alocado em um Bistrô. Aguarde o chamado da recepção.
    </p>
  </div>
)}
```

E, se desejado, não exibir “Reserva Confirmada!” com os mesmos detalhes de data/hora quando for walk-in, ou exibir um resumo específico (ex.: “Entrada na fila de espera”).

## Reset em “Nova Reserva”

**Onde:** No handler do botão “Nova Reserva”, onde já se chama `setReservationData({ ... })` e `setStep('establishment')`. Adicionar:

```tsx
setIsWalkIn(false);
```

---

# Apêndice B — Extensão da rota de check-in (guest por `qr_code_token`)

**Arquivo:** `vamos-comemorar-api/routes/checkin.js`

**Onde:** Dentro do `if (qrCodeData)` (por volta da linha 58), **antes** da busca em `convidados`.

**Lógica sugerida (pseudocódigo):**

```js
if (qrCodeData) {
  // NOVO: tentar fluxo de guest (lista de convidados) por qr_code_token
  const guestToken = (() => {
    if (typeof qrCodeData !== 'string') return null;
    if (qrCodeData.startsWith('vc_guest_')) return qrCodeData.slice(9);
    const m = qrCodeData.match(/\/guest-checkin\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  })();

  if (guestToken) {
    const guestRow = await db.query(
      'SELECT g.id, g.name, g.checked_in, g.checkin_time, g.guest_list_id, gl.reservation_id, gl.reservation_type FROM guests g JOIN guest_lists gl ON gl.id = g.guest_list_id WHERE g.qr_code_token = $1',
      [guestToken]
    );
    if (guestRow.rows.length === 0) {
      return res.status(404).json({ message: 'QR Code inválido ou não encontrado.' });
    }
    const g = guestRow.rows[0];
    if (g.checked_in) {
      return res.status(409).json({ message: 'QR já utilizado. Check-in já realizado para este convidado.' });
    }
    // Validar reserva ativa e data do evento (hoje), conforme regra do negócio
    // ...
    await db.query(
      'UPDATE guests SET checked_in = TRUE, checkin_time = CURRENT_TIMESTAMP WHERE id = $1',
      [g.id]
    );
    // Emitir evento Socket se existir sala por guest_list_id ou reservation_id
    return res.status(200).json({ message: 'Check-in realizado com sucesso!', convidado: g.name });
  }

  // Fluxo existente: convidados por qr_code
  const sqlBusca = 'SELECT * FROM convidados WHERE qr_code = $1';
  const result = await db.query(sqlBusca, [qrCodeData]);
  // ... resto igual
}
```

- A validação “reserva ativa e data = hoje” deve ser feita consultando `restaurant_reservations` ou `large_reservations` via `gl.reservation_id` e `gl.reservation_type`.
- O pool em `checkin.js` é recebido como `db` no `module.exports = (db) => { ... }`; usar esse `db` em todas as queries acima.
