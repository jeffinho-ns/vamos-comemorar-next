# Staff Agent (front) — ponte de continuidade

Documentação completa para retomar o piloto:

→ **`vamos-comemorar-api/services/staffAgent/CONTINUIDADE.md`**

Widget: `StaffAgentFloat.tsx` (este diretório), montado em `app/admin/layout.tsx`.

Em outro computador: `git pull` nos dois repos e cole no Cursor o prompt de retomada que está no topo desse arquivo da API.

## Estado em 14/09/2026

**Provider:** Staff Agent usa **xAI/Grok `grok-4.3`** + modo guia + **memória do chat**.
WhatsApp continua OpenAI. Status: `code_rev: staff-agent-memory-v1`.

O float envia as últimas mensagens no `history` do `/turn` para não pedir datas de novo.
**Chat (`StaffAgentFloat.tsx`)** — com uma ação em preview, o campo de texto continua
liberado: a mensagem vai para `POST /turn` com o `confirm_id` e complementa a ação
pendente em vez de abrir outra. Responder "sim" ou "pode criar" aplica direto.

**Modo guia (API):** se pedir algo sem tool (ex. criar item no cardápio), o Agent
orienta passo a passo na tela e retoma com “pronto” / “parei em…”.

**Tempo real** — três telas escutam Socket.IO e recarregam sozinhas:

| Tela | Room / evento |
|------|---------------|
| `app/admin/cardapio` | `menu_item_visibility` |
| `app/admin/restaurant-reservations` | `join_agenda` → `reservation_block_changed` |
| `app/admin/detalhes-operacionais` | `join_os` → `operational_detail_changed` |

Cuidado ao mexer nesses listeners: eles são montados uma vez e precisam de `useRef`
para não recarregar com o filtro de data antigo (foi um bug real em detalhes-operacionais).

**`/admin/detalhes-operacionais`** — simplificada para o colaborador: sem os botões
"Ver Eventos" e "Novo Detalhe" (o código dos modais continua lá, só sem gatilho).
O caminho principal é a seção de OS de Artista/Banda/DJ; a lista de detalhes por data
ficou como complemento opcional, decisão do Jeff. O rodapé explica o fluxo.
