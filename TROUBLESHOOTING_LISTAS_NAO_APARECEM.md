# 🔧 Troubleshooting: Listas de Convidados Não Aparecem

## 🎯 Problema
As listas de convidados não aparecem na página `admin/eventos/listas` mesmo depois de adicionar convidados.

---

## 📋 Checklist de Verificação

### 1. ✅ Verificar no Frontend (Browser)

1. Abra a página `/admin/eventos/listas`
2. Abra o Console do navegador (F12 → Console)
3. Selecione um evento no dropdown
4. Procure por logs como:
   ```
   📋 Listas carregadas: [...]
   ```

**O que verificar:**
- Se a requisição retorna `success: true`
- Se o array `listas` está vazio ou tem dados
- Se há algum erro de rede (Network tab)

### 2. 🔍 Verificar no Backend (Logs do Servidor)

Agora o backend tem logs detalhados. Quando você selecionar um evento, você verá:

```
🔍 [getListasEvento] Buscando listas para evento_id: 123
✅ [getListasEvento] Encontradas 2 listas
📋 [getListasEvento] Listas encontradas: [...]
🔍 [getListasEvento] Buscando convidados para lista_id: 456
✅ [getListasEvento] Lista 456: 5 convidados
🎉 [getListasEvento] Retornando dados completos
```

**Se você ver:**
- `Encontradas 0 listas` → O problema está no banco de dados
- Erros de SQL → Problema de schema/migração
- Nenhum log → A requisição não está chegando ao backend

### 3. 🗄️ Verificar no Banco de Dados

Execute o script de verificação:

```bash
cd vamos-comemorar-api/migrations
mysql -h SEU_HOST -u SEU_USUARIO -p SEU_BANCO < debug-listas-verificacao.sql
```

Ou conecte manualmente e execute as queries uma por uma.

---

## 🚨 Cenários Comuns e Soluções

### Cenário 1: "O evento não está habilitado para listas"

**Sintoma:** Nenhuma lista aparece, mas o evento existe.

**Solução:**
```sql
-- Habilitar evento para usar listas
UPDATE eventos 
SET usado_para_listas = TRUE 
WHERE id = SEU_EVENTO_ID;
```

### Cenário 2: "As listas existem mas o evento_id está errado"

**Sintoma:** Você criou listas, mas elas têm um `evento_id` diferente.

**Solução:**
```sql
-- Ver o evento_id das suas listas
SELECT lista_id, evento_id, nome FROM listas;

-- Se necessário, corrigir o evento_id
UPDATE listas 
SET evento_id = EVENTO_ID_CORRETO 
WHERE lista_id = SUA_LISTA_ID;
```

### Cenário 3: "A tabela listas não existe"

**Sintoma:** Erro SQL: "Table 'listas' doesn't exist"

**Solução:**
```bash
cd vamos-comemorar-api/migrations
mysql -h SEU_HOST -u SEU_USUARIO -p SEU_BANCO < eventos-listas-module-v2.sql
```

### Cenário 4: "Os promoters não estão vinculados ao evento"

**Sintoma:** Promoters existem mas não aparecem como opções.

**Solução:**
```sql
-- Vincular promoter ao evento
INSERT INTO promoter_eventos (promoter_id, evento_id, data_evento, status, funcao)
VALUES (
  SEU_PROMOTER_ID,
  SEU_EVENTO_ID,
  'YYYY-MM-DD',
  'ativo',
  'responsavel'
);
```

### Cenário 5: "A lista foi criada em outro sistema/tabela"

**Sintoma:** Os convidados aparecem na página do promoter mas não no admin.

**Problema:** Pode haver duas tabelas diferentes sendo usadas:
- `listas` (sistema novo)
- `promoter_convidados` (sistema antigo)

**Verificação:**
```sql
-- Ver onde estão os convidados
SELECT 
  'listas_convidados' as tabela, 
  COUNT(*) as total 
FROM listas_convidados
UNION ALL
SELECT 
  'promoter_convidados' as tabela, 
  COUNT(*) as total 
FROM promoter_convidados;
```

**Solução:** As listas DEVEM estar na tabela `listas` e os convidados em `listas_convidados` para aparecer no admin.

---

## 🛠️ Como Criar uma Lista Manualmente (Teste)

### Via SQL:

```sql
-- 1. Escolha um evento
SELECT id, nome_do_evento FROM eventos LIMIT 5;

-- 2. Escolha um promoter
SELECT promoter_id, nome FROM promoters WHERE ativo = TRUE LIMIT 5;

-- 3. Crie a lista
INSERT INTO listas (evento_id, promoter_responsavel_id, nome, tipo, observacoes)
VALUES (
  123,  -- <<< ID do evento
  456,  -- <<< ID do promoter
  'Lista de Teste - VIPs',
  'Promoter',
  'Lista criada para teste'
);

-- 4. Pegue o ID da lista criada
SET @lista_id = LAST_INSERT_ID();

-- 5. Adicione convidados
INSERT INTO listas_convidados (lista_id, nome_convidado, telefone_convidado, status_checkin, is_vip)
VALUES 
  (@lista_id, 'João Silva', '(11) 98765-4321', 'Pendente', FALSE),
  (@lista_id, 'Maria Santos VIP', '(11) 91234-5678', 'Pendente', TRUE),
  (@lista_id, 'Pedro Confirmado', '(11) 99876-5432', 'Check-in', FALSE);

-- 6. Verifique
SELECT 
  l.nome as lista,
  COUNT(lc.lista_convidado_id) as total_convidados
FROM listas l
LEFT JOIN listas_convidados lc ON l.lista_id = lc.lista_id
WHERE l.lista_id = @lista_id
GROUP BY l.lista_id;
```

### Via API (Postman/Insomnia):

```http
POST /api/v1/eventos/listas
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "evento_id": 123,
  "promoter_responsavel_id": 456,
  "nome": "Lista de Teste - VIPs",
  "tipo": "Promoter",
  "observacoes": "Lista criada via API"
}
```

Depois adicione convidados:

```http
POST /api/v1/eventos/listas/:listaId/convidado
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "nome_convidado": "João Silva",
  "telefone_convidado": "(11) 98765-4321",
  "email_convidado": "joao@email.com",
  "is_vip": false,
  "observacoes": "Convidado teste"
}
```

---

## 🔍 Verificação Final

Depois de fazer as correções, verifique:

1. **No Backend:**
   ```bash
   # Ver logs do servidor
   # Procure por: [getListasEvento]
   ```

2. **No Frontend:**
   - Recarregue a página `/admin/eventos/listas`
   - Selecione o evento
   - Abra o console (F12)
   - Deve aparecer: `📋 Listas carregadas: [...]`

3. **Teste o Check-in:**
   - Clique em "Ver Convidados"
   - Tente fazer check-in de um convidado
   - Verifique se o status muda

---

## 📞 Ainda Não Funciona?

Se após todas essas verificações ainda não funcionar, colete as seguintes informações:

1. **Logs do Backend** quando você seleciona o evento
2. **Response da API** no Network tab do navegador
3. **Query result** do script de verificação SQL:
   ```sql
   SELECT * FROM listas WHERE evento_id = SEU_EVENTO_ID;
   SELECT * FROM listas_convidados;
   ```
4. **Screenshot** da página admin/eventos/listas
5. **Screenshot** da página do promoter mostrando os convidados

---

## 💡 Prevenção

Para evitar esse problema no futuro:

### 1. Sempre use a API oficial para criar listas:
- Endpoint: `POST /api/v1/eventos/listas`
- Não crie listas manualmente no banco (exceto para teste)

### 2. Verifique se o evento está habilitado:
```sql
SELECT id, nome_do_evento, usado_para_listas 
FROM eventos 
WHERE usado_para_listas = TRUE;
```

### 3. Monitore os logs do backend:
- Os logs agora mostram exatamente o que está acontecendo
- Use `console.log` no frontend também

---

## 📚 Arquivos Relacionados

- Backend: `vamos-comemorar-api/controllers/EventosController.js`
- Frontend: `vamos-comemorar-next/app/admin/eventos/listas/page.tsx`
- Migrations: `vamos-comemorar-api/migrations/eventos-listas-module-v2.sql`
- Debug SQL: `vamos-comemorar-api/migrations/debug-listas-verificacao.sql`

---

**Data de Criação:** Outubro 2025  
**Status:** ✅ Ativo e Atualizado



