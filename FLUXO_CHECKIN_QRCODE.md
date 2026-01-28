# Fluxo de Check-in por QR Code (convidados da lista)

Este documento explica **onde** e **como** funciona o check-in pelo QR Code dos convidados das listas (guest lists / reservas restaurante).

---

## Visão geral em 3 passos

1. **Convidado** abre o link da lista (ex.: `agilizaiapp.com.br/lista/TOKEN`) e vê o **QR Code dele** na coluna “Ver QR Code”.
2. **Recepção** abre a página **Scanner QR Code** no admin e usa a câmera para ler o QR do convidado.
3. O **backend** reconhece o valor `vc_guest_...`, encontra o convidado, faz o check-in e avisa a tela de check-ins em tempo real (Socket).

---

## 1. Onde o convidado vê o QR Code

**Página:** `/lista/[token]`  
**Arquivo:** `app/lista/[token]/page.tsx`

- O convidado acessa o link compartilhado da lista (ex.: `https://agilizaiapp.com.br/lista/abc123xyz`).
- Na tabela de convidados, cada linha tem a coluna **“QR Code”**.
- Se o convidado tem `qr_code_token` cadastrado, aparece o botão **“Ver QR Code”**.
- Ao clicar, abre um **modal** com:
  - Nome do convidado
  - Status (Pendente / Check-in realizado)
  - Um QR Code gerado com o valor **do token** (`qr_code_token`), no formato `vc_guest_` + 64 caracteres hexadecimais.
  - Texto: *“Apresente este QR Code na recepção para fazer check-in.”*

O valor que fica **dentro** do QR Code é exatamente a string `qr_code_token` (ex.: `vc_guest_a1b2c3...`). É isso que o scanner lê e envia para a API.

---

## 1.1 Como o cliente “gera” o QR Code? (validação/confirmação)

**Resposta:** O cliente **não valida e nem confirma** nada para “gerar” o QR Code. O QR é criado **automaticamente** quando o convidado **entra na lista**.

| Situação | O que acontece |
|----------|-----------------|
| **Convidado novo** | Alguém (o próprio convidado ou o dono) acessa `/lista/[token]`, preenche nome (e WhatsApp) no formulário **“Adicionar à lista”** e envia. O backend, ao inserir o convidado (POST `/api/guest-list/:token/guests`), **gera e grava** o `qr_code_token` na hora. A página recarrega a lista e o novo convidado já aparece com o botão **“Ver QR Code”**. |
| **Vários de uma vez** | No mesmo fluxo, ao usar **“Adicionar em lote”** (vários nomes), cada nome é enviado como um POST; para cada um o backend insere o convidado e gera o `qr_code_token`. Depois do lote, a lista é recarregada e todos passam a ter “Ver QR Code”. |
| **Quem já estava na lista** | Convidados que **já existiam** antes da migração do `qr_code_token` (ou que foram criados por outro fluxo que não preenche token) **não têm** QR até hoje. Para esses **não existe** na página nenhum botão “Confirmar” ou “Gerar meu QR”: a coluna fica “—” e não há fluxo de “validação do cliente” para gerar o token. **Exceção:** o **dono da reserva** é corrigido automaticamente ao abrir a lista: se não existir dono em `guests` ou o dono não tiver `qr_code_token`, o backend insere/atualiza o dono com QR (backfill). |

**Resumo:**  
- **Não há** passo de “validar” ou “confirmar” para gerar o QR.  
- O QR é gerado **no momento em que o convidado é adicionado** à lista (formulário ou lote).  
- Quem já está na lista sem token hoje só teria QR se outra parte do sistema (ex.: admin ou script) preenchesse o `qr_code_token` para esse convidado.

---

## 1.2 “Pendente”, “—” e onde está o QR do dono da reserva?

**Por que aparece “Pendente” e “—” na coluna QR Code?**

- **Status “Pendente”** (ou “Confirmado”): é o convidado que ainda não fez check-in. A API retorna status `Confirmado`; a tela pode mostrar “Pendente” ou “Confirmado” dependendo do texto.
- **Coluna QR com “—”**: significa que esse convidado **não tem** `qr_code_token` no banco. Isso acontece quando:
  1. O convidado foi criado **antes** da migração do QR (coluna/sistema antigo), ou  
  2. A lista foi criada **sem** inserir o dono com QR (ex.: lista criada na reserva antiga que só criava a `guest_list` e não inseria o dono em `guests`).

**Onde está o QR do dono da reserva?**

- O **dono** é um convidado como os outros: fica na tabela `guests` com `is_owner = true`. Ele **só aparece na lista** se tiver sido inserido quando a lista foi criada (via **add-guest-list** ou, a partir de agora, quando a lista é criada **na própria reserva**).
- Antes das alterações recentes:
  - Listas criadas **na reserva** (4+ pessoas ou aniversário HighLine) **não** inseriam o dono em `guests` → a página mostrava só o nome do dono no título e a tabela **vazia**; não havia “dono” como linha com QR.
  - Listas criadas pelo **add-guest-list** (admin) já inseriam o dono com `qr_code_token` → o dono aparecia como primeira linha com “Ver QR Code”.
- **Agora:**
  1. **Ao criar a lista na reserva**, o backend também insere o dono com `qr_code_token` e `is_owner = true` → o dono já nasce com “Ver QR Code”.
  2. **Ao abrir a lista** (`GET /api/guest-list/:token`), se não existir dono (guest com `is_owner`) ou o dono existir sem `qr_code_token`, o backend **preenche** (backfill): cria ou atualiza o dono com QR. Na próxima carga da página, o dono aparece com “Ver QR Code”.

Se você abrir de novo o link da sua lista (ex.: `/lista/4e0c4dd5384ae752a23924cb97aa615965d5822449146415`) **depois do deploy** dessas mudanças, o dono deve passar a aparecer com “Ver QR Code” (ou o traço “—” do dono deve sumir após o backfill).

---

## 2. Onde a recepção escaneia o QR Code

**Página:** `/admin/qrcode` — **“Scanner QR Code”**  
**Arquivo:** `app/admin/qrcode/page.tsx`

- Acesso: menu do admin → **“Scanner QR Code”** (ou ir direto em `/admin/qrcode`).
- Permissões (middleware): `admin`, `promoter`, `recepção`, `gerente`.

O que essa tela faz:

1. Pede permissão de câmera e exibe o vídeo.
2. Usa a lib **jsQR** para decodificar um QR Code no quadro atual.
3. Quando encontra um código novo (`code.data`):
   - Envia **POST** para a API com o valor lido:
     - **URL:** `POST ${NEXT_PUBLIC_API_URL}/api/checkin`
     - **Body:** `{ "qrCodeData": "<valor lido do QR>" }`
4. Se a API responder sucesso:
   - Mostra “✅ Acesso Permitido!” e abre um modal com a resposta (ex.: nome do convidado).
5. Se der erro (404, 409, etc.):
   - Mostra a mensagem retornada (ex.: “QR já utilizado”, “QR Code inválido”).

Ou seja: **o fluxo de check-in pelo QR Code do convidado acontece na tela `/admin/qrcode`**, que chama `POST /api/checkin` com o `qrCodeData` lido pelo scanner.

---

## 3. O que o backend faz com o QR (`vc_guest_...`)

**Rota:** `POST /api/checkin`  
**Arquivo:** `vamos-comemorar-api/routes/checkin.js`

O backend trata dois tipos de conteúdo em `qrCodeData`:

- **QR de convidado da lista (guest):** valor começa com `vc_guest_`
- **QR antigo de “convidados” (tabela `convidados`):** outro formato, legado

Para o check-in **pelo QR do convidado da lista**, o fluxo é:

1. Recebe `body.qrCodeData`.
2. Se `qrCodeData` começa com `"vc_guest_"`:
   - Busca em `guests` com `JOIN guest_lists` onde `g.qr_code_token = qrCodeData`.
3. Se não achar convidado:
   - Responde **404** (“QR Code inválido ou não encontrado”).
4. Se achar:
   - Se já está com check-in (`checked_in === true/1`):
     - Responde **409** (“QR já utilizado. Check-in já realizado para este convidado.”).
   - Verifica se a **guest list** ainda é válida (`expires_at >= NOW()`).
     - Se expirada:
       - Responde **410** (“Link da lista expirado. QR inválido.”).
   - Atualiza o convidado:
     - `UPDATE guests SET checked_in = TRUE, checkin_time = CURRENT_TIMESTAMP WHERE id = $1`
   - Emite Socket.IO na sala da lista:
     - `io.to('guest_list_' + guest_list_id).emit('convidado_checkin', { convidadoId, nome, status: 'CHECK-IN' })`
   - Responde **200** com `{ message: 'Check-in realizado com sucesso!', convidado: g.name }`.

Quem estiver na tela de check-ins do evento e escutando essa sala recebe o evento e pode atualizar a lista em tempo real.

---

## 4. De onde vem o `qr_code_token`

- **Novos convidados (POST na lista pública):**  
  Em `routes/guestListPublic.js`, ao adicionar convidado (POST no endpoint público da lista), é gerado:
  - `qrCodeToken = 'vc_guest_' + crypto.randomBytes(32).toString('hex')`
  - gravado em `guests.qr_code_token` e retornado na resposta.
- **Reservas com “dono” na lista:**  
  Em `restaurantReservations.js` e `largeReservations.js`, ao criar a guest list na etapa “add-guest-list”, é inserido um convidado dono com `is_owner = true` e um `qr_code_token` no mesmo formato.
- **Lista já existente:**  
  Convidados criados antes da migração podem não ter `qr_code_token`; aí na lista aparece “—” na coluna QR Code e não dá para usar esse fluxo até que tenham token (por exemplo, reeditando/criando via API que preenche `qr_code_token`).

---

## 5. Resumo prático: “onde eu faço o check-in pelo QR?”

| Papel        | O que faz                                                                 | Onde |
|-------------|----------------------------------------------------------------------------|------|
| Convidado   | Abre o link da lista, clica em “Ver QR Code” e mostra o celular na porta  | `/lista/[token]` |
| Recepção   | Abre o **Scanner QR Code**, aponta a câmera para o QR do convidado        | **`/admin/qrcode`** |
| Backend    | Recebe o valor do QR em `POST /api/checkin`, identifica `vc_guest_...`, faz check-in e emite Socket | `routes/checkin.js` |

Ou seja: o fluxo de check-in pelo QR Code do convidado **não** está na página de check-ins do evento (`/admin/eventos/[id]/check-ins`). Ele está na página **Scanner QR Code**: **`/admin/qrcode`**.  
Na tela de check-ins do evento o que existe é lista manual, botões de check-in por convidado, busca, etc.; o “leitor de QR” fica em **`/admin/qrcode`**.

---

## 6. Fluxo em diagrama (texto)

```
[Convidado]                    [Recepção]                     [Backend]
    |                               |                               |
    | Abre /lista/TOKEN              |                               |
    | Clica "Ver QR Code"            |                               |
    | Modal com QR = vc_guest_xxx    |                               |
    |                               |                               |
    |     <<<< mostra o celular >>>  |                               |
    |                               | Abre /admin/qrcode             |
    |                               | Camera lê QR                   |
    |                               | POST /api/checkin               |
    |                               |   body: { qrCodeData }   ----->|
    |                               |                               | Busca guest por qr_code_token
    |                               |                               | Valida list ativa, não checked_in
    |                               |                               | UPDATE guests SET checked_in...
    |                               |                               | io.to('guest_list_X').emit(...)
    |                               |<----- 200 { convidado } --------|
    |                               | "Acesso Permitido!"             |
```

Se quiser, no próximo passo podemos mapear como a página `/admin/eventos/[id]/check-ins` (ou a versão tablet) se inscreve no Socket `guest_list_${id}` para refletir esse check-in em tempo real, ou conferir se há algum link “Abrir scanner” a partir dessa tela.

---

## 7. Troubleshooting: “Ver QR Code” não aparece / página continua sem botão

Se você fez deploy e a página da lista continua **sem nenhum botão “Ver QR Code”** e **nenhum convidado com QR**:

1. **Migração no banco de produção**  
   As colunas `qr_code_token` e `is_owner` precisam existir na tabela `guests`. No servidor da API (ou com a conexão do banco de produção):
   ```bash
   cd vamos-comemorar-api
   node scripts/run_guests_qr_code_token_migration.js
   ```
   Ou rode o SQL em `migrations/add_guests_qr_code_token_postgresql.sql` direto no PostgreSQL.

2. **Deploy do backend com o backfill novo**  
   O backfill que **preenche `qr_code_token` para todos os convidados** que ainda não têm (não só o dono) está em `routes/guestListPublic.js`. Garanta que o deploy atual usa essa versão (commit com “Backfill qr_code_token para qualquer convidado”).

3. **Atualizar a página sem cache**  
   Abra o link da lista e faça um **hard refresh** (Ctrl+Shift+R ou Cmd+Shift+R). A página passou a usar `?t=Date.now()` na chamada para evitar cache e sempre buscar os dados atualizados.

4. **Conferir a resposta da API**  
   No DevTools (F12) → aba Network → recarregue a lista → clique na requisição `guest-list/TOKEN` → em Response, veja se `guestList.guests[]` traz `qr_code_token` preenchido para cada convidado.  
   Se vier tudo `null`, o backfill não está rodando (migração não aplicada ou backend antigo em produção).
