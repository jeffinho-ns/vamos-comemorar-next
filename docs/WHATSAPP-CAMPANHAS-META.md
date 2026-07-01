# Campanhas WhatsApp — formato e-mail marketing + template Meta

## O que você monta no painel (`/admin/whatsapp` → Campanhas)

| Campo | Função |
|-------|--------|
| **Nome** | Identificação interna (não vai para o cliente) |
| **Título** | Assunto / headline (topo da mensagem) |
| **Imagem hero** | Banner principal (upload → Cloudinary) |
| **Texto** | Corpo da mensagem |
| **Modo de envio** | Automático / só 24h / só template |
| **Template Meta** | Nome do template aprovado (opcional; default `agilizai_campanha_marketing`) |

## Precisa de template na Meta?

| Público | Template? |
|---------|-----------|
| Cliente que **falou nas últimas 24h** | **Não** — enviamos imagem + texto livre |
| Base **importada** ou sem conversa recente | **Sim** — obrigatório |
| Disparo em **massa** (maioria da base) | **Sim** — obrigatório |

**Modo automático (recomendado):** tenta imagem+texto na janela 24h; fora dela usa o template Meta.

## Criar o template no WhatsApp Manager (1x)

1. [Meta Business Suite](https://business.facebook.com) → **WhatsApp Manager** → **Message templates** → **Create**
2. Configuração sugerida:

| Item | Valor |
|------|--------|
| **Nome** | `agilizai_campanha_marketing` |
| **Categoria** | Marketing |
| **Idioma** | Portuguese (BR) |
| **Header** | Image — *Dynamic* |
| **Body** | `{{1}}` + quebra de linha + `{{2}}` |

Exemplo de corpo no template:

```
{{1}}

{{2}}
```

- `{{1}}` = título da campanha (painel)
- `{{2}}` = texto principal (painel)

3. Aguardar **aprovação** da Meta (geralmente horas a 1–2 dias).
4. No Render (API), opcional: `WHATSAPP_CAMPAIGN_TEMPLATE_NAME=agilizai_campanha_marketing`

## Importar base de contatos (CRM)

CSV com colunas:

```csv
wa_id,contact_name,marketing_opt_in,tags
5511999999999,Maria,true,vip
5511888888888,João,true,planilha-evento
```

- Marque **opt-in na importação** para bases com consentimento.
- Contatos importados **sem conversa** só recebem campanha via **template Meta**.

## Fluxo para apresentação aos sócios

1. Criar campanha com título + imagem + texto + prévia no painel.
2. **Prévia público** → confirmar quantidade.
3. Teste em 1 contato ativo (janela 24h) — modo automático.
4. Criar fila → **Próximo chunk** para lote.
5. Para escala total: template Meta aprovado + modo automático ou template.
