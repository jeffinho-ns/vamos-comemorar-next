# Sistema de Subcategorias - API e Frontend

## Visão Geral

Este sistema permite gerenciar subcategorias de menu de forma independente, com endpoints dedicados para criar, editar, excluir e reordenar subcategorias.

## Endpoints da API

### 1. Listar Subcategorias

#### GET `/api/cardapio/subcategories`
Lista todas as subcategorias únicas com contagem de itens.

**Resposta:**
```json
[
  {
    "name": "Grelhado",
    "categoryId": 7,
    "barId": 1,
    "categoryName": "Monte seu prato!",
    "barName": "Seu Justino",
    "itemsCount": 4
  }
]
```

#### GET `/api/cardapio/subcategories/category/:categoryId`
Lista subcategorias de uma categoria específica.

#### GET `/api/cardapio/subcategories/bar/:barId`
Lista subcategorias de um bar específico.

### 2. Criar Subcategoria

#### POST `/api/cardapio/subcategories`
Cria uma nova subcategoria.

**Body:**
```json
{
  "name": "Nova Subcategoria",
  "categoryId": 7,
  "barId": 1,
  "order": 0
}
```

**Resposta:**
```json
{
  "id": 123,
  "name": "Nova Subcategoria",
  "categoryId": 7,
  "barId": 1,
  "order": 0,
  "itemsCount": 1
}
```

### 3. Atualizar Subcategoria

#### PUT `/api/cardapio/subcategories/:id`
Atualiza uma subcategoria existente (renomeia e atualiza todos os itens automaticamente).

**Body:**
```json
{
  "name": "Novo Nome",
  "order": 1
}
```

### 4. Excluir Subcategoria

#### DELETE `/api/cardapio/subcategories/:id`
Exclui uma subcategoria (apenas se não estiver sendo usada por outros itens).

### 5. Reordenar Subcategorias

#### PUT `/api/cardapio/subcategories/reorder/:categoryId`
Reordena subcategorias de uma categoria.

**Body:**
```json
{
  "subcategoryNames": ["Subcategoria A", "Subcategoria B", "Subcategoria C"]
}
```

## Como Funciona no Frontend

### 1. Acesso ao Modal de Edição Rápida

- Na aba "Categorias", cada categoria tem um botão verde de edição rápida
- Clique no botão para abrir o modal de gerenciamento de subcategorias

### 2. Funcionalidades do Modal

#### Visualização
- Lista todas as subcategorias da categoria selecionada
- Mostra contador de itens para cada subcategoria
- Exibe estatísticas da categoria

#### Edição
- **Renomear**: Altere o nome de uma subcategoria existente
- **Reordenar**: Use os botões ↑↓ para alterar a ordem
- **Adicionar**: Crie novas subcategorias com o botão "Adicionar"

#### Gerenciamento
- **Duplicar**: Copie uma subcategoria existente
- **Excluir**: Remova subcategorias não utilizadas
- **Ordenar**: Use botões A-Z ou 1-9 para ordenação automática

### 3. Salvamento

- O botão "Salvar Alterações" só fica ativo quando há mudanças
- O sistema detecta automaticamente:
  - Subcategorias renomeadas
  - Novas subcategorias criadas
  - Alterações na ordem

### 4. Validações

- **Nomes vazios**: São ignorados automaticamente
- **Duplicatas**: Não são permitidas na mesma categoria
- **Exclusão**: Só é possível se a subcategoria não estiver sendo usada

## Fluxo de Trabalho Recomendado

1. **Visualizar**: Abra o modal para ver as subcategorias existentes
2. **Organizar**: Reordene as subcategorias conforme necessário
3. **Renomear**: Corrija nomes incorretos ou desatualizados
4. **Adicionar**: Crie novas subcategorias conforme necessário
5. **Limpar**: Remova subcategorias não utilizadas
6. **Salvar**: Confirme todas as alterações

## Benefícios

- **Edição em Massa**: Altere múltiplas subcategorias de uma vez
- **Validação Automática**: O sistema previne erros e inconsistências
- **Sincronização**: Todas as alterações são aplicadas automaticamente aos itens
- **Interface Intuitiva**: Modal organizado com todas as funcionalidades necessárias
- **Feedback Visual**: Contadores e indicadores mostram o impacto das mudanças

## Notas Importantes

- **Subcategorias existentes**: Ao renomear, todos os itens são atualizados automaticamente
- **Novas subcategorias**: São criadas como "placeholders" e precisam ser aplicadas aos itens
- **Ordem**: A ordem determina como as subcategorias aparecem no cardápio
- **Backup**: Sempre faça backup antes de grandes alterações
- **Teste**: Teste as alterações em um ambiente de desenvolvimento primeiro

## Solução de Problemas

### Erro 404 ao salvar
- Verifique se a API está rodando
- Confirme se os endpoints estão configurados corretamente

### Subcategoria não pode ser excluída
- Verifique se há itens usando essa subcategoria
- Use a funcionalidade de renomear em vez de excluir

### Alterações não aparecem
- Recarregue a página após salvar
- Verifique se há erros no console do navegador
- Confirme se as alterações foram salvas com sucesso


















