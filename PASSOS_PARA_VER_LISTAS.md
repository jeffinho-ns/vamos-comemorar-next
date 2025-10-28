# 🎯 Passos Rápidos para Ver as Listas

## Problema
Você adicionou convidados para uma lista de promoter, mas ela não aparece em `admin/eventos/listas`.

---

## ✅ Solução Rápida (3 Passos)

### Passo 1: Execute o Script de Verificação no Banco

```bash
cd vamos-comemorar-api/migrations
mysql -h SEU_HOST -u SEU_USUARIO -p u621081794_vamos < debug-listas-verificacao.sql
```

Ou conecte ao banco e execute manualmente:

```sql
-- Ver todos os eventos
SELECT id, nome_do_evento, usado_para_listas FROM eventos LIMIT 10;

-- Ver todas as listas existentes
SELECT 
  l.lista_id,
  l.evento_id,
  l.nome as nome_lista,
  p.nome as promoter_nome,
  e.nome_do_evento
FROM listas l
LEFT JOIN promoters p ON l.promoter_responsavel_id = p.promoter_id
LEFT JOIN eventos e ON l.evento_id = e.id;
```

**O que verificar:**
- ✅ Se há listas cadastradas
- ✅ Se o `evento_id` da lista corresponde ao evento que você está selecionando
- ✅ Se o evento tem `usado_para_listas = TRUE`

---

### Passo 2: Verifique os Logs do Backend

1. Reinicie o servidor da API (se necessário)
2. Acesse `/admin/eventos/listas` no navegador
3. Selecione um evento
4. Olhe nos logs do servidor da API

**Você deve ver algo como:**
```
🔍 [getListasEvento] Buscando listas para evento_id: 123
✅ [getListasEvento] Encontradas 2 listas
📋 [getListasEvento] Listas encontradas: [...]
```

**Se ver "Encontradas 0 listas":**
- As listas não existem no banco para esse evento_id
- Ou o evento_id está errado

---

### Passo 3: Crie uma Lista de Teste

Se não houver listas, crie uma manualmente para testar:

```sql
-- 1. Pegue IDs válidos
SELECT id FROM eventos LIMIT 1;  -- Exemplo: retorna 123
SELECT promoter_id FROM promoters WHERE ativo = TRUE LIMIT 1;  -- Exemplo: retorna 456

-- 2. Crie a lista
INSERT INTO listas (evento_id, promoter_responsavel_id, nome, tipo)
VALUES (123, 456, 'Lista Teste - VIPs', 'Promoter');

-- 3. Pegue o ID da lista
SET @lista_id = LAST_INSERT_ID();

-- 4. Adicione convidados
INSERT INTO listas_convidados (lista_id, nome_convidado, telefone_convidado, status_checkin)
VALUES 
  (@lista_id, 'João Teste', '(11) 98765-4321', 'Pendente'),
  (@lista_id, 'Maria Teste', '(11) 91234-5678', 'Check-in');

-- 5. Verifique
SELECT * FROM listas WHERE lista_id = @lista_id;
SELECT * FROM listas_convidados WHERE lista_id = @lista_id;
```

---

## 🔍 Como Verificar se Funcionou

1. **No navegador:**
   - Vá em `/admin/eventos/listas`
   - Selecione o evento (ID 123 do exemplo acima)
   - Deve aparecer a lista "Lista Teste - VIPs"
   - Clique em "Ver Convidados"
   - Devem aparecer João Teste e Maria Teste

2. **No console do navegador (F12):**
   ```
   📋 Listas carregadas: [{nome: "Lista Teste - VIPs", ...}]
   ```

3. **Nos logs do backend:**
   ```
   ✅ [getListasEvento] Encontradas 1 listas
   📋 [getListasEvento] Listas encontradas: [{lista_id: 789, nome: "Lista Teste - VIPs", ...}]
   ```

---

## ❓ Perguntas Frequentes

### "Onde o promoter cria a lista?"

O promoter pode criar listas através de:
1. **Página pública do promoter** (`/promoter/:codigo`)
2. **API direta** (`POST /api/v1/eventos/listas`)
3. **Dashboard do admin** (criando em nome do promoter)

### "Por que aparecem na página do promoter mas não no admin?"

Provavelmente estão sendo salvas em tabelas diferentes:
- **Sistema Novo** (correto): tabela `listas` + `listas_convidados`
- **Sistema Antigo**: tabela `promoter_convidados`

O admin só mostra do sistema novo.

### "Como migrar do sistema antigo para o novo?"

```sql
-- Ver se há convidados no sistema antigo
SELECT COUNT(*) FROM promoter_convidados;

-- Se houver, será necessário criar uma migração específica
-- (entre em contato para script de migração)
```

### "O evento não aparece no dropdown"

Verifique se o evento existe e está habilitado:

```sql
SELECT id, nome_do_evento, usado_para_listas 
FROM eventos 
WHERE id = SEU_EVENTO_ID;

-- Se usado_para_listas = FALSE, habilite:
UPDATE eventos SET usado_para_listas = TRUE WHERE id = SEU_EVENTO_ID;
```

---

## 🎯 Checklist Final

Antes de dizer que não funciona, verifique:

- [ ] As tabelas `listas` e `listas_convidados` existem no banco
- [ ] Há pelo menos uma lista com o `evento_id` correto
- [ ] O evento tem `usado_para_listas = TRUE`
- [ ] O backend está retornando os dados (veja os logs)
- [ ] O frontend está fazendo a requisição correta (veja Network tab)
- [ ] Não há erros no console do navegador
- [ ] O token de autenticação é válido

---

## 📞 Ainda com Problema?

Execute e me envie o resultado de:

```sql
-- Query 1: Ver o evento
SELECT * FROM eventos WHERE id = SEU_EVENTO_ID;

-- Query 2: Ver listas desse evento
SELECT * FROM listas WHERE evento_id = SEU_EVENTO_ID;

-- Query 3: Ver convidados
SELECT lc.* 
FROM listas_convidados lc
JOIN listas l ON lc.lista_id = l.lista_id
WHERE l.evento_id = SEU_EVENTO_ID;
```

E também:
- Screenshot da página `/admin/eventos/listas`
- Logs do backend ao selecionar o evento
- Response da API no Network tab

---

**Feito!** 🎉

Se seguiu todos os passos e a lista de teste apareceu, então o sistema está funcionando. O problema original era que não havia listas criadas para aquele evento específico.




