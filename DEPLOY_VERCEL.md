# Deploy no Vercel - Vamos Comemorar Frontend

## Configurações Otimizadas para Vercel

Este projeto foi configurado e otimizado especificamente para deploy no Vercel. Todas as configurações de backend foram removidas e o projeto está configurado apenas como frontend.

## Arquivos de Configuração

### 1. vercel.json
- Configuração específica para o Vercel
- Framework Next.js configurado
- Região definida para Brasil (gru1)
- Timeout configurado para páginas dinâmicas

### 2. next.config.mjs
- Otimizações para produção
- Configurações de imagens remotas
- Headers de segurança
- Output standalone para melhor performance

### 3. tsconfig.json
- Target ES2020 para melhor compatibilidade
- Configurações otimizadas para Next.js 15
- Verificações de tipo rigorosas

### 4. tailwind.config.ts
- Configuração otimizada para produção
- Plugins essenciais apenas
- Configurações de performance

### 5. postcss.config.mjs
- Autoprefixer para compatibilidade cross-browser
- Configuração mínima para evitar conflitos

## Dependências

### Frontend Only
- Next.js 15
- React 18
- Framer Motion
- Tailwind CSS
- React Icons
- Outras bibliotecas de UI

### Removidas
- Todas as dependências de backend
- Dependências duplicadas
- Pacotes desnecessários

## Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento local
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
npm run type-check # Verificação de tipos TypeScript
```

## Deploy no Vercel

1. **Conectar Repositório**
   - Conecte o repositório GitHub ao Vercel
   - Selecione a pasta `vamos-comemorar-next`

2. **Configurações Automáticas**
   - Framework: Next.js (detectado automaticamente)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Variáveis de Ambiente**
   - `NODE_ENV`: production
   - Todas as URLs de API apontam para o backend separado

4. **Domínios**
   - O frontend será servido pelo Vercel
   - O backend continua no Render.com

## Estrutura de Separação

### Frontend (Vercel)
- Interface do usuário
- Componentes React
- Estilos e assets
- Roteamento Next.js

### Backend (Render.com)
- APIs REST
- Banco de dados
- Autenticação
- Upload de arquivos

## URLs de API

Todas as chamadas de API apontam para:
```
https://vamos-comemorar-api.onrender.com
```

## Performance

- Build otimizado para produção
- Imagens otimizadas com Next.js Image
- Code splitting automático
- Lazy loading de componentes
- Bundle size otimizado

## Monitoramento

- Build status no Vercel
- Logs de deploy
- Métricas de performance
- Alertas de erro

## Suporte

Para problemas de deploy:
1. Verificar logs no Vercel
2. Testar build local com `npm run build`
3. Verificar configurações de arquivos
4. Consultar documentação do Next.js 15
















