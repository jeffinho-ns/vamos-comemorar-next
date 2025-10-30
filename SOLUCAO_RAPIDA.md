# ⚡ Solução Rápida - Execute Isso Agora

## 🎯 Problema
Convidados não aparecem em `/admin/eventos/listas?evento_id=27`

## ✅ Solução em 1 Comando

```bash
cd vamos-comemorar-api/migrations
mysql -h 193.203.175.55 -u u621081794_vamos -p u621081794_vamos < migrar-promoter-convidados-para-listas.sql
```

Digite a senha do banco quando solicitado.

## 🔍 O Que Vai Acontecer

O script vai:
1. Criar uma lista para Jefferson Lima no evento 27
2. Migrar os 2 convidados para a lista
3. Mostrar estatísticas

## ✅ Como Verificar

Após executar:
1. Acesse: `/admin/eventos/listas?evento_id=27`
2. Deve aparecer: **Lista de Jefferson Lima - Xeque Mate**
3. Clique em "Ver Convidados"
4. Deve mostrar: Jefferson Lima e Suellem Nunes

## ❓ Por Quê?

Os convidados estavam na tabela `promoter_convidados` (sistema antigo).  
O admin busca na tabela `listas` (sistema novo).  
O script migra de um para o outro.

---

**Pronto!** Execute o comando acima e as listas aparecerão imediatamente. 🚀






