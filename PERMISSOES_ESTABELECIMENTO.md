# Sistema de Permissões por Estabelecimento

## Visão Geral

Este documento descreve o sistema de permissões baseado em estabelecimento implementado para restringir o acesso de usuários específicos a apenas um estabelecimento (Highline) e limitar suas ações em diferentes páginas.

## Usuários Configurados

### Usuários do Estabelecimento Highline

1. **gerente@highlinebar.com.br**
   - Acesso completo ao estabelecimento Highline
   - Pode editar OS e Detalhes Operacionais
   - Pode criar, visualizar e baixar

2. **regianebrunno@gmail.com**
   - Acesso restrito ao estabelecimento Highline
   - **NÃO pode** editar OS
   - **NÃO pode** editar Detalhes Operacionais
   - Pode visualizar OS de Artista/Banda/DJ
   - Pode baixar OS
   - Pode visualizar Detalhes Operacionais

3. **franciely.mendes@ideiaum.com.br**
   - Acesso restrito ao estabelecimento Highline
   - **NÃO pode** editar OS
   - **NÃO pode** editar Detalhes Operacionais
   - Pode visualizar OS de Artista/Banda/DJ
   - Pode baixar OS
   - Pode visualizar Detalhes Operacionais

## Páginas Afetadas

### 1. `/admin/eventos/dashboard`
- Usuários restritos veem apenas o estabelecimento Highline
- Seleção automática do Highline quando há apenas um estabelecimento permitido
- Seletor de estabelecimento desabilitado quando restrito a um único estabelecimento

### 2. `/admin/detalhes-operacionais`
- Usuários restritos veem apenas o estabelecimento Highline
- Seleção automática do Highline quando há apenas um estabelecimento permitido
- Botões de "Editar" e "Excluir" Detalhes Operacionais ocultos para usuários sem permissão
- Botão "Novo Detalhe" oculto para usuários sem permissão de criar
- Botão "Editar" OS oculto para usuários sem permissão
- Botão "Nova OS" oculto para usuários sem permissão de criar
- Botões "Visualizar" e "Exportar" sempre disponíveis

### 3. `/admin/restaurant-reservations`
- Usuários restritos veem apenas o estabelecimento Highline na lista de seleção
- Seleção automática do Highline quando há apenas um estabelecimento permitido

### 4. `/admin/checkins`
- Usuários restritos veem apenas o estabelecimento Highline
- Seleção automática do Highline quando há apenas um estabelecimento permitido
- Seletor de estabelecimento desabilitado quando restrito a um único estabelecimento

## Implementação Técnica

### Hook: `useEstablishmentPermissions`

Localizado em: `app/hooks/useEstablishmentPermissions.ts`

Este hook gerencia as permissões baseadas em estabelecimento:

```typescript
const {
  userConfig,
  userEmail,
  isLoading,
  hasAccessToEstablishment,
  getFilteredEstablishments,
  canEditOS,
  canEditOperationalDetail,
  canViewOS,
  canDownloadOS,
  canCreateOS,
  canCreateOperationalDetail,
  getDefaultEstablishmentId,
  isRestrictedToSingleEstablishment,
} = useEstablishmentPermissions();
```

### Configuração de Usuários

A configuração está em `app/hooks/useEstablishmentPermissions.ts` no array `USER_ESTABLISHMENT_CONFIG`:

```typescript
const USER_ESTABLISHMENT_CONFIG: UserEstablishmentConfig[] = [
  {
    userEmail: 'gerente@highlinebar.com.br',
    establishmentIds: [7], // Highline ID na tabela places
    permissions: {
      canEditOS: true,
      canEditOperationalDetail: true,
      canViewOS: true,
      canDownloadOS: true,
      canViewOperationalDetail: true,
      canCreateOS: true,
      canCreateOperationalDetail: true,
    },
  },
  // ... outros usuários
];
```

### ID do Estabelecimento Highline

- **Tabela `places`**: ID = 7
- Este é o ID usado em todas as verificações de permissão

## Como Adicionar Novos Usuários

1. Adicione uma nova entrada no array `USER_ESTABLISHMENT_CONFIG` em `app/hooks/useEstablishmentPermissions.ts`
2. Defina os `establishmentIds` permitidos
3. Configure as permissões específicas (`canEditOS`, `canEditOperationalDetail`, etc.)

## Melhorias Futuras Sugeridas

1. **Banco de Dados**: Mover a configuração de permissões para o banco de dados em vez de código estático
2. **Interface Administrativa**: Criar uma página de administração para gerenciar permissões por estabelecimento
3. **Logs de Acesso**: Implementar logs de todas as ações restritas
4. **Permissões Granulares**: Adicionar mais níveis de permissão (ex: apenas visualizar, visualizar e exportar, etc.)
5. **Múltiplos Estabelecimentos**: Permitir que um usuário tenha acesso a múltiplos estabelecimentos com permissões diferentes para cada um
6. **API de Permissões**: Criar endpoints na API para gerenciar permissões dinamicamente
7. **Cache de Permissões**: Implementar cache para melhorar performance
8. **Validação no Backend**: Adicionar validação de permissões no backend para segurança adicional

## Segurança

⚠️ **Importante**: As restrições implementadas são apenas no frontend. Para segurança completa, é necessário implementar validações no backend também.

### Recomendações de Segurança

1. Validar permissões no backend em todas as rotas de API
2. Filtrar dados no backend baseado no estabelecimento do usuário
3. Implementar middleware de autorização na API
4. Adicionar logs de auditoria para todas as ações sensíveis

## Testes

Para testar as permissões:

1. Faça login com um dos usuários configurados
2. Navegue pelas páginas mencionadas
3. Verifique que:
   - Apenas o estabelecimento Highline está visível/selecionado
   - Botões de edição estão ocultos quando não há permissão
   - Botões de visualização e exportação estão sempre disponíveis


