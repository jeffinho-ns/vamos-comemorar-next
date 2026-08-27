# Staff Agent (front) — ponte de continuidade

Documentação completa para retomar o piloto:

→ **`vamos-comemorar-api/services/staffAgent/CONTINUIDADE.md`**

Widget: `StaffAgentFloat.tsx` (este diretório), montado em `app/admin/layout.tsx`.

Em outro computador: `git pull` nos dois repos e cole no Cursor o prompt de retomada que está no topo desse arquivo da API.

## Estado em 27/08/2026 (último commit: `d3ee6ef8`)

**Chat (`StaffAgentFloat.tsx`)** — com uma ação em preview, o campo de texto continua
liberado: a mensagem vai para `POST /turn` com o `confirm_id` e complementa a ação
pendente em vez de abrir outra. Responder "sim" ou "pode criar" aplica direto.

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
