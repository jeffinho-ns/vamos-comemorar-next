# Handoff de continuidade — 6 nov 2026

Cópia espelhada do handoff operacional. A versão canônica também está em:

`vamos-comemorar-api/docs/HANDOFF-CONTINUIDADE.md`

---

## 1. WhatsApp / Meta — Provedor de Tecnologia (ativo agora)

### Decisão de produto
- Objetivo: cada casa com o próprio número WhatsApp, IA respondendo por esse número, **modo espelho** (WhatsApp Business no celular + Cloud API no mesmo número).
- **Não** usar “Adicionar número” da API pura: isso tira o app do celular e apaga o histórico. Serviço 24/7; usuário rejeitou.
- Até o espelho existir, staff e IA podem responder no mesmo chat (aceito).
- Número **central** `11 91109-1838` (phone_number_id `1072961792566436`) fica como número geral da API. Display name Meta: Central Agilizaiapp. **Não** cadastrar esse número como linha de uma casa.
- Números das casas (ainda não conectados no modo espelho):
  - Seu Justino `11 5200-3650`
  - Pracinha `11 2305-0938`
  - Highline `11 3032-2934`
  - Reserva Rooftop e Reserva Pinheiros compartilham `11 4280-3345` (um Meta number → uma casa só no cadastro)

### Onde o usuário está no Meta
1. **Verificação da empresa**: concluída (Central de Segurança mostra JEFFERSON TEIXEIRA DE LIMA como Verificada). Caso de uso: “O app exige acesso e permissões no Meta for Developers” — manter.
2. Tela **Torne-se um Provedor de Tecnologia**: etapa 1 pode ainda parecer “Em análise” por atraso de UI; na Central de Segurança já está Verificada.
3. **Análise do app**: usuário chegou no formulário (`Não enviado` → `Avançar` → checklist).
   - Verificação e Configurações do app: ok.
   - Faltam: Uso permitido, Tratamento de dados, Instruções da análise.
4. Vídeos obrigatórios (dois, separados):
   - `whatsapp_business_messaging`: Agilizaiapp enviando mensagem + WhatsApp (celular/web) recebendo.
   - `whatsapp_business_management`: criação de template de mensagem.
5. Onde anexar: **não** é “Mostrar instruções”. É no formulário de cada permissão (campo Arraste/Carregar arquivo), acessível via **Editar análise do app** → **Avançar** → formulários. Cuidado: formulário de `business_management` (Business Manager) ≠ `whatsapp_business_messaging`.
6. Avisos vermelhos da Central de Segurança (domínio, passkey, 2FA) **não** bloqueiam WhatsApp.

### Bloqueio atual para gravar o vídeo de envio
- No Atendimento (`/admin/whatsapp?tab=atendimento`), conversa “Jefferson” (`5511943583697`) está **fora da janela de 24h** da Meta. Texto livre pelo painel é recusado até o cliente mandar mensagem recente.
- Teste: outro telefone → `11 91109-1838`. Webhook no Meta está com URL `https://api.agilizaiapp.com.br/api/webhooks/whatsapp` e campo **messages** habilitado.
- Diagnóstico de produção (6 nov ~16h–21h BRT):
  - Endpoint do webhook responde (GET sem challenge → 403 = rota viva).
  - Último receipt inbound registrado em produção: **2026-11-04**. O teste de hoje **não** chegou no servidor.
  - Conclusão: Meta não está entregando o inbound ao servidor neste momento (ou o número “De” na Configuração da API não é o central). Não é só a faixa vermelha da janela 24h.
- Próximo check manual no Meta:
  - Na Configuração da API, número “De” tem que ser **+55 11 91109-1838**, não número de teste +1 555.
  - No celular do teste: 1 check = não entregou à empresa; 2 checks = chegou no app do celular e não na API.
- Depois que inbound voltar: mandar “oi” do número de teste → conversa nova no inbox (não reutilizar Jefferson antigo) → responder pelo painel → gravar vídeo → anexar em `whatsapp_business_messaging`.
- Depois da aprovação Advanced Access: Embedded Signup / espelho. Piloto sugerido: Pracinha. Central intocada.

### Código WhatsApp já em produção
- API: `whatsapp_phone_lines`, webhook com `phone_number_id`, escopo `waba:{phoneNumberId}:{customer}`.
- Next: aba “WhatsApp linha” em Configurações de IA.
- Isso **não** é o modo espelho; é API-only por número.

---

## 2. Sítio Ilha — cardápio (feito)

- Org **9**, establishment **17**, place **18**, bar **15**. Duplicata Grupo Ideia (est. 6 / place 10) arquivada.
- Visibilidade cardápio corrigida e publicada (Next `45dce0a0`, API `1b71e11`).
- PDF “Drinks e petiscos da noite final”: faltantes inseridos em produção (petiscos 3064–3070; drinks Especiais da Casa + Tradicionais 3071–3079). Já existiam Isca, Contra Filé, Frango, Fritas — não duplicados. Sem fotos ainda.

---

## 3. O que NÃO fazer
- Não desconectar WhatsApp Business do celular das casas.
- Não registrar o central `11 91109-1838` como linha de estabelecimento.
- Não commitar `scripts/extrair-bi-justino.js`, `tsc-bi.txt`, `_tmp_*`, `.env`.
- Modelo IA produção: `gpt-5.5`. Agente: caminho `services/agent/*` na API.

---

## 4. Próximos passos
1. Destravar inbound do central `11 91109-1838`.
2. Gravar/anexar 2 vídeos e enviar Análise do App.
3. Aguardar Advanced Access → Embedded Signup (piloto Pracinha).
4. Fotos dos itens novos do Sítio Ilha, se pedido.
5. Working tree local pode ter mudanças de BI menu access não relacionadas — não misturar com este handoff.

---

## 5. Referências
- Webhook: `https://api.agilizaiapp.com.br/api/webhooks/whatsapp`
- Tech Provider: https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers/
- Sample App Review: https://developers.facebook.com/docs/whatsapp/solution-providers/app-review/sample-submission/
