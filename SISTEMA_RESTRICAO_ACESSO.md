# Sistema de Restrição de Acesso - Vamos Comemorar

## Visão Geral

Este documento descreve o sistema de restrição de acesso implementado no projeto Agilizaiapp, que controla quais usuários podem acessar diferentes áreas do sistema administrativo baseado em seus roles (Administrador, Promoter, Cliente).

## Estrutura de Permissões

### 1. Administrador
- **Acesso completo** a todas as funcionalidades administrativas
- Pode gerenciar todos os bares, categorias e itens
- Pode criar, editar e excluir qualquer elemento do sistema
- Acesso total a todas as rotas administrativas

### 2. Promoter
- **Acesso restrito** a funcionalidades específicas do seu estabelecimento
- Pode gerenciar o cardápio do seu bar específico
- Pode visualizar e gerenciar eventos do seu estabelecimento
- Pode visualizar e gerenciar reservas do seu estabelecimento
- Pode usar o scanner de QR code para check-ins
- **NÃO pode** criar, editar ou excluir bares
- **NÃO pode** acessar outras áreas administrativas (usuários, commodities, etc.)

### 3. Cliente
- **Sem acesso** às funcionalidades administrativas
- Redirecionado para página de acesso negado

## Implementação Técnica

### Middleware de Autenticação
- Localizado em: `app/middleware.ts`
- Verifica token e role do usuário
- Redireciona para `/acesso-negado` se não tiver permissão

### Hook de Permissões
- Localizado em: `app/hooks/useUserPermissions.ts`
- Gerencia estado das permissões do usuário
- Fornece funções para verificar acesso a rotas e recursos

### Configuração de Promoters
- Localizado em: `app/config/promoter-bars.ts`
- Mapeia promoters aos bares que podem gerenciar
- Configuração estática (pode ser movida para banco de dados no futuro)

### Layout Administrativo
- Localizado em: `app/admin/layout.tsx`
- Mostra apenas as rotas permitidas baseadas no role
- Interface adaptativa para promoters

## Rotas e Permissões

### Rotas Administrativas
```
/admin/cardapio          - admin, promoter
/admin/events            - admin, promoter
/admin/reservas          - admin, promoter
/admin/qrcode            - admin, promoter
/admin/commodities       - admin
/admin/enterprise        - admin
/admin/eventos           - admin
/admin/gifts             - admin
/admin/painel-eventos    - admin
/admin/users             - admin
/admin/workdays          - admin
/admin/places            - admin
/admin/tables            - admin
```

## Configuração de Promoters

### Mapeamento Atual
```typescript
{
  userId: 1,
  userEmail: "promoter@seujustino.com",
  userName: "Promoter Seu Justino",
  barId: 1,
  barName: "Seu Justino",
  barSlug: "seu-justino"
}
```

### Como Adicionar um Novo Promoter
1. Adicionar entrada no array `PROMOTER_BAR_MAPPINGS` em `app/config/promoter-bars.ts`
2. Definir o `userId` do usuário
3. Associar ao `barId` correto
4. Configurar email e nome do usuário

## Filtros de Dados

### Para Promoters
- **Bares**: Mostra apenas o bar associado ao promoter
- **Categorias**: Filtradas por `barId` do promoter
- **Itens**: Filtrados por `barId` do promoter
- **Eventos**: Filtrados por estabelecimento do promoter
- **Reservas**: Filtradas por eventos do estabelecimento do promoter

### Para Administradores
- **Todos os dados** são exibidos sem filtros

## Interface do Usuário

### Indicadores Visuais
- **Promoters**: Banner verde indicando qual bar estão gerenciando e funcionalidades disponíveis
- **Role**: Indicador visual no sidebar mostrando o tipo de usuário
- **Botões**: Apenas ações permitidas são exibidas
- **Navegação**: Sidebar adaptativa mostrando apenas rotas permitidas

### Mensagens de Acesso
- Promoters veem mensagem explicativa sobre funcionalidades disponíveis
- Interface adaptativa baseada no role do usuário
- Navegação clara entre funcionalidades permitidas

## Segurança

### Validações
- **Frontend**: Verificações de permissão em componentes
- **Backend**: Middleware de autenticação
- **Cookies**: Armazenamento seguro de role e token

### Redirecionamentos
- Usuários sem permissão são redirecionados para `/acesso-negado`
- Página de acesso negado com contador regressivo para login

## Página de Acesso Negado

### Características
- Design moderno e responsivo
- Animações com Framer Motion
- Contador regressivo para redirecionamento automático
- Botões de ação (voltar, home, login)

### Funcionalidades
- Redirecionamento automático em 10 segundos
- Navegação manual para diferentes páginas
- Mensagem explicativa sobre restrições

## Futuras Melhorias

### Banco de Dados
- Mover mapeamento de promoters para tabela no banco
- Relacionamento direto entre usuários e bares
- Sistema de convites para novos promoters

### Permissões Granulares
- Controle de permissões por funcionalidade
- Sistema de grupos de usuários
- Auditoria de ações administrativas

### API
- Endpoints específicos para promoters
- Validação de permissões no backend
- Rate limiting por tipo de usuário

## Troubleshooting

### Problemas Comuns
1. **Usuário não vê dados**: Verificar mapeamento em `promoter-bars.ts`
2. **Acesso negado**: Verificar role nos cookies
3. **Filtros não funcionam**: Verificar `useUserPermissions` hook

### Logs
- Middleware registra tentativas de acesso
- Console do navegador mostra permissões carregadas
- Verificar cookies e localStorage para debugging

## Contato

Para dúvidas sobre o sistema de restrição de acesso, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.
