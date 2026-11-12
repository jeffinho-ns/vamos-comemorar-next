# Handoff de continuidade — 12 nov 2026

Cópia espelhada do handoff operacional. A versão canônica está em:

`vamos-comemorar-api/docs/HANDOFF-CONTINUIDADE.md`

Faça `git pull` nos dois repos e continue por lá (ponte Wame + análise Meta + conexão das casas).

---

## Resumo ultra-rápido

| Item | Estado |
|---|---|
| Ideiaum / central `91109-1838` | Banida — não usar |
| App **Agilizaiapp Atendimento** | Análise Meta **enviada / em andamento** |
| Ponte **Wame** | Ativa até Meta aprovar; prazo casas **14/11** |
| Código API | Commit `a89ebf72` — rota `/api/webhooks/wame` |
| Env Render | `WAME_SERVER_URL`, `WAME_API_KEY`, `WHATSAPP_OUTBOUND_PROVIDER=wame` |
| Casas | Ainda conectar via Embedded Signup Wame (celular + Facebook da casa; Instagram não serve) |
| Campanhas | Proibido no período — só responder quem escreveu |

Amanhã: pull → conferir deploy/env → conectar Pracinha → testar “oi” → demais casas.
