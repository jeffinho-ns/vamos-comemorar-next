# API de Condução – Fluxo Rooftop

Contrato dos endpoints de persistência de "condução" da fila do Fluxo Rooftop (Reserva Rooftop).  
Escopo: sincronização entre dispositivos/recepções; sem impacto em outros estabelecimentos.

**Implementação backend:** `vamos-comemorar-api` — rotas em `routes/rooftopConduction.js`, tabela criada pela migração `migrations/create_rooftop_conduction_postgresql.sql`. Executar uma vez: `node scripts/run_rooftop_conduction_migration.js`.

## Base URL

Mesma base da API existente (ex.: `https://vamos-comemorar-api.onrender.com`).

## Autenticação

- Mesmo esquema das rotas de check-in: `Authorization: Bearer <token>`.
- Roles compatíveis: admin, gerente, hostess, promoter, recepção.

---

## GET – Listar itens conduzidos (estado da fila)

**Endpoint:** `GET /api/rooftop/conduction`

**Query params:**

| Parâmetro           | Tipo   | Obrigatório | Descrição                          |
|---------------------|--------|-------------|------------------------------------|
| `establishment_id`  | number | Sim         | ID do estabelecimento (Reserva Rooftop) |
| `flow_date`         | string | Sim         | Data do fluxo em `YYYY-MM-DD`     |

**Response 200:**

```json
{
  "conduced_ids": ["owner-123", "guest-123-456", "reservation-789"]
}
```

- `conduced_ids`: array de strings, IDs dos itens já conduzidos no dia.
- Formato dos IDs (igual ao usado no frontend):
  - `owner-<guest_list_id>`
  - `guest-<guest_list_id>-<guest_id>`
  - `reservation-<reservation_id>`

**Comportamento:**

- Retornar lista vazia quando não houver conduções no dia.
- 404: endpoint não implementado (frontend trata como lista vazia).

---

## POST – Confirmar condução (idempotente)

**Endpoint:** `POST /api/rooftop/conduction`

**Body (JSON):**

| Campo              | Tipo   | Obrigatório | Descrição                                      |
|--------------------|--------|-------------|------------------------------------------------|
| `establishment_id` | number | Sim         | ID do estabelecimento                          |
| `flow_date`        | string | Sim         | Data do fluxo `YYYY-MM-DD`                     |
| `queue_item_id`    | string | Sim         | ID do item na fila (ex.: `owner-123`)          |
| `entity_type`      | string | Sim         | `owner` \| `guest` \| `reservation_owner`       |
| `entity_id`        | number | Sim         | ID do guest, guest_list (owner) ou reservation |
| `guest_list_id`    | number | Não         | Quando aplicável (owner/guest)                 |
| `reservation_id`   | number | Não         | Quando aplicável                                |

**Exemplo:**

```json
{
  "establishment_id": 5,
  "flow_date": "2026-02-13",
  "queue_item_id": "guest-10-42",
  "entity_type": "guest",
  "entity_id": 42,
  "guest_list_id": 10,
  "reservation_id": 100
}
```

**Response 200:** corpo vazio ou `{}`.

**Idempotência:**  
Chamar novamente com o mesmo `establishment_id` + `flow_date` + `queue_item_id` não deve duplicar registro (upsert por essa chave lógica).

**Comportamento esperado no backend:**

- Persistir: `establishment_id`, `flow_date`, `entity_type`, `entity_id`, `guest_list_id` (opcional), `reservation_id` (opcional), `conducted_at`, `conducted_by` (user id/email do token).
- 404: endpoint não implementado (frontend exibe erro e faz rollback do update otimista).

---

## Modelo de dados sugerido (backend)

- `establishment_id` (number)
- `flow_date` (date / string YYYY-MM-DD)
- `entity_type`: `owner` | `guest` | `reservation_owner`
- `entity_id` (number)
- `guest_list_id` (number, nullable)
- `reservation_id` (number, nullable)
- `conducted_at` (timestamp)
- `conducted_by` (string: user id ou email)

Chave única sugerida para idempotência: `(establishment_id, flow_date, queue_item_id)` onde `queue_item_id` é a string enviada pelo frontend.

---

## (Opcional) Desfazer condução

**Endpoint:** `DELETE /api/rooftop/conduction` ou `POST /api/rooftop/conduction/undo`

**Body:** `establishment_id`, `flow_date`, `queue_item_id`.

Não obrigatório para a primeira entrega; o frontend não chama até existir UX de “desfazer”.
