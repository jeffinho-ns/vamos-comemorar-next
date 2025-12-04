# Debug - Erro 500 na API

## Problema Identificado

A API externa (`https://vamos-comemorar-api.onrender.com`) está retornando erro 500 ao tentar criar uma OS.

## Possíveis Causas

1. **Validação de Data Duplicada**: A API verifica se já existe um detalhe para a data (linha 121-131), mas isso retornaria 400, não 500.

2. **Query SQL Falhando**: A query pode estar falhando por:
   - Campo não existe na tabela
   - Tipo de dado incorreto
   - Problema de conexão com PostgreSQL

3. **Campos em Formato Incorreto**: Algum campo pode estar sendo enviado em formato incorreto.

## Como Verificar o Erro Real

### 1. Verificar Logs da API no Render

1. Acesse o dashboard do Render: https://dashboard.render.com
2. Vá para o serviço da API (`vamos-comemorar-api`)
3. Clique em "Logs"
4. Procure por erros recentes quando tentar criar uma OS
5. O erro real deve aparecer nos logs (ex: erro de SQL, campo não encontrado, etc.)

### 2. Verificar Estrutura da Tabela no PostgreSQL

Execute no banco PostgreSQL:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'operational_details';

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'operational_details'
ORDER BY ordinal_position;

-- Verificar se os campos os_type e os_number existem
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'operational_details' 
  AND column_name IN ('os_type', 'os_number');
```

### 3. Testar Diretamente no Banco

```sql
-- Tentar inserir manualmente para ver o erro
INSERT INTO operational_details (
  os_type, os_number, event_id, establishment_id, event_date, artistic_attraction,
  show_schedule, ticket_prices, promotions, visual_reference_url,
  admin_notes, operational_instructions, is_active
) VALUES (
  'artist', 'TEST-001', NULL, NULL, '2025-12-04', 'Teste',
  NULL, 'R$ 50', NULL, NULL, NULL, NULL, 1
);
```

## Correções Aplicadas no Código

1. ✅ Limpeza de dados antes de enviar
2. ✅ Conversão correta de tipos (números, booleanos)
3. ✅ Remoção de campos undefined
4. ✅ Logs detalhados para debug
5. ✅ Tratamento de erros melhorado

## Próximos Passos

1. **Verificar logs da API no Render** para ver o erro real
2. **Verificar estrutura da tabela** no PostgreSQL
3. **Testar inserção manual** no banco para identificar o problema
4. **Ajustar código** baseado no erro real encontrado

## Dados Sendo Enviados

O código agora envia apenas os campos que a API espera:
- Campos básicos: os_type, os_number, event_id, establishment_id, event_date, artistic_attraction, etc.
- Campos de Artista: contractor_name, artist_artistic_name, etc. (todos null se não fornecidos)
- Campos de Bar/Fornecedor: provider_name, etc. (todos null se não fornecidos)

Todos os campos opcionais são enviados como `null` se não fornecidos, conforme esperado pela API.

