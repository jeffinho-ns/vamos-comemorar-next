# 📊 Google Analytics - Implementação e Rastreamento

## 🎯 Visão Geral

Este projeto está configurado com **Google Analytics 4 (GA4)** para monitorar o comportamento dos usuários e rastrear eventos específicos importantes para o negócio.

## 🔧 Configuração Base

### ID de Rastreamento
- **GA4 ID (painel):** `G-EFE3J4Z20X`
- **Variável:** `NEXT_PUBLIC_GA_ID` (prioridade no gtag)
- **Firebase:** `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` — use o **mesmo** ID, ou o tráfego vai para outra propriedade
- **Implementado em:** Layout principal (`app/layout.tsx`) + `GaRouteTracker` (navegação SPA)
- **Cobertura:** Todo o site

### Componente Principal
```typescript
// app/components/GoogleAnalytics/GoogleAnalytics.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-EFE3J4Z20X"
  strategy="afterInteractive"
/>
```

## 📱 Eventos Rastreados

### 1. **Visualização de Páginas**
Todas as páginas principais rastreiam automaticamente as visualizações:

#### Página Samba do Justino
- **Evento:** `page_view`
- **Título:** "Samba do Justino - Cardápio"
- **Localização:** `/cardapio/samba-do-justino`
- **Categoria:** `page_view`

#### Página Decoração de Aniversário
- **Evento:** `page_view`
- **Título:** "Decoração de Aniversário"
- **Localização:** `/decoracao-aniversario`
- **Categoria:** `page_view`

### 2. **Cliques em Banners**
Rastreamento específico de cliques nos banners promocionais:

#### Banner Desktop (`banner-regua.jpg`)
- **Evento:** `click`
- **Categoria:** `banner_click`
- **Rótulo:** `banner-regua-desktop`
- **Localização:** Página atual
- **Parâmetro Customizado:** `banner_click`

#### Banner Mobile (`banner-mobile.jpg`)
- **Evento:** `click`
- **Categoria:** `banner_click`
- **Rótulo:** `banner-mobile`
- **Localização:** Página atual
- **Parâmetro Customizado:** `banner_click`

## 🛠️ Hook Personalizado

### `useGoogleAnalytics`
```typescript
// app/hooks/useGoogleAnalytics.ts

const { trackEvent, trackPageView, trackClick } = useGoogleAnalytics();

// Rastrear visualização de página
trackPageView('Título da Página', '/caminho/da/pagina');

// Rastrear clique em elemento
trackClick('nome-do-elemento', '/pagina-atual', 'categoria');

// Rastrear evento customizado
trackEvent('acao', 'categoria', 'rotulo', valor);
```

## 📍 Páginas com Rastreamento

### ✅ Páginas Implementadas

1. **`/cardapio/[slug]`** - Cardápio dinâmico
   - Rastreia cliques nos banners
   - Identifica qual estabelecimento

2. **`/cardapio/samba-do-justino`** - Samba do Justino
   - Rastreia visualização da página
   - Rastreia cliques nos banners

3. **`/decoracao-aniversario`** - Decoração de Aniversário
   - Rastreia visualização da página

### 🔄 Páginas com Rastreamento Automático
- Todas as outras páginas rastreiam automaticamente visualizações via GA4 padrão

## 📊 Métricas Disponíveis no Google Analytics

### **Página Samba do Justino**
- ✅ **Usuários únicos** que visitaram a página
- ✅ **Sessões** na página
- ✅ **Tempo na página**
- ✅ **Taxa de rejeição**

### **Banner Mobile**
- ✅ **Cliques** no banner mobile
- ✅ **Taxa de clique** (CTR)
- ✅ **Usuários** que clicaram
- ✅ **Sessões** com cliques

### **Página Decoração de Aniversário**
- ✅ **Usuários únicos** que chegaram via banners
- ✅ **Conversões** de banners para a página
- ✅ **Fonte de tráfego** (banners)

## 🎯 Relatórios Recomendados

### 1. **Relatório de Eventos**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar por: banner_click
- Ver: banner-mobile, banner-regua-desktop
```

### 2. **Relatório de Páginas**
```
GA4 > Relatórios > Engajamento > Páginas e telas
- Filtrar por: /cardapio/samba-do-justino
- Filtrar por: /decoracao-aniversario
```

### 3. **Relatório de Conversões**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar por: page_view
- Ver: fluxo de usuários entre páginas
```

## 🚀 Como Usar

### **Para Desenvolvedores**
1. Importe o hook: `import { useGoogleAnalytics } from '../hooks/useGoogleAnalytics'`
2. Use as funções: `const { trackPageView, trackClick } = useGoogleAnalytics()`
3. Implemente o rastreamento onde necessário

### **Para Analistas**
1. Acesse o [Google Analytics](https://analytics.google.com)
2. Selecione a propriedade `G-EFE3J4Z20X`
3. Navegue pelos relatórios de eventos e páginas
4. Configure alertas para métricas importantes

## 📈 KPIs Principais

### **Samba do Justino**
- **Meta:** Aumentar visitas na página
- **Métrica:** Usuários únicos por mês
- **Alerta:** Queda >20% em visitas

### **Banner Mobile**
- **Meta:** Aumentar CTR do banner
- **Métrica:** Taxa de clique
- **Alerta:** CTR <1%

### **Decoração de Aniversário**
- **Meta:** Conversão de banners para página
- **Métrica:** Usuários que chegaram via banners
- **Alerta:** Conversão <5%

## 🔍 Debug e Teste

### **Console do Navegador**
```javascript
// Verificar se GA está carregado
console.log(window.gtag);

// Testar evento manualmente
gtag('event', 'test', {
  event_category: 'test',
  event_label: 'test-label'
});
```

### **Google Analytics DebugView**
1. Ative o modo debug no GA4
2. Visualize eventos em tempo real
3. Verifique se todos os eventos estão sendo enviados

## 📝 Notas Importantes

- ✅ **Build:** Funcionando perfeitamente
- ✅ **Performance:** Scripts carregados de forma otimizada
- ✅ **SEO:** Não afeta o SEO do site
- ✅ **Privacidade:** Respeita configurações de consentimento
- ✅ **Mobile:** Funciona perfeitamente em dispositivos móveis

## 🆘 Suporte

Para dúvidas sobre implementação ou configuração do Google Analytics, consulte:
- [Documentação GA4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Script Component](https://nextjs.org/docs/basic-features/script)
- [Implementação de Eventos](https://developers.google.com/analytics/devguides/collection/ga4/events)
















