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
| Última atualização | 2026-06-03 |
| Modo atual | Planejamento aprovado — ainda NÃO foi escrito código |
| Fase em andamento | Nenhuma (aguardando início da Fase 0) |
| Próximo passo | Iniciar **Fase 0** (fundação/segurança) após aprovação |
| Pendências/decisões | Billing definido: receita do SaaS, cobrança manual primeiro (gateway depois) |

### Como retomar no outro PC
1. `git pull` nos dois repositórios (`vamos-comemorar-next` e `vamos-comemorar-api`).
2. Leia esta seção de status para saber a fase atual e o próximo passo.
3. Consulte o checklist abaixo para ver o que já foi concluído.

### Checklist de fases
- [ ] **Fase 0** — Fundação / segurança (middleware na raiz em modo observação, auth nas rotas públicas, remover credenciais hardcoded)
- [ ] **Camada de segurança** (transversal — aplicar em todas as fases)
- [ ] **Fase 1** — Banco / tenant model (tabelas novas + backfill org piloto)
- [ ] **Fase 2** — Isolamento (JWT com tenant, tenantMiddleware, RLS)
- [ ] **Fase 3** — RBAC + entitlements
- [ ] **Fase 4** — Front modular (EntitlementsContext, sidebar data-driven, quebrar monolitos)
- [ ] **Fase 5** — Faturamento SaaS (invoices/payments, MRR, PaymentProvider)
- [ ] **Fase 6** — Painel Super Admin + onboarding em poucos cliques
- [ ] **Fase 7** — Desacoplar IA / hardcodes residuais

### Log de progresso (adicionar 1 linha por sessão)
- 2026-06-03 — Diagnóstico (raio-X) concluído e plano aprovado. Documento versionado para sincronizar entre os dois PCs.

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
