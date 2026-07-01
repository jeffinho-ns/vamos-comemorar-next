# Plano de Arquitetura SaaS Multi-Tenant — Agilizaiapp

> Documento de planejamento e acompanhamento da migração do Agilizaiapp
> (`vamos-comemorar-next` + `vamos-comemorar-api`) de sistema multi-estabelecimento
> hardcoded para um **SaaS B2B multi-tenant** real.
>
> Este arquivo é a fonte de verdade compartilhada entre os dois computadores de
> desenvolvimento. **Sempre que avançar, atualize a seção "STATUS / ONDE PARAMOS".**

---

## STATUS / ONDE PARAMOS

| Campo | Valor |
|-------|-------|
| Última atualização | 2026-06-29 |
| Modo atual | **`SAAS_MODE=observe` LIGADO em produção** (Render). Front já envia `Authorization` nas proxies de reserva. App intacto (observe nunca bloqueia). |
| Fase em andamento | Fase 2 — preparação do `enforce` seguro. `tenantMiddleware` endurecido (anônimo passa; só restringe autenticado) + isolamento de leitura por escopo na listagem de reservas, ambos **inertes** até `SAAS_MODE=on`. |
| Próximo passo | Coletar logs `[tenant:observe]` por alguns dias; estender `establishmentScopeClause` aos demais endpoints de leitura; validar `enforce` com 1 usuário de teste restrito; só então virar `on` rota a rota. |
| Pendências/decisões | Billing definido (manual primeiro). `memberships` ainda vazio em prod → `enforce` usa fallback `user_establishment_permissions` (48 perms / 33 usuários). Falta JWT com tenant e RLS. |

> ⚠️ NADA foi executado no banco de produção. Nenhum arquivo existente do back-end/front-end
> foi modificado — só foram ADICIONADOS arquivos novos, todos fail-open / não plugados.
> Detalhes da entrega: ver "Log de progresso" e os runbooks
> `vamos-comemorar-api/migrations/saas/README.md` e `vamos-comemorar-api/tenancy/README.md`.

### Como retomar no outro PC
1. `git pull` nos dois repositórios (`vamos-comemorar-next` e `vamos-comemorar-api`).
2. Leia esta seção de status para saber a fase atual e o próximo passo.
3. Consulte o checklist abaixo para ver o que já foi concluído.

### Checklist de fases
- [~] **Fase 0** — Fundação / segurança. Itens seguros prontos como arquivo. NÃO feito (exige staging/observação): mover middleware p/ raiz, auth em rotas públicas, remover credenciais hardcoded.
- [~] **Camada de segurança** (transversal) — feature flags `SAAS_MODE` (off/observe/on) + fail-open implementados; runner de migration com trava de confirmação e tabela de controle.
- [x] **Fase 1** — Banco / tenant model: migrations `001..005` validadas em staging e **APLICADAS EM PRODUÇÃO** (2026-06-28) com 0 erros e 0 órfãos. Falta só a virada NOT NULL (Contract, fase posterior).
- [~] **Fase 2** — Isolamento. `tenantMiddleware` + `optionalAuth` plugados em produção; `/api/me/entitlements` montado; **`SAAS_MODE=observe` LIGADO**; front envia `Authorization` nas proxies. `tenantMiddleware` endurecido (anônimo NÃO é bloqueado; só restringe usuário autenticado fora de escopo) + `establishmentScopeClause` na listagem de reservas (isolamento de leitura), com teste unitário. Tudo INERTE até `on`. Falta: estender escopo aos demais endpoints, validar com usuário restrito, virar `on` rota a rota; JWT com tenant; RLS.
- [~] **Fase 3** — RBAC + entitlements: `tenancy/entitlements.js`, `requireModule`, `requirePermission`, `GET /api/me/entitlements` prontos (fail-open, NÃO plugados).
- [~] **Fase 4** — Front modular: `EntitlementsContext`, `useCan`, `<Gate>`, `moduleManifest` criados (fail-open, NÃO consumidos pela sidebar ainda). Quebra de monolitos: pendente.
- [ ] **Fase 5** — Faturamento SaaS: schema (`invoices/payments/billing_events`) criado na migration 002; lógica/`PaymentProvider` pendente.
- [ ] **Fase 6** — Painel Super Admin + onboarding. Flag `users.is_super_admin` na migration 003.
- [ ] **Fase 7** — Desacoplar IA / hardcodes residuais.

Legenda: [x] concluído · [~] parcial/pronto-mas-inerte · [ ] não iniciado.

### Log de progresso (adicionar 1 linha por sessão)
- 2026-06-03 — Diagnóstico (raio-X) concluído e plano aprovado. Documento versionado para sincronizar entre os dois PCs.
- 2026-06-28 — Implementada a **fundação aditiva e inerte** sem tocar em produção: migrations SaaS `001..005` + runner (`scripts/saas/run-saas-migrations.js`), módulos `tenancy/*` (featureFlags, tenantScope, tenantMiddleware, entitlements, requireModule, requirePermission, meEntitlementsRouter) — nenhum plugado no `server.js`. No front: `EntitlementsContext`/`useCan`/`<Gate>`/`moduleManifest` fail-open, sem alterar `layout.tsx`/middleware. Verificado: `tsc --noEmit` do next OK; testes da API mantêm o mesmo resultado pré-existente (1 falha de contrato do funil de IA, não relacionada). Sem commit/push.
- 2026-06-28 — **Migrations validadas em STAGING** (Docker Postgres 18 = versão de produção; cópia via `pg_dump` do banco real, 50 MB). Aplicadas `001..005` com 0 erros. Resultado: org piloto `grupo-ideia-um` (saas_enabled=false), 7 establishments reconciliando places+bars (Rooftop=place9/bar5, HighLine=place7/bar3, Tio Jacques=bar-only), 7 módulos, 13 permissões, 5 roles, 1 super_admin/148 users, e **0 linhas órfãs** (organization_id) em todas as tabelas-chave. Migration 005 ajustada (aliases place→bar + bars sem place) e confirmada **idempotente** no re-run.
- 2026-06-28 — **Fase 1 APLICADA EM PRODUÇÃO**. Backup `pg_dump` salvo antes (18 MB). Rodado via `scripts/saas/run-saas-migrations.js` (`SAAS_MIGRATE_CONFIRM=apply`) → 001..005 ✅ 0 erros. Validação em prod idêntica ao staging (0 órfãos, 7 establishments). Health check pós-migration OK (`/api/bars` e `/api/places` HTTP 200). `SAAS_MODE` permanece off — nenhuma mudança de comportamento. Sem commit/push.
- 2026-06-28 — **Fase 2 iniciada e DEPLOYADA em produção (inerte)**. Commit `f61fd73` push no master → auto-deploy Render. `optionalAuth` + `tenantMiddleware` (observe) plugados em `routes/restaurantReservations.js` e `routes/reservas.js`; `GET /api/me/entitlements` montado (read-only, fail-open). Verificado pós-deploy: rota nova `403` (exige token), `/api/restaurant-reservations` `200` sem regressão durante todo o deploy. **Inerte** até `SAAS_MODE=observe` no Render. Próximo: (1) setar `SAAS_MODE=observe` no Render; (2) front enviar `Authorization` nas chamadas de reserva para o observe ter dados; (3) só então `enforce` rota a rota.
- 2026-06-29 — **`SAAS_MODE=observe` confirmado em produção** + front enviando `Authorization` nas proxies de reserva. Preparação do `enforce` de forma **segura e inerte**: (1) descoberto que o formulário **público** de reserva faz `POST /api/restaurant-reservations` **sem token** → ligar `on` "cru" bloquearia o cliente; (2) `tenantMiddleware` **endurecido**: anônimo NUNCA é bloqueado (rota mantém política pública), só restringe usuário AUTENTICADO fora de escopo; (3) novo `tenancy/queryScope.js` (`establishmentScopeClause`) aplicado na listagem `GET /api/restaurant-reservations` para isolamento de LEITURA por escopo; (4) teste unitário `tests/unit/tenantMiddleware.test.js` (6/6) cobrindo off/observe/on × anônimo/admin/escopado. Tudo inerte até `SAAS_MODE=on`. Suíte: mesma 1 falha pré-existente do funil de IA (não relacionada).
- 2026-06-29 — **Isolamento de leitura estendido** em `restaurantReservations.js`: `establishmentScopeClause` em `GET /stats/dashboard` (3 queries agregadas + NULLIF anti-divisão-por-zero) e novo `canReadEstablishment` (checagem pós-fetch → 404) em `GET /:id` e `GET /:id/guest-list`. Testes `tests/unit/queryScope.test.js` (9) — total tenancy 15/15. `reservas.js` (sistema legado de eventos) deixado como está: não-admin já filtra por `user_id`, não é vazamento de tenant. **⚠️ CAVEAT de IDs:** `restaurant_reservations.establishment_id` = id **operacional** (place/bar), igual ao que o front manda e ao `user_establishment_permissions`. `memberships.establishment_id` = id **canônico** (establishments.id) — espaço diferente. Hoje funciona porque `memberships` está vazio (loadUserScope cai no legado/operacional). **Antes de popular `memberships`**, decidir: gravar id operacional, traduzir no `loadUserScope`, ou migrar `restaurant_reservations.establishment_id` p/ canônico. Próximo: validar `enforce` com 1 usuário restrito antes do `on`.
- 2026-06-28 — **Unificação places+bars (passos seguros) APLICADA EM PRODUÇÃO**. Migrations `006` (enriquece `establishments` com campos tipados de places+bars + `theme` JSONB; decisão: tipado + JSONB) e `007` (`establishment_modules` = serviços por casa, on/off). Seed por evidência: 5 casas operacionais com tudo; Sitio Ilha e Tio Jacques só cardápio. Validado em staging e prod; API 200. **Ainda intacto**: places/bars seguem existindo (compatibilidade); o código continua lendo as tabelas legadas. **Pendente p/ próxima sessão (staging + decisão):** Passo 4-5 — transformar places/bars em VIEWS sobre establishments e migrar as queries da API para o id canônico; depois aposentar as tabelas legadas.

---

## Decisão estratégica
Refatoração evolutiva (**Strangler Fig**), **NÃO** reescrita. Introduzir a camada de
tenancy por baixo do que já existe e migrar módulo a módulo. O grupo atual (Highline,
Justino, Pracinha, Oh Fregues, Rooftop, Sítio Ilha) vira a primeira `organization` via
backfill. O sistema atual permanece em produção durante toda a migração.

## Diagnóstico-chave (gargalos a resolver)
- Banco único, pool único, isolamento apenas lógico (`config/database.js`).
- Modelo dual de casa: `places` (operacional) vs `bars` (cardápio), com IDs divergentes e aliases manuais.
- Hardcodes por ID: `defaultWeeklySchedule.js` (mapa de nomes), Rooftop `=== 9`, Pracinha `=== 8`, 2º giro bistrô, data `2026-04-20`, áreas por `ILIKE 'Reserva Rooftop - %'`, subáreas Highline em JS.
- Acesso por listas de e-mails no `app/middleware.ts` e `app/admin/layout.tsx`.
- **SEGURANÇA:** `app/middleware.ts` está no lugar errado (Next.js só executa na raiz) → proteção de rota server-side está desativada hoje. `restaurant-reservations` e `events` sem `authenticateToken`. Credenciais com fallback no repo.
- JWT só carrega `id, email, role` (sem tenant). Isolamento depende de query param confiável do cliente.
- Padrão seguro JÁ existe em `routes/whatsappAdmin.js` (`loadUserScope` / `canAccessEstablishment`) — generalizar.

## Modelo de dados alvo (tabelas novas, sem destruir legado)
- `organizations` (tenant raiz, slug, status).
- `establishments` (unifica places+bars, `organization_id`, `config` JSONB para horários/limites/regras, `legacy_place_id`, `legacy_bar_id`, `whatsapp_phone_number_id`).
- `memberships` (user × organization × establishment × role; establishment NULL = escopo org).
- `roles`, `permissions` (`modulo:acao`), `role_permissions`.
- `modules`, `plans`, `plan_modules`, `subscriptions`, `organization_modules`.
- Faturamento: `invoices`, `payments`, `billing_events` (Fase 5).
- `users.is_super_admin` (boolean) para gating do painel `/superadmin` (substitui lista de e-mails).
- Adicionar `organization_id` (nullable → backfill → NOT NULL) nas tabelas operacionais.

## Isolamento de dados
Shared DB + `organization_id` em todas as tabelas + RLS no Postgres. Três camadas:
JWT com `organization_id`; `tenantMiddleware` que injeta `req.tenant` e `SET app.current_org`;
policies RLS como rede de segurança. Queries usam sempre o tenant do token, nunca o query param.

## Modularização / monetização
- Entitlements resolvidos no login (`/api/me/entitlements`).
- Front: `EntitlementsContext`, sidebar data-driven (`moduleManifest`), componente `<Gate module action>`, hook `useCan`.
- Back: `requireModule('reservas')` em cada router (enforcement real de receita).

## RBAC
- Permissões `modulo:acao` (`reservas:create`, `checkin:update`, ...).
- Roles de fábrica: Account Admin, Gerente do Bar, Promoter, Hostess, Recepção. Cliente pode clonar e criar roles customizadas.
- Generalizar `checkEstablishmentPermission.js` (existe mas não está plugado) em `requirePermission`.

## Camada de segurança (transversal a todas as fases)
Princípio: quase tudo no plano é **ADITIVO**. Risco concentrado em 3 pontos (middleware, auth em rotas públicas, RLS) — todos com mitigação.
- **Staging-first:** nenhuma migration toca produção sem passar por staging com testes de isolamento entre tenants.
- **Expand → Migrate → Contract:** adiciona o novo, faz conviver com o legado, só remove o velho no fim. Coluna nasce nullable; vira NOT NULL só após backfill 100% validado.
- **Feature flags por organização:** "modo SaaS" liga primeiro só na org piloto (Grupo Ideia Um, dados reais). Rollback = desligar flag.
- **Middleware na raiz em MODO OBSERVAÇÃO antes de bloquear:** loga quem SERIA bloqueado, compara com uso real por dias, ajusta matriz de roles, só então ativa o bloqueio (hoje o middleware está inativo, então ligar "cru" bloquearia usuários legítimos).
- **Auth nas rotas públicas** (restaurant-reservations, events): primeiro mapear chamadas do front, garantir Authorization header, usar optionalAuth na janela de transição, só depois exigir token.
- **RLS faseado:** ativar 1 tabela de baixo impacto por vez em staging; role de banco bypass para jobs/migrações; rollback imediato com `DISABLE ROW LEVEL SECURITY`. Risco principal é tela vazia (zero linhas), não erro.
- **Backup do banco** antes de cada migration com organization_id / RLS.

## Faturamento SaaS (Fase 5) — escopo: receita que VOCÊ recebe; modo manual primeiro, gateway-ready
Objetivo: o Super Admin ver quanto cada empresa/grupo/estabelecimento paga PELO sistema
(assinatura/módulos), com MRR e status de pagamento. Cobrança real começa **MANUAL**
(boleto/PIX por fora); sistema registra e controla. Arquitetura pronta para plugar gateway
(Stripe/Asaas/Pagar.me) depois sem refazer.
- Tabelas novas: `invoices` (organization_id, período, valor, status pago/pendente/atrasado, due_date), `payments` (invoice_id, valor, data, método, comprovante), `billing_events` (auditoria de mudanças de plano/valor).
- Receita derivada de `subscriptions` + `plan_modules` + `organization_modules`. Faturamento atribuível por organização e, opcionalmente, rateado por estabelecimento.
- Métricas: MRR, receita por org, inadimplência, churn — exibidas no painel Super Admin.
- Abstração `PaymentProvider` (interface): implementação `ManualProvider` agora; `StripeProvider`/`AsaasProvider` depois implementam a mesma interface (webhooks de pagamento atualizam invoices automaticamente).
- Suspensão por inadimplência: `subscription.status = past_due` → entitlements bloqueiam módulos (reaproveita `requireModule`).

## Painel Super Admin (Fase 6) — área exclusiva, isolada do app dos clientes
Rota separada `/superadmin` (fora de `/admin`), acessível SÓ a super admins
(flag `users.is_super_admin` + verificação server-side dedicada, **NÃO** lista de e-mails). Capacidades:
- Visão global: todas as organizações e estabelecimentos, status, plano, módulos ativos.
- Dashboard financeiro: MRR, receita por cliente, faturas em aberto, inadimplência.
- Gestão de clientes: criar nova organização, suspender/reativar, trocar plano, ligar/desligar módulos (organization_modules).
- Onboarding em poucos cliques: aciona o endpoint de provisionamento (cria establishment + horários/áreas/mesas/FAQ template + 1º admin + permissões + assinatura) em uma transação.
- Área de treinamentos/materiais: cadastrar tutoriais, vídeos e documentos visíveis aos clientes por plano/módulo.
- Impersonate (entrar como cliente para suporte) com auditoria obrigatória em `action_logs`.
- Único papel que adiciona novos clientes; Account Admin do cliente NUNCA acessa `/superadmin` nem vê outras orgs.

## Roadmap (ordem de execução)
1. **Fase 0** — Fundação/segurança.
2. **Fase 1** — Banco / tenant model + backfill org piloto.
3. **Fase 2** — Isolamento (JWT tenant, tenantMiddleware, RLS faseado).
4. **Fase 3** — RBAC + entitlements.
5. **Fase 4** — Front modular + quebra dos monolitos.
6. **Fase 5** — Faturamento SaaS.
7. **Fase 6** — Painel Super Admin + onboarding.
8. **Fase 7** — Desacoplar IA / hardcodes residuais.

> A **Camada de segurança** é transversal e deve ser observada em todas as fases.

## NÃO escrever código ainda
Este é o estudo/diagnóstico e o roadmap. Implementação só após aprovação das fases.
