# 💻 CÓDIGO COMPLETO - Frontend para Ocultar/Mostrar Itens

## 📍 Onde adicionar o código

**Arquivo:** `vamos-comemorar-next/app/admin/cardapio/page.tsx`

---

## 1️⃣ ADICIONAR STATE PARA FILTRO

Procure onde estão os outros `useState` (por volta da linha 214-217) e adicione:

```typescript
const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
```

---

## 2️⃣ ADICIONAR FUNÇÃO PARA ALTERNAR VISIBILIDADE

Adicione esta função junto com as outras funções do componente (por volta da linha 400-500):

```typescript
// Função para alternar visibilidade de um item (ocultar/mostrar)
const handleToggleVisibility = async (itemId: string | number, currentlyVisible: boolean | number) => {
  const isVisible = currentlyVisible === 1 || currentlyVisible === true;
  
  // Confirmação
  const confirmed = confirm(
    isVisible 
      ? 'Deseja ocultar este item do cardápio? Ele continuará no banco de dados e poderá ser exibido novamente.'
      : 'Deseja tornar este item visível no cardápio?'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !isVisible })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao alternar visibilidade');
    }
    
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
    
    alert(data.message || 'Visibilidade alterada com sucesso!');
  } catch (error) {
    console.error('Erro ao alternar visibilidade:', error);
    alert(error instanceof Error ? error.message : 'Erro ao alternar visibilidade do item');
  }
};
```

---

## 3️⃣ ADICIONAR FILTROS VISUAIS

Procure onde estão os filtros/controles da página (provavelmente junto com o campo de busca) e adicione:

```tsx
{/* Filtro de Visibilidade */}
<div className="flex gap-2 items-center">
  <span className="text-sm font-medium text-gray-700">Exibir:</span>
  <button
    onClick={() => setVisibilityFilter('all')}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      visibilityFilter === 'all' 
        ? 'bg-blue-500 text-white shadow-md' 
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    Todos
  </button>
  <button
    onClick={() => setVisibilityFilter('visible')}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      visibilityFilter === 'visible' 
        ? 'bg-green-500 text-white shadow-md' 
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    👁️ Visíveis
  </button>
  <button
    onClick={() => setVisibilityFilter('hidden')}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      visibilityFilter === 'hidden' 
        ? 'bg-red-500 text-white shadow-md' 
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
  >
    🙈 Ocultos
  </button>
</div>
```

---

## 4️⃣ APLICAR FILTRO NOS ITENS

Procure onde os itens são filtrados (provavelmente tem um `filter` com `searchTerm`).

**Substitua** o filtro existente por:

```typescript
const filteredItems = menuData.items.filter(item => {
  // Filtro de busca existente
  const matchesSearch = !searchTerm || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subCategory?.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Filtro de visibilidade
  const itemVisible = item.visible === 1 || item.visible === true || item.visible === undefined;
  const matchesVisibility = 
    visibilityFilter === 'all' ? true :
    visibilityFilter === 'visible' ? itemVisible :
    !itemVisible;
  
  return matchesSearch && matchesVisibility;
});
```

---

## 5️⃣ ADICIONAR INDICADORES VISUAIS NO CARD DO ITEM

Procure onde os cards de itens são renderizados. Geralmente há um `.map(item => ...)`.

**DENTRO do card do item**, adicione:

### A) Badge "OCULTO" (no topo do card):

```tsx
{/* Badge de Status no topo direito */}
{(item.visible === 0 || item.visible === false) && (
  <div className="absolute top-2 right-2 z-10">
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
      OCULTO
    </span>
  </div>
)}
```

### B) Overlay semi-transparente (quando oculto):

```tsx
{/* Overlay quando oculto */}
{(item.visible === 0 || item.visible === false) && (
  <div className="absolute inset-0 bg-gray-900 bg-opacity-60 rounded-lg flex items-center justify-center z-10 pointer-events-none">
    <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
      <span className="text-gray-900 font-bold text-sm">🙈 Oculto do Cardápio</span>
    </div>
  </div>
)}
```

---

## 6️⃣ ADICIONAR BOTÃO "OCULTAR/MOSTRAR"

Procure onde estão os botões de ação (Editar, Deletar, etc.) no card do item.

**Adicione este botão ANTES do botão de deletar:**

```tsx
{/* Botão de Ocultar/Mostrar */}
<button
  onClick={() => handleToggleVisibility(
    item.id, 
    item.visible === 1 || item.visible === true || item.visible === undefined
  )}
  className={`px-3 py-1.5 rounded-lg text-white font-medium text-sm transition-all transform hover:scale-105 shadow-md ${
    item.visible === 0 || item.visible === false
      ? 'bg-green-500 hover:bg-green-600'
      : 'bg-yellow-500 hover:bg-yellow-600'
  }`}
  title={
    item.visible === 0 || item.visible === false 
      ? 'Tornar item visível no cardápio' 
      : 'Ocultar item do cardápio'
  }
>
  {item.visible === 0 || item.visible === false ? '👁️ Mostrar' : '🙈 Ocultar'}
</button>
```

---

## 7️⃣ ADICIONAR CONTADOR DE ITENS OCULTOS

Adicione no cabeçalho ou área de estatísticas:

```tsx
{/* Estatísticas de Visibilidade */}
<div className="flex gap-4 text-sm">
  <div className="flex items-center gap-2">
    <span className="font-semibold">Total:</span>
    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{menuData.items.length}</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="font-semibold">👁️ Visíveis:</span>
    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
      {menuData.items.filter(i => i.visible === 1 || i.visible === true || i.visible === undefined).length}
    </span>
  </div>
  <div className="flex items-center gap-2">
    <span className="font-semibold">🙈 Ocultos:</span>
    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
      {menuData.items.filter(i => i.visible === 0 || i.visible === false).length}
    </span>
  </div>
</div>
```

---

## 8️⃣ ADICIONAR ÍCONE NO TÍTULO DO ITEM (OPCIONAL)

Se quiser um indicador visual mais discreto, adicione um ícone no nome do item:

```tsx
<h3 className="text-lg font-semibold flex items-center gap-2">
  {item.name}
  {(item.visible === 0 || item.visible === false) && (
    <span className="text-red-500 text-sm" title="Item oculto">🙈</span>
  )}
</h3>
```

---

## 🎨 EXEMPLO COMPLETO DE UM CARD DE ITEM

Para referência, veja como o card completo deve ficar:

```tsx
<motion.div
  key={item.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-lg shadow-md p-4 relative"
>
  {/* Badge OCULTO */}
  {(item.visible === 0 || item.visible === false) && (
    <div className="absolute top-2 right-2 z-10">
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
        OCULTO
      </span>
    </div>
  )}
  
  {/* Overlay quando oculto */}
  {(item.visible === 0 || item.visible === false) && (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-60 rounded-lg flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
        <span className="text-gray-900 font-bold text-sm">🙈 Oculto do Cardápio</span>
      </div>
    </div>
  )}
  
  {/* Imagem */}
  {item.imageUrl && (
    <Image
      src={getValidImageUrl(item.imageUrl)}
      alt={item.name}
      width={200}
      height={150}
      className="rounded-lg mb-3 w-full object-cover"
    />
  )}
  
  {/* Nome com ícone */}
  <h3 className="text-lg font-semibold flex items-center gap-2">
    {item.name}
    {(item.visible === 0 || item.visible === false) && (
      <span className="text-red-500 text-sm" title="Item oculto">🙈</span>
    )}
  </h3>
  
  {/* Descrição */}
  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
  
  {/* Preço */}
  <p className="text-lg font-bold text-green-600 mb-3">
    R$ {item.price.toFixed(2)}
  </p>
  
  {/* Botões de Ação */}
  <div className="flex gap-2 flex-wrap">
    {/* Editar */}
    <button
      onClick={() => handleEditItem(item)}
      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      <MdEdit className="inline mr-1" />
      Editar
    </button>
    
    {/* Ocultar/Mostrar */}
    <button
      onClick={() => handleToggleVisibility(
        item.id, 
        item.visible === 1 || item.visible === true || item.visible === undefined
      )}
      className={`px-3 py-1.5 rounded-lg text-white font-medium text-sm transition-all ${
        item.visible === 0 || item.visible === false
          ? 'bg-green-500 hover:bg-green-600'
          : 'bg-yellow-500 hover:bg-yellow-600'
      }`}
    >
      {item.visible === 0 || item.visible === false ? '👁️ Mostrar' : '🙈 Ocultar'}
    </button>
    
    {/* Deletar */}
    <button
      onClick={() => handleDeleteItem(item.id)}
      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      <MdDelete className="inline mr-1" />
      Deletar
    </button>
  </div>
</motion.div>
```

---

## 🚀 COMO APLICAR

### Passo a Passo:

1. **Abra** `vamos-comemorar-next/app/admin/cardapio/page.tsx`
2. **Adicione o state** de filtro (seção 1)
3. **Adicione a função** `handleToggleVisibility` (seção 2)
4. **Adicione os botões** de filtro na UI (seção 3)
5. **Modifique o filtro** de itens (seção 4)
6. **Adicione os indicadores** visuais no card (seções 5 e 6)
7. **Opcional:** Adicione estatísticas (seção 7)
8. **Salve** e teste!

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] State `visibilityFilter` adicionado
- [ ] Função `handleToggleVisibility` adicionada
- [ ] Botões de filtro (Todos/Visíveis/Ocultos) adicionados
- [ ] Lógica de filtro atualizada
- [ ] Badge "OCULTO" adicionado no card
- [ ] Overlay semi-transparente adicionado
- [ ] Botão "Ocultar/Mostrar" adicionado
- [ ] Contador de itens ocultos adicionado (opcional)
- [ ] Ícone no título do item (opcional)
- [ ] Testado: Ocultar um item
- [ ] Testado: Mostrar um item
- [ ] Testado: Filtros funcionando

---

## 🧪 TESTE RÁPIDO

Após implementar:

1. **Acesse** `/admin/cardapio`
2. **Escolha um item**
3. **Clique** em "🙈 Ocultar"
4. **Verifique:**
   - Badge "OCULTO" aparece?
   - Overlay cinza aparece?
   - Botão muda para "👁️ Mostrar"?
5. **Clique** em "Ocultos" no filtro
6. **Verifique:** Apenas itens ocultos aparecem?
7. **Clique** em "👁️ Mostrar"
8. **Verifique:** Item volta ao normal?

---

## 🎯 RESULTADO FINAL

### Visão Geral:
```
┌──────────────────────────────────────────┐
│ [Buscar: ___________] [Todos] [Visíveis]│
│                       [Ocultos]          │
├──────────────────────────────────────────┤
│ Total: 15 | 👁️ Visíveis: 12 | 🙈 Ocultos: 3 │
├──────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────────┐ │
│ │ Item 1 │  │ Item 2 │  │[OCULTO]    │ │
│ │ R$ 10  │  │ R$ 20  │  │Item 3      │ │
│ │ [Editar│  │ [Editar│  │R$ 30       │ │
│ │ [Oculta│  │ [Oculta│  │[Editar]    │ │
│ │ [Delete│  │ [Delete│  │[Mostrar]   │ │
│ └────────┘  └────────┘  │[Delete]    │ │
│                         └────────────┘ │
└──────────────────────────────────────────┘
```

---

**Status:** 📝 Código Completo Pronto para Implementar  
**Tempo Estimado:** 15-20 minutos para copiar e aplicar  
**Dificuldade:** ⭐⭐ Fácil (copiar e colar no local certo)

