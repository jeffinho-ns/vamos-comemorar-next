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
| Última atualização | 2026-07-03 (Fase 4 fechada — código) |
| Modo atual | **`SAAS_MODE=on`** API · **`NEXT_PUBLIC_SAAS_MODE=on`** Vercel ✅ |
| Fase em andamento | **Fase 3** — RBAC fino promoters + tenancy rotas legadas |
| Próximo passo | Fase 3: `requirePermission` promoters; tenantMiddleware gift-rules/FAQ; checklist manual UI (`docs/FASE-4-CHECKLIST-UI.md`) |
| Veredito B2B | **~95%** — Fase 4 front completa; gaps Fase 2/3 API; Flutter parcial |
| Commits recentes | Next Fase 4 (local) · API `66e3f28` · Flutter `90b66ed` |

### Como retomar no outro PC
1. `git pull` nos **três** repositórios (`vamos-comemorar-next`, `vamos-comemorar-api`, `agilizaiapp`).
2. Leia **RAIO-X ATUAL** e **FECHAMENTO FASE A FASE** (ordem de execução para 100%).
3. Consulte **Matriz por módulo** e **Backlog P1–P5**.
4. Veja o **Log de progresso** — última linha = sessão mais recente.

### Checklist de fases
- [~] **Fase 0** (~95%) — Middleware ✅; DATABASE_URL ✅; optionalAuth reservas/eventos ✅; `/reservar` envia token se logado ✅. Falta: mapear rotas públicas restantes.
- [x] **Camada de segurança** — feature flags ✅; runner migrations ✅; RLS **25 tabelas** ✅ (008–023).
- [~] **Fase 1** (~95%) — migrations **001–024** ✅; NOT NULL 13 tabelas core (019) ✅; users constraint (024) ✅; RLS cardápio/WhatsApp (021) ✅. Falta: **places/bars → views** sobre `establishments` (passo 4–5).
- [~] **Fase 2** (~90%) — RLS 25 tabelas ✅; `tenantMiddleware` em 19 routers ✅. Falta: ~30 rotas legadas sem tenancy (ver RAIO-X § rotas).
- [~] **Fase 3** (~85%) — `requirePermission` em cardápio, whatsapp, eventos, checkin, reservas ✅. Falta: **promoters** (`requirePermission`); rotas sensíveis sem tenant.
- [x] **Fase 4** — Entitlements + sidebar ✅; `AdminPageGate` ✅; **`AdminSaasGuard` + `useSaasAccess` em todas as páginas admin** ✅; `<Gate>` em galeria/gifts/executive-events ✅; `/reservar` filtra por `establishmentIds` quando logado ✅. Manual: `docs/FASE-4-CHECKLIST-UI.md`.
- [x] **Fase 5** — Billing manual MVP ✅ (gateway Stripe/Asaas = fase posterior).
- [~] **Fase 6** (~90%) — Superadmin ✅; provisionamento operacional ✅ (Bloco A). Falta: wizard pós-provisionamento interativo.
- [~] **Fase 7** (~75%) — `establishmentRules` + editor superadmin ✅; `operationalProfileIds` ✅. Falta: hardcodes e-mail/ID residuais (Next, API, IA).

Legenda: [x] concluído · [~] parcial · [ ] não iniciado.

---

## ROADMAP PARA 100% (executável)

### Definição de “100% fechado” — status atual

| # | Critério | Status |
|---|----------|--------|
| 1 | Superadmin cria org → casa em `/api/places`, `/reservar`, `/admin/cardapio` | **Parcial** — CLI ✅; `/reservar` filtra por entitlements client ✅; validação manual org B pendente |
| 2 | Account Admin convida usuários com roles | **✅** — `/api/org/*` + `/admin/equipe` |
| 3 | Cada role vê só o permitido (sidebar + API + RLS) | **Parcial** — reservas ✅; promoters sem RBAC fino; ~30 rotas sem tenant |
| 4 | Org A nunca vê dados da Org B | **✅ API** — smoke formal; **UI manual** pendente |
| 5 | WhatsApp/IA, check-ins, promoters, eventos scoped | **Parcial** — RLS ✅; número WA por org ❌; promoters RBAC ~ |
| 6 | Zero listas de e-mail / IDs hardcoded | **❌** — ver RAIO-X § hardcodes |
| 7 | App Flutter lista só casas da org | **Parcial** — places ✅; cardápio/eventos/reservas ❌ |

### Blocos (ordem de execução)

| Bloco | Foco | Status | Entregas-chave / lacunas |
|-------|------|--------|--------------------------|
| **A** | Provisionamento operacional | **✅ feito** | `provisionOperationalEstablishment`, place+bar+legacy IDs, área/mesas, FAQ, 5 roles |
| **B** | RBAC real | **~85%** | Reservas ✅; `/api/org/*` ✅. Falta: `requirePermission` em **promoters** |
| **D** | Front modular | **✅ Fase 4** | `AdminPageGate`; `AdminSaasGuard` em 35+ páginas admin; `<Gate>` ações de escrita; `/reservar` + entitlements |
| **E** | Segurança / legado | **~70%** | 024 ✅; smoke DB ✅. Falta: hardcodes; places/bars → views |
| **F** | Mobile + gateway | **~40% app** | Places filtro org ✅. Falta: MenuService/eventos/reservas; Stripe/Asaas |

### Decisões pendentes (registrar aqui quando decidir)
| # | Decisão | Opções | Escolha atual |
|---|---------|--------|---------------|
| 1 | `memberships.establishment_id` | canônico (traduz no loadUserScope) vs operacional | **canônico** (já implementado tradução) |
| 2 | UEP legado | deprecar vs conviver | **conviver** até memberships populado |
| 3 | Check-ins tenant | nova coluna/tabela vs amarrar em guest_lists | **pendente** |
| 4 | App Flutter escopo completo | places only vs todos os módulos | **places done** — cardápio/eventos/reservas pendente |
| 5 | Número WhatsApp por org | `whatsapp_phone_number_id` por establishment | **pendente** |
| 6 | Entitlements Flutter fail-open | fail-open vs fail-closed em erro HTTP | **fail-open** (revisar) |

### Matriz por módulo (prontidão B2B — atualizada)

| Módulo | org_id | RLS | tenantMiddleware | RBAC fino | Nova org opera? |
|--------|--------|-----|------------------|-----------|-----------------|
| Reservas (restaurant-reservations, waitlist, walk-ins, large, birthday, blocks) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guest lists / guests | ✅ | ✅ | ✅ | ~ | ✅ |
| Reservas legado (`reservas`) | ✅ | ✅ | ✅ | ~ | ✅ |
| Promoters | ✅ | ✅ | ✅ | **❌** | parcial |
| Check-ins | via guests ✅ | ✅ | ✅ | ✅ | ✅ |
| Cardápio | ✅ | ✅ | ✅ | ✅ | ✅ |
| WhatsApp / IA | ✅ | ✅ | ✅ | ✅ | parcial (nº WA/org pendente) |
| Eventos admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Eventos público (`/api/events`) | ✅ | ✅ | ✅ | parcial | ✅ |
| Users | ✅ | ✅ | parcial | ~ | ✅ (POST com org_id + RLS) |
| Superadmin / billing | ✅ | — | — | — | ✅ |
| App Flutter | client | — | — | — | **places only** |

### Smoke test org demo (checklist)

**API / DB**
- [ ] `POST /api/superadmin/organizations` cria org com `legacy_place_id` + `legacy_bar_id`
- [x] Script `scripts/saas/provision_org_demo_b.js` (alternativa CLI)
- [x] GET `/api/places` lista casas
- [x] Org A vs B formal — `grupo-ideia-um` + `org-demo-b` (API)
- [x] Org A vs B isolamento API — smoke demo B sem Highline (est_id=7)
- [x] Migration 024 users constraint — prod 2026-07-03
- [x] Smoke DB: 0 mismatches reservas↔establishments; 0 users órfãos
- [x] Smoke API autenticado — `smoke_diagnostic_full.js` 24/24 (2026-07-03)
- [x] Flutter places (simulado) — filtro org demo B pós-deploy `66e3f28`

**UI manual (Fase 4 — roteiro em `docs/FASE-4-CHECKLIST-UI.md`)**
- [ ] `/reservar` mostra casa org B (login demo B)
- [ ] `/admin/cardapio` abre para bar da org B
- [ ] Sidebar recepção vs gerente visualmente diferente
- [ ] Org A vs B: zero vazamento no browser (conta demo B)
- [ ] Build/release Flutter + login demo B (só Bar Demo B)

---

## RAIO-X ATUAL (2026-07-03)

### Camadas — resumo

| Camada | % | Evidência |
|--------|---|-----------|
| Banco / tenant model | ~95% | migrations 001–024; org piloto + org-demo-b |
| RLS Postgres | ~95% | 25 tabelas; smoke DB 0 mismatches |
| API enforce | ~85% | SAAS_MODE=on; 19 routers com tenantMiddleware |
| Entitlements | ✅ | `/api/me/entitlements` + `establishmentIds` |
| Front Next admin | ~95% | sidebar; AdminPageGate; AdminSaasGuard 35+ páginas; Gate escrita; /reservar entitlements |
| Superadmin / billing | ✅ MVP | `/superadmin`, faturas manuais |
| Flutter | ~40% SaaS | places filtradas; cardápio/eventos/reservas expostos |
| Produção | ✅ | Render estável; commits pushados |

### Rotas API **sem** `tenantMiddleware` (gap Fase 2)

| Mount | Arquivo | Risco |
|-------|---------|-------|
| `/api/places`, `/api/bars` | `places.js`, `bars.js` | Lista pública; filtro org só no client Flutter |
| `/api/restaurant-tables` | `restaurantTables.js` | Mesas sem escopo |
| `/api/gift-rules` | `giftRules.js` | Brindes/promoters |
| `/api/establishment-permissions` | `establishmentPermissions.js` | UEP legado |
| `/api/rooftop` | `rooftopConduction.js` | Fluxo Rooftop específico |
| `/api/admin/*` (FAQ, IA) | `establishmentFaqsAdmin.js`, `aiAssistant*.js` | Admin sem tenant |
| `/api/v1/admin-dashboard` | `adminDashboard.js` | Agregado global |
| `/api/executive-events` | `executiveEvents.js` | Eventos executivos |
| `/api/users` | `users.js` | RLS pontual no INSERT; sem tenant gate global |

**Com tenancy (19 routers):** reservas, waitlist, walk-ins, large, birthday, blocks, areas, settings, guest-lists, checkin, events, eventos, cardapio, whatsapp, promoters, orgTeam, reservas legado.

### RBAC fino — gap Fase 3

| Router | Tem | Falta |
|--------|-----|-------|
| Reservas (10 rotas) | `reservasPermissionMiddleware` | — |
| Promoters | `requireModule('promoters')` | **`requirePermission`** |
| Cardápio, WhatsApp, Eventos, Check-in | `requirePermission` | — |

### Hardcodes residuais (gap Fase 7 / Bloco E)

**API:** `routes/users.js` (PROMOTER_ONLY_EMAILS, GERENTE_GERAL_EMAILS); `config/superAdmins.js`; `config/whatsappHighlineAccess.js`; `defaultWeeklySchedule.js` (IDs 1,4,7,8,9,10); `PromptBuilder.js` / `AgentPromptBuilder.js` (`id === 7`).

**Next:** `app/config/promoter-bars.ts`; `app/utils/establishmentAccessRules.ts`; `app/config/establishmentIds.ts`. ~~`SUPER_ADMIN_EMAILS` em reservas/galeria~~ removido (2026-07-03 Fase 4).

**Nota:** `middleware.ts` raiz já sem listas de e-mail (2026-07-03).

### Front Next — Fase 4 ✅

| Mecanismo | Cobertura |
|-----------|-----------|
| `AdminSaasGuard` / `useSaasAccess` | **35+ páginas admin** (reservas, galeria, gifts, permissions, checkins/tablet, eventos/*, etc.) |
| `<Gate>` | cardapio, users, promoters, equipe, galeria (upload), gifts (nova regra), executive-events |
| `AdminPageGate` | layout — rotas mapeadas em `adminNavModules.ts` |
| `/reservar` | `filterPlacesByEntitlements` + `optionalAuthHeaders` em GET `/api/places` |
| `EntitlementsContext` | expõe `establishmentIds` da API |

### Flutter — gap Bloco F

| Área | Arquivo | Status |
|------|---------|--------|
| Places | `place_service.dart` | ✅ filtro entitlements |
| Cardápio | `menu_service.dart` | ❌ `GET /bars` sem filtro org |
| Eventos | `event_service.dart` | ❌ sem filtro tenant |
| Reservas | `reservation_service.dart` | ❌ sem validação escopo client |

---

## FECHAMENTO FASE A FASE (ordem para 100%)

Marque `[x]` conforme fechar cada fase nas próximas sessões.

### Fase 4 → 100% ✅ (código; manual em `docs/FASE-4-CHECKLIST-UI.md`)
- [x] `useSaasAccess` + `useRequireSaasModule` / `AdminSaasGuard` em **todas** as páginas admin
- [x] `<Gate>` check-in em listas; configurar eventos; galeria upload; gifts nova regra; executive-events
- [x] Rotas admin em `adminNavModules.ts`
- [x] `/reservar`: filtro tenant via `establishmentIds` + Authorization opcional
- [x] Removido `SUPER_ADMIN_EMAILS` de reservas/galeria → `readSuperAdminFromCookie`
- [ ] Checklist UI manual browser + Flutter release (operacional)

### Fase 3 → 100% (~3–5 dias)
- [ ] `requirePermission` em `promotersAdvanced.js` e `promoterEventos.js`
- [ ] `tenantMiddleware` + `requireModule` em: gift-rules, restaurant-tables, FAQ/IA admin
- [ ] GET `/api/places` com filtro server-side quando autenticado (optionalAuth)

### Fase 2 → 100% (~1 semana)
- [ ] Plugar tenancy nas rotas restantes (tabela RAIO-X)
- [ ] Validar RLS + tenantMiddleware juntos em staging por rota

### Fase 7 → 100% (~1–2 semanas)
- [ ] Migrar `promoter-bars.ts` + `establishmentAccessRules.ts` → entitlements
- [ ] Remover listas e-mail de `users.js`; superadmin só `is_super_admin`
- [ ] IA via `operationalProfileIds` + `establishmentRules` (não `id === 7`)

### Fase 1 → 100% (baixa urgência)
- [ ] Confirmar migration 021 aplicada prod
- [ ] places/bars como **views** sobre `establishments`

### Fase 6 → 100% (produto)
- [ ] Wizard pós-provisionamento interativo no `/superadmin`

### Bloco F Flutter → 100%
- [ ] MenuService, EventService, ReservationService com escopo tenant
- [ ] Entitlements fail-closed no app
- [ ] Stripe/Asaas (fase posterior)

---

## BACKLOG PRIORIZADO (P1–P5)

| Prioridade | Itens | Estimativa |
|------------|-------|------------|
| **P1** | Checklist manual UI; smoke pós-deploy; build Flutter | 1–2 dias |
| **P2** | Promoters RBAC; tenancy rotas sensíveis; filtro server-side places | 3–5 dias |
| **P3** | Hardcodes → memberships; IA sem id=7; places/bars views | 1–2 sem |
| **P4** | Gate front completo; Flutter módulos restantes | 1 sem |
| **P5** | Wizard onboarding; gateway pagamento; decisão check-ins | 2–4 sem |

**100% B2B operacional (sem gateway):** P1–P4 · **~2–3 semanas**  
**100% produto SaaS comercial:** + P5 · **+2–4 semanas**

### Arquivos-chave (Bloco A/B)
| Arquivo | Função |
|---------|--------|
| `vamos-comemorar-api/billing/provisioningOperational.js` | place/bar/área/mesas/FAQ na transação |
| `vamos-comemorar-api/billing/rolePermissionMatrix.js` | matriz role → permissions |
| `vamos-comemorar-api/billing/billingService.js` | `provisionOrganization`, memberships |
| `vamos-comemorar-api/migrations/saas/020_role_permissions_seed.sql` | backfill role_permissions orgs existentes |
| `vamos-comemorar-api/migrations/saas/021_rls_cardapio_whatsapp.sql` | RLS cardápio + WhatsApp |
| `vamos-comemorar-api/migrations/saas/022_add_organization_id_eventos.sql` | coluna org_id em eventos |
| `vamos-comemorar-api/migrations/saas/023_rls_eventos_listas_users.sql` | RLS eventos + users |
| `vamos-comemorar-api/tenancy/operationalProfileIds.js` | profile → operational id (IA/WhatsApp) |
| `vamos-comemorar-api/scripts/saas/provision_org_demo_b.js` | org B demo idempotente |
| `vamos-comemorar-api/scripts/saas/smoke_diagnostic_full.js` | smoke autenticado 24 checks + simulação Flutter |
| `vamos-comemorar-api/scripts/saas/smoke_test_saas.js` | smoke público + DB + API autenticada |

---

### Log de progresso (adicionar 1 linha por sessão)
- 2026-06-03 — Diagnóstico (raio-X) concluído e plano aprovado. Documento versionado para sincronizar entre os dois PCs.
- 2026-06-28 — Implementada a **fundação aditiva e inerte** sem tocar em produção: migrations SaaS `001..005` + runner (`scripts/saas/run-saas-migrations.js`), módulos `tenancy/*` (featureFlags, tenantScope, tenantMiddleware, entitlements, requireModule, requirePermission, meEntitlementsRouter) — nenhum plugado no `server.js`. No front: `EntitlementsContext`/`useCan`/`<Gate>`/`moduleManifest` fail-open, sem alterar `layout.tsx`/middleware. Verificado: `tsc --noEmit` do next OK; testes da API mantêm o mesmo resultado pré-existente (1 falha de contrato do funil de IA, não relacionada). Sem commit/push.
- 2026-06-28 — **Migrations validadas em STAGING** (Docker Postgres 18 = versão de produção; cópia via `pg_dump` do banco real, 50 MB). Aplicadas `001..005` com 0 erros. Resultado: org piloto `grupo-ideia-um` (saas_enabled=false), 7 establishments reconciliando places+bars (Rooftop=place9/bar5, HighLine=place7/bar3, Tio Jacques=bar-only), 7 módulos, 13 permissões, 5 roles, 1 super_admin/148 users, e **0 linhas órfãs** (organization_id) em todas as tabelas-chave. Migration 005 ajustada (aliases place→bar + bars sem place) e confirmada **idempotente** no re-run.
- 2026-06-28 — **Fase 1 APLICADA EM PRODUÇÃO**. Backup `pg_dump` salvo antes (18 MB). Rodado via `scripts/saas/run-saas-migrations.js` (`SAAS_MIGRATE_CONFIRM=apply`) → 001..005 ✅ 0 erros. Validação em prod idêntica ao staging (0 órfãos, 7 establishments). Health check pós-migration OK (`/api/bars` e `/api/places` HTTP 200). `SAAS_MODE` permanece off — nenhuma mudança de comportamento. Sem commit/push.
- 2026-06-28 — **Fase 2 iniciada e DEPLOYADA em produção (inerte)**. Commit `f61fd73` push no master → auto-deploy Render. `optionalAuth` + `tenantMiddleware` (observe) plugados em `routes/restaurantReservations.js` e `routes/reservas.js`; `GET /api/me/entitlements` montado (read-only, fail-open). Verificado pós-deploy: rota nova `403` (exige token), `/api/restaurant-reservations` `200` sem regressão durante todo o deploy. **Inerte** até `SAAS_MODE=observe` no Render. Próximo: (1) setar `SAAS_MODE=observe` no Render; (2) front enviar `Authorization` nas chamadas de reserva para o observe ter dados; (3) só então `enforce` rota a rota.
- 2026-06-29 — **`SAAS_MODE=observe` confirmado em produção** + front enviando `Authorization` nas proxies de reserva. Preparação do `enforce` de forma **segura e inerte**: (1) descoberto que o formulário **público** de reserva faz `POST /api/restaurant-reservations` **sem token** → ligar `on` "cru" bloquearia o cliente; (2) `tenantMiddleware` **endurecido**: anônimo NUNCA é bloqueado (rota mantém política pública), só restringe usuário AUTENTICADO fora de escopo; (3) novo `tenancy/queryScope.js` (`establishmentScopeClause`) aplicado na listagem `GET /api/restaurant-reservations` para isolamento de LEITURA por escopo; (4) teste unitário `tests/unit/tenantMiddleware.test.js` (6/6) cobrindo off/observe/on × anônimo/admin/escopado. Tudo inerte até `SAAS_MODE=on`. Suíte: mesma 1 falha pré-existente do funil de IA (não relacionada).
- 2026-07-01 — **`SAAS_MODE=on` validado em produção** com `analista@pracinha.com`. Causa do bloqueio inicial: zero linhas em `user_establishment_permissions` (escopo só em `promoter-bars.ts`). Backfill UEP para Pracinha (8) e Oh Fregues (4). Próximo: estender enforce às rotas irmãs do painel.
- 2026-07-01 — **Fase 2 enforce-ready:** `loadUserScope` traduz `memberships.establishment_id` (canônico) → `legacy_place_id`/`legacy_bar_id` (operacional); escopo de mutação em `PUT/DELETE/:id` e `link-event` via `denyIfCannotReadEstablishment`; testes `tenantScope.test.js` (4). Runbook de enforce gradual em `tenancy/README.md`. Tudo inerte até `SAAS_MODE=on`.
- 2026-06-29 — **Isolamento de leitura estendido** em `restaurantReservations.js`: `establishmentScopeClause` em `GET /stats/dashboard` (3 queries agregadas + NULLIF anti-divisão-por-zero) e novo `canReadEstablishment` (checagem pós-fetch → 404) em `GET /:id` e `GET /:id/guest-list`. Testes `tests/unit/queryScope.test.js` (9) — total tenancy 15/15. `reservas.js` (sistema legado de eventos) deixado como está: não-admin já filtra por `user_id`, não é vazamento de tenant. **⚠️ CAVEAT de IDs:** `restaurant_reservations.establishment_id` = id **operacional** (place/bar), igual ao que o front manda e ao `user_establishment_permissions`. `memberships.establishment_id` = id **canônico** (establishments.id) — espaço diferente. Hoje funciona porque `memberships` está vazio (loadUserScope cai no legado/operacional). **Antes de popular `memberships`**, decidir: gravar id operacional, traduzir no `loadUserScope`, ou migrar `restaurant_reservations.establishment_id` p/ canônico. Próximo: validar `enforce` com 1 usuário restrito antes do `on`.
- 2026-07-02 — **Fix login Rooftop** (`analista.mkt02`): bypass middleware + sidebar sem esvaziar por entitlements vazios (`adminProfileEmails.ts`, commit `29c5f68` next).
- 2026-07-02 — **mkt02 validado** em produção com `@123Mudar`. Migration 008 já aplicada no banco prod.
- 2026-07-02 — **Fase 5/6 MVP:** API `billing/billingService`, `ManualPaymentProvider`, rotas `/api/superadmin/*`, `past_due` em entitlements; front `/superadmin` (dashboard, orgs, faturas manuais).
- 2026-07-02 — **Fase 7 continuação:** hardcodes removidos em `EventosController`, `reservas`, `restaurantTables`, IA (`processInboundTurn`), check-ins front; helpers de overlap/guest-list window em `establishmentRules`.
- 2026-07-02 — **Fase 2 stats:** `establishmentScopeClause` em `GET /large-reservations/stats/dashboard`, `GET /waitlist/stats/count`, `GET /walk-ins/stats/active`.
- 2026-07-02 — **Fase 2 expand + Fase 4 sidebar:** enforce em `guestListsAdmin`, `restaurantAreas`, `restaurantReservationBlocks`, `restaurantReservationSettings`, `eventos/dashboard`; removido fake admin sem token em guest-lists. Front: `EntitlementsProvider` montado, `filterNavByEntitlements` na sidebar (`adminNavModules.ts`). Ativar filtro real: `NEXT_PUBLIC_SAAS_MODE=on` no Render do front.
- 2026-06-28 — **Unificação places+bars (passos seguros) APLICADA EM PRODUÇÃO**. Migrations `006` (enriquece `establishments` com campos tipados de places+bars + `theme` JSONB; decisão: tipado + JSONB) e `007` (`establishment_modules` = serviços por casa, on/off). Seed por evidência: 5 casas operacionais com tudo; Sitio Ilha e Tio Jacques só cardápio. Validado em staging e prod; API 200. **Ainda intacto**: places/bars seguem existindo (compatibilidade); o código continua lendo as tabelas legadas. **Pendente p/ próxima sessão (staging + decisão):** Passo 4-5 — transformar places/bars em VIEWS sobre establishments e migrar as queries da API para o id canônico; depois aposentar as tabelas legadas.
- 2026-07-03 — **Fase 7 editor:** `establishmentConfigService`, `GET/PATCH /api/superadmin/establishments/:id/config`, página `/superadmin/organizations/[id]/establishments/[estId]` com form de profile/reservas/cardápio + preview merged.
- 2026-07-03 — **Fase 7 front rules:** `useEstablishmentRules` + `deriveEstablishmentRulesFlags` aplicados em reservas admin (`restaurant-reservations`, `ReservationModal`, `ReservationCalendar`, `WeeklyCalendar`, `WaitlistModal`, `AllocateTableModal`), check-ins (`eventos/[id]/check-ins`, `/admin/checkins`, tablet). Fallback por nome mantido quando API não retorna profile.
- 2026-07-03 — **Fase 7 ReservationForm + places/bars:** formulário público `/reservar` migrado para rules; API `establishmentLegacyAdapter` + migration 013 (views compat) + GET `/api/places` e `/api/bars` leem de `establishments` quando `ESTABLISHMENTS_READ_SOURCE=establishments`.
- 2026-07-03 — **RLS 017–019:** lote 4 (reservas, promoters, promoter_eventos/convidados); policies estritas sem `organization_id IS NULL`; Contract NOT NULL nas 13 tabelas RLS. checkins ignorado (tabela inexistente).
- 2026-07-03 — **Bloco C concluído:** migrations 022–023 (eventos, listas, listas_convidados, users RLS); backfill eventos/users; `requirePermission` eventos; enforce checkin/checkinsSelfValidate; total **25 tabelas RLS**.
- 2026-07-03 — **Bloco D (parcial):** `AdminPageGate` no layout admin (proteção por módulo/permissão via entitlements); `middleware.ts` sem `CARDAPIO_ONLY_EMAILS`, `SUPER_ADMIN_EMAILS` nem bypass rooftop por e-mail — superadmin só cookie `isSuperAdmin=1`; sidebar sempre `filterNavByEntitlements` com `NEXT_PUBLIC_SAAS_MODE=on`; novos utils `adminRouteModules`, `adminMiddlewareAccess`, `saasMode`.
- 2026-07-03 — **Bloco B (reservas):** `reservasPermissionMiddleware` em 10 rotas (restaurant-reservations, large, waitlist, walk-ins, blocks, settings, areas, guest-lists, birthday, reservas legado). Front: `isSuperAdminEmail` → cookie JWT (remove lista hardcoded).
- 2026-07-03 — **Equipe org-admin:** `/api/org/*` (memberships, roles, establishments) + `/admin/equipe`; `isAccountAdmin` em entitlements; migration 024 users constraint; smoke_test_saas.js; `<Gate>` em cardapio/users/promoters.
- 2026-07-03 — **Render estável + Bloco F:** fix `walkIns.js` (`wi.establishment_id`); POST `/api/users` com `organization_id` + RLS; smoke **24/24**; Flutter `PlaceService` filtra por `/api/me/entitlements` (`establishmentIds`); `organization_id` em GET `/api/places`.
- 2026-07-03 — **Fase 4 (parcial):** `useRequireSaasModule`; useSaasAccess em restaurant-reservations, checkins, eventos/dashboard, eventos/listas; Gate check-in + configurar eventos; adminNavModules rotas extras.
- 2026-07-03 — **Fase 4 (100% código):** `AdminSaasGuard` em 35+ páginas admin; Gate galeria/gifts/executive-events; `/reservar` + `filterPlacesByEntitlements`; `establishmentIds` no EntitlementsContext; removido SUPER_ADMIN_EMAILS reservas/galeria; checklist manual em `docs/FASE-4-CHECKLIST-UI.md`.

---

## Decisão estratégica
Refatoração evolutiva (**Strangler Fig**), **NÃO** reescrita. Introduzir a camada de
tenancy por baixo do que já existe e migrar módulo a módulo. O grupo atual (Highline,
Justino, Pracinha, Oh Fregues, Rooftop, Sítio Ilha) vira a primeira `organization` via
backfill. O sistema atual permanece em produção durante toda a migração.

## Diagnóstico-chave (gargalos — status jul/2026)

**Resolvidos ou mitigados**
- Middleware na raiz (`middleware.ts`) sem listas de e-mail hardcoded ✅
- JWT com `organization_id` + entitlements ✅
- RLS 25 tabelas + tenantMiddleware nos módulos core ✅
- `optionalAuth` + política anônima em reservas públicas ✅

**Ainda abertos**
- Modelo dual places/bars — convive com `establishments`; views pendentes (Fase 1)
- Hardcodes por ID/e-mail em API, Next e IA (Fase 7)
- ~30 rotas API sem tenantMiddleware (Fase 2)
- Promoters sem RBAC fino (Fase 3)
- Front admin parcialmente gated — ~30 páginas (Fase 4)
- Flutter: só places filtradas; cardápio/eventos/reservas expostos (Bloco F)
- Número WhatsApp por org pendente (decisão #5)

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
> **Próxima sessão:** Fase 4 → ver **FECHAMENTO FASE A FASE** e **BACKLOG P1**.
