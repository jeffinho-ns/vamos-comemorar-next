# 🎯 Implementação: Ocultar Itens do Cardápio

## ✅ O QUE FOI FEITO

### 1. Migration SQL (Backend)
✅ **Arquivo:** `vamos-comemorar-api/migrations/add_visible_field_to_menu_items.sql`

- Adiciona campo `visible` (TINYINT) na tabela `menu_items`
- Valor padrão: 1 (visível)
- Índice criado para performance
- Todos os itens existentes marcados como visíveis

### 2. API atualizada (Backend)
✅ **Arquivo:** `vamos-comemorar-api/routes/cardapio.js`

**Novo endpoint:**
```
PATCH /api/cardapio/items/:id/visibility
Body: { "visible": true/false }
```

**Modificações:**
- Endpoint de listagem (`GET /items`) agora retorna o campo `visible`
- Endpoint de delete mantido para exclusão permanente
- Adicionado `COALESCE(mi.visible, 1)` nas queries para compatibilidade

### 3. Frontend atualizado
✅ **Arquivo:** `vamos-comemorar-next/app/admin/cardapio/page.tsx`

- Interface `MenuItem` atualizada com campo `visible`

---

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Executar Migration no MySQL

```bash
# Conectar ao MySQL
mysql -u seu_usuario -p seu_banco_de_dados

# Executar o script
SOURCE vamos-comemorar-api/migrations/add_visible_field_to_menu_items.sql;
```

Ou copie e cole o conteúdo do arquivo no MySQL Workbench/PhpMyAdmin.

---

### Passo 2: Reiniciar o Backend

```bash
cd vamos-comemorar-api
# Parar o servidor (Ctrl+C)
npm start
```

Ou se estiver no Render, faça deploy manual.

---

### Passo 3: Adicionar UI no Frontend

Precisamos adicionar:

1. **Botão de "Ocultar/Mostrar"** nos cards de itens
2. **Indicador visual** quando o item está oculto
3. **Filtro** para ver todos/apenas visíveis/apenas ocultos
4. **Função** para chamar a API

---

## 📋 CÓDIGO DO FRONTEND (PARA ADICIONAR)

### 1. Função para alternar visibilidade

Adicionar no componente `CardapioAdminPage`:

```typescript
const handleToggleVisibility = async (itemId: string | number, currentlyVisible: boolean) => {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !currentlyVisible })
    });
    
    if (!response.ok) throw new Error('Erro ao alternar visibilidade');
    
    const data = await response.json();
    
    // Atualizar estado local
    setMenuData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, visible: data.item.visible ? 1 : 0 }
          : item
      )
    }));
    
    alert(data.message);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao alterar visibilidade do item');
  }
};
```

### 2. Botão no card do item

Adicionar nos botões de ação do item (próximo ao botão de deletar):

```tsx
{/* Botão de Ocultar/Mostrar */}
<button
  onClick={() => handleToggleVisibility(item.id, item.visible === 1 || item.visible === true)}
  className={`px-3 py-1 rounded text-white transition-colors ${
    item.visible === 0 || item.visible === false
      ? 'bg-green-500 hover:bg-green-600'
      : 'bg-yellow-500 hover:bg-yellow-600'
  }`}
  title={item.visible === 0 || item.visible === false ? 'Mostrar item' : 'Ocultar item'}
>
  {item.visible === 0 || item.visible === false ? '👁️ Mostrar' : '🙈 Ocultar'}
</button>
```

### 3. Indicador visual quando oculto

Adicionar no card do item:

```tsx
{/* Badge de Status */}
{(item.visible === 0 || item.visible === false) && (
  <div className="absolute top-2 right-2">
    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
      OCULTO
    </span>
  </div>
)}

{/* Overlay semi-transparente quando oculto */}
{(item.visible === 0 || item.visible === false) && (
  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold">🙈 Oculto do Cardápio</span>
  </div>
)}
```

### 4. Filtro de visibilidade

Adicionar state para filtro:

```typescript
const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
```

Adicionar filtro nos controles:

```tsx
<div className="flex gap-2">
  <button
    onClick={() => setVisibilityFilter('all')}
    className={`px-4 py-2 rounded ${visibilityFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
  >
    Todos
  </button>
  <button
    onClick={() => setVisibilityFilter('visible')}
    className={`px-4 py-2 rounded ${visibilityFilter === 'visible' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
  >
    Visíveis
  </button>
  <button
    onClick={() => setVisibilityFilter('hidden')}
    className={`px-4 py-2 rounded ${visibilityFilter === 'hidden' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
  >
    Ocultos
  </button>
</div>
```

Aplicar filtro nos itens:

```typescript
const filteredItems = menuData.items.filter(item => {
  // Filtro de busca existente
  const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Filtro de visibilidade
  const matchesVisibility = 
    visibilityFilter === 'all' ? true :
    visibilityFilter === 'visible' ? (item.visible === 1 || item.visible === true) :
    (item.visible === 0 || item.visible === false);
  
  return matchesSearch && matchesVisibility;
});
```

---

## 🎯 RESULTADO ESPERADO

### Antes (comportamento antigo):
```
Item fora de estoque → Precisa DELETAR do banco → ❌ Perde o registro
```

### Depois (novo comportamento):
```
Item fora de estoque → Clica em "Ocultar" → ✅ Fica no banco, mas oculto
                     ↓
                  Quando volta ao estoque → Clica em "Mostrar" → ✅ Volta a aparecer
```

---

## 📊 FUNCIONALIDADES

| Ação | Como Fazer | Resultado |
|------|-----------|-----------|
| **Ocultar item** | Clicar em "🙈 Ocultar" | Item fica oculto no cardápio público, mas aparece no admin com badge "OCULTO" |
| **Mostrar item** | Clicar em "👁️ Mostrar" | Item volta a aparecer normalmente |
| **Deletar item** | Clicar em "🗑️ Deletar" | Item é REMOVIDO PERMANENTEMENTE do banco |
| **Filtrar ocultos** | Clicar em "Ocultos" no filtro | Mostra apenas itens ocultos |
| **Filtrar visíveis** | Clicar em "Visíveis" no filtro | Mostra apenas itens visíveis |

---

## 🔍 TESTES

### 1. Testar Ocultar
1. Acesse `/admin/cardapio`
2. Escolha um item
3. Clique em "Ocultar"
4. **Verifique:**
   - Badge "OCULTO" aparece
   - Item fica semi-transparente ou com overlay
   - Botão muda para "Mostrar"

### 2. Testar Mostrar
1. Clique em "Mostrar" num item oculto
2. **Verifique:**
   - Badge "OCULTO" desaparece
   - Item volta ao normal
   - Botão muda para "Ocultar"

### 3. Testar Filtros
1. Clique em "Ocultos"
2. **Verifique:** Apenas itens ocultos aparecem
3. Clique em "Visíveis"
4. **Verifique:** Apenas itens visíveis aparecem

### 4. Testar no Cardápio Público
1. Oculte um item no admin
2. Acesse o cardápio público (app para clientes)
3. **Verifique:** Item NÃO aparece
4. Mostre o item novamente no admin
5. **Verifique:** Item APARECE no cardápio público

---

## ⚠️ IMPORTANTE

- **Ocultar ≠ Deletar:** Itens ocultos ainda existem no banco
- **Admin vê tudo:** No admin, itens ocultos aparecem com indicação
- **Clientes não veem:** No cardápio público, itens ocultos são filtrados
- **Reversível:** Você pode mostrar/ocultar quantas vezes quiser
- **Delete permanente:** O botão "Deletar" continua funcionando para remover definitivamente

---

## 🛠️ API ENDPOINTS

### Alternar Visibilidade
```http
PATCH /api/cardapio/items/:id/visibility
Content-Type: application/json

{
  "visible": false  // ou true
}
```

**Resposta:**
```json
{
  "message": "Item ocultado com sucesso.",
  "item": {
    "id": 123,
    "name": "Pizza Margherita",
    "visible": false,
    "status": "oculto"
  }
}
```

### Deletar Permanentemente
```http
DELETE /api/cardapio/items/:id
```

---

## 🎨 ESTILO VISUAL SUGERIDO

### Item Visível (Normal)
```
┌────────────────────┐
│  Pizza Margherita  │
│  R$ 45,00          │
│  [Editar] [Ocultar│
│            ] [🗑️]  │
└────────────────────┘
```

### Item Oculto
```
┌────────────────────┐
│ [OCULTO]           │
│  Pizza Margherita  │ (semi-transparente)
│  R$ 45,00          │
│  [Editar] [Mostrar]│
│           [🗑️]     │
└────────────────────┘
```

---

## 📝 CHECKLIST FINAL

- [ ] Migration SQL executada
- [ ] Backend reiniciado
- [ ] Função `handleToggleVisibility` adicionada
- [ ] Botão "Ocultar/Mostrar" adicionado
- [ ] Badge "OCULTO" adicionado
- [ ] Filtros de visibilidade adicionados
- [ ] Overlay visual em itens ocultos
- [ ] Testado: Ocultar item
- [ ] Testado: Mostrar item
- [ ] Testado: Filtros funcionando
- [ ] Testado: Item oculto não aparece no cardápio público

---

**Status:** 🟡 Parcialmente Implementado (Backend pronto, falta UI do Frontend)  
**Próximo Passo:** Adicionar UI no frontend conforme código acima  
**Tempo Estimado:** ~30 minutos






