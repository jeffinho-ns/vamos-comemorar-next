# Fase 4 — Checklist manual UI

Execute com `NEXT_PUBLIC_SAAS_MODE=on` no front e `SAAS_MODE=on` na API (Render).

## Credenciais de teste

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Superadmin | `jeffinho_ns@hotmail.com` | `1234` |
| Org B (admin) | `demo-b-admin@agilizaiapp.test` | `DemoB@123Mudar!` |
| Recepção | `analista.mkt02@ideiaum.com.br` | `@123Mudar` |
| Gerente | `analista@pracinha.com` | `@123Mudar` |

## Checklist browser

- [ ] **Org B — `/reservar`**: login demo B → lista mostra só **Bar Demo B** (não Highline/Justino)
- [ ] **Org B — `/admin/cardapio`**: abre cardápio da casa demo B
- [ ] **Sidebar recepção vs gerente**: recepção não vê links de escrita (equipe, configurar eventos); gerente vê mais itens
- [ ] **Isolamento org A vs B**: conta demo B não vê dados de outra org no browser (reservas, eventos, cardápio)
- [ ] **Galeria**: usuário sem `cardapio:update` não vê botões de upload
- [ ] **Gifts**: usuário sem `reservas:update` não vê “Nova Regra”

## Flutter (Bloco F — release manual)

```bash
cd agilizaiapp
git pull   # commit 90b66ed+
flutter pub get
flutter run   # ou build release
```

- [ ] Login demo B → app lista **só Bar Demo B**

## Smoke automatizado (API)

```bash
cd vamos-comemorar-api
node scripts/saas/smoke_diagnostic_full.js
```

Esperado: **24/24** passes.
