# Plano de Implementação - Melhorias do Cardápio

## ✅ Funcionalidades Definidas

### Prioridade 1: Pausar Item ✅ CONCLUÍDO
- [x] Botão Pausar/Ativar na lista de itens
- [x] Alternar campo `visible`
- [x] Indicador visual quando pausado

### Prioridade 2: Galeria de Imagens (Em implementação)
- [ ] Modal de galeria com imagens já usadas
- [ ] Permitir upload de novas imagens na galeria
- [ ] Reutilizar imagens da galeria
- [ ] Buscar imagens de: menu_items, bars (logoUrl, coverImageUrl, popupImageUrl)

### Prioridade 3: Lixeira com Soft Delete
- [ ] Adicionar campo `deleted_at` na tabela menu_items (migration)
- [ ] Modificar DELETE para soft delete (SET deleted_at)
- [ ] Criar página/modal de lixeira
- [ ] Função para restaurar itens
- [ ] Job/cron para excluir permanentemente após 30 dias

### Prioridade 4: Área de Mídia Completa
- [ ] Editor de imagem integrado
- [ ] Crop de imagem
- [ ] Redimensionar imagem
- [ ] Filtros básicos
- [ ] Excluir imagens da galeria

### Prioridade 5: Crop Quadrado Obrigatório
- [ ] Integrar biblioteca de crop
- [ ] Crop quadrado obrigatório no upload
- [ ] Preview do crop antes de salvar

---

## Estrutura de Dados Necessária

### Para Galeria:
- Listar todas imagens de: menu_items.imageUrl, bars.logoUrl, bars.coverImageUrl, bars.popupImageUrl
- Endpoint API: `/api/cardapio/images/gallery`

### Para Lixeira:
- Campo `deleted_at TIMESTAMP NULL` em menu_items
- Endpoint API: `/api/cardapio/items/:id/restore`
- Endpoint API: `/api/cardapio/trash` (listar itens deletados)
- Job para limpar após 30 dias

### Para Crop:
- Biblioteca: `react-image-crop` ou similar
- Componente de crop integrado no upload

---

## Ordem de Implementação

1. ✅ Prioridade 1: Pausar Item - CONCLUÍDO
2. 🔄 Prioridade 2: Galeria de Imagens - EM ANDAMENTO
3. ⏳ Prioridade 3: Lixeira
4. ⏳ Prioridade 4: Área de Mídia
5. ⏳ Prioridade 5: Crop Quadrado

