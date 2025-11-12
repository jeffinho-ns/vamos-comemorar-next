# 📊 Google Analytics - Métricas do Cardápio

## 🎯 Visão Geral

Este documento descreve as métricas e eventos rastreados especificamente para os cardápios de estabelecimentos, permitindo entender quais itens e categorias são mais acessados por estabelecimento.

## 📍 Eventos Rastreados

### 1. **Visualização da Página do Cardápio**
**Evento:** `page_view`  
**Quando:** Quando o usuário acessa a página do cardápio de um estabelecimento

**Parâmetros:**
- `page_title`: "Cardápio - [Nome do Estabelecimento]"
- `page_location`: URL completa da página
- `establishment_name`: Nome do estabelecimento
- `establishment_slug`: Slug do estabelecimento (ex: `reserva-rooftop`, `samba-do-justino`)

**Onde ver no GA4:**
- Relatórios > Engajamento > Páginas e telas
- Filtrar por `/cardapio/[slug]`

---

### 2. **Visualização de Item do Cardápio**
**Evento:** `view_item`  
**Quando:** Quando um item do cardápio aparece na tela (50% visível)

**Parâmetros:**
- `event_category`: `menu_item`
- `event_label`: Nome do item
- `item_id`: ID único do item
- `item_name`: Nome do item
- `item_category`: Categoria do item (ex: "Bebidas", "Pratos Principais")
- `price`: Preço do item
- `currency`: "BRL"
- `establishment_name`: Nome do estabelecimento
- `establishment_slug`: Slug do estabelecimento
- `page_location`: URL da página

**Onde ver no GA4:**
- Relatórios > Engajamento > Eventos
- Filtrar por `view_item`
- Agrupar por `item_name` ou `establishment_name`

---

### 3. **Clique em Item do Cardápio**
**Evento:** `select_item`  
**Quando:** Quando o usuário clica em um item do cardápio para ver detalhes

**Parâmetros:**
- `event_category`: `menu_item`
- `event_label`: Nome do item
- `item_id`: ID único do item
- `item_name`: Nome do item
- `item_category`: Categoria do item
- `price`: Preço do item
- `currency`: "BRL"
- `establishment_name`: Nome do estabelecimento
- `establishment_slug`: Slug do estabelecimento
- `page_location`: URL da página

**Onde ver no GA4:**
- Relatórios > Engajamento > Eventos
- Filtrar por `select_item`
- Agrupar por `item_name` ou `establishment_name`

---

### 4. **Visualização de Categoria/Subcategoria**
**Evento:** `view_item_list`  
**Quando:** Quando o usuário visualiza uma categoria ou subcategoria do cardápio

**Parâmetros:**
- `event_category`: `menu_category`
- `event_label`: Nome da categoria (ou "Categoria - Subcategoria")
- `category_name`: Nome da categoria
- `subcategory_name`: Nome da subcategoria (pode estar vazio)
- `establishment_name`: Nome do estabelecimento
- `establishment_slug`: Slug do estabelecimento
- `page_location`: URL da página

**Onde ver no GA4:**
- Relatórios > Engajamento > Eventos
- Filtrar por `view_item_list`
- Agrupar por `category_name` ou `establishment_name`

---

## 📈 Métricas Recomendadas

### **Métricas Principais por Estabelecimento**

#### 1. **Itens Mais Visualizados**
**O que mede:** Quais itens os clientes mais veem no cardápio  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "view_item"
- Agrupar por: item_name
- Filtrar por: establishment_slug = "[slug-do-estabelecimento]"
- Ordenar por: Total de eventos (decrescente)
```

**Uso:** Identificar itens populares para promoções ou destaques

---

#### 2. **Itens Mais Clicados**
**O que mede:** Quais itens os clientes mais clicam para ver detalhes  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "select_item"
- Agrupar por: item_name
- Filtrar por: establishment_slug = "[slug-do-estabelecimento]"
- Ordenar por: Total de eventos (decrescente)
```

**Uso:** Identificar itens de maior interesse para ajustar preços ou descrições

---

#### 3. **Taxa de Conversão (Visualização → Clique)**
**O que mede:** Percentual de itens visualizados que são clicados  
**Cálculo:**
```
Taxa de Conversão = (select_item / view_item) × 100
```

**Uso:** Identificar itens com boa descrição/imagem (alta taxa) ou que precisam melhorar (baixa taxa)

---

#### 4. **Categorias Mais Acessadas**
**O que mede:** Quais categorias do cardápio são mais visualizadas  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "view_item_list"
- Agrupar por: category_name
- Filtrar por: establishment_slug = "[slug-do-estabelecimento]"
- Ordenar por: Total de eventos (decrescente)
```

**Uso:** Organizar layout do cardápio com categorias mais populares primeiro

---

#### 5. **Comparação Entre Estabelecimentos**
**O que mede:** Performance de itens/categorias entre diferentes estabelecimentos  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "view_item" OU "select_item"
- Agrupar por: establishment_name
- Comparar período atual vs período anterior
```

**Uso:** Identificar padrões de consumo e ajustar estratégias

---

#### 6. **Valor Médio dos Itens Visualizados**
**O que mede:** Preço médio dos itens que os clientes visualizam  
**Como criar:**
```
GA4 > Explorar > Análise livre
- Dimensão: item_name
- Métrica: Média de price (de view_item)
- Filtrar por: establishment_slug
```

**Uso:** Entender se clientes estão procurando itens mais baratos ou mais caros

---

#### 7. **Top 10 Itens por Estabelecimento**
**O que mede:** Ranking dos 10 itens mais acessados por estabelecimento  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "view_item"
- Agrupar por: item_name
- Filtrar por: establishment_slug
- Limitar: Top 10
- Ordenar por: Total de eventos
```

**Uso:** Criar seção "Mais Procurados" no cardápio

---

#### 8. **Engajamento por Categoria**
**O que mede:** Tempo e interação em cada categoria  
**Como criar:**
```
GA4 > Relatórios > Engajamento > Eventos
- Filtrar: event_name = "view_item_list"
- Agrupar por: category_name
- Métricas adicionais: Total de eventos, Usuários únicos
- Filtrar por: establishment_slug
```

**Uso:** Identificar categorias que precisam de mais itens ou melhor apresentação

---

## 🎯 KPIs Sugeridos

### **KPI 1: Taxa de Engajamento por Item**
**Fórmula:** `(select_item / view_item) × 100`  
**Meta:** > 30%  
**Ação:** Itens abaixo de 30% podem precisar de melhor imagem ou descrição

---

### **KPI 2: Diversidade de Visualização**
**Fórmula:** `Total de itens únicos visualizados / Total de itens no cardápio × 100`  
**Meta:** > 60%  
**Ação:** Se baixo, considere reorganizar categorias ou destacar itens

---

### **KPI 3: Taxa de Abandono por Categoria**
**Fórmula:** `(view_item_list - view_item) / view_item_list × 100`  
**Meta:** < 50%  
**Ação:** Categorias com alta taxa de abandono podem precisar de melhor apresentação

---

### **KPI 4: Valor Médio de Itens Clicados**
**Fórmula:** `Média de price dos eventos select_item`  
**Meta:** Comparar com valor médio do cardápio  
**Ação:** Se menor, clientes podem estar procurando itens mais baratos

---

## 📊 Relatórios Customizados Recomendados

### **Relatório 1: Dashboard de Performance por Estabelecimento**
**Dimensões:**
- Establishment name
- Item name
- Category name

**Métricas:**
- Total de visualizações (view_item)
- Total de cliques (select_item)
- Taxa de conversão
- Valor médio dos itens

**Filtros:**
- Período: Últimos 30 dias
- Estabelecimento: Selecionável

---

### **Relatório 2: Análise de Preços**
**Dimensões:**
- Price range (criar segmento)
- Item category
- Establishment name

**Métricas:**
- Total de visualizações
- Total de cliques
- Taxa de conversão

**Uso:** Entender se clientes preferem itens em determinadas faixas de preço

---

### **Relatório 3: Tendências Temporais**
**Dimensões:**
- Data
- Hora do dia
- Item name

**Métricas:**
- Total de eventos
- Usuários únicos

**Uso:** Identificar horários de pico e ajustar estratégias de marketing

---

## 🔍 Análises Avançadas

### **Análise 1: Funnel de Engajamento**
```
1. Visualização da página (page_view)
   ↓
2. Visualização de categoria (view_item_list)
   ↓
3. Visualização de item (view_item)
   ↓
4. Clique no item (select_item)
```

**Onde ver:** GA4 > Explorar > Análise de funil

---

### **Análise 2: Segmentação de Usuários**
**Segmentos sugeridos:**
- Clientes que visualizam muitos itens mas não clicam
- Clientes que clicam em itens de alto valor
- Clientes que focam em categorias específicas

---

### **Análise 3: Correlação Categoria × Item**
**O que mede:** Se categorias populares têm itens populares  
**Como criar:**
```
GA4 > Explorar > Análise livre
- Dimensão primária: category_name
- Dimensão secundária: item_name
- Métrica: Total de eventos
```

---

## 📱 Relatórios Automatizados

### **Configurar Alertas:**
1. **Queda brusca em visualizações** (> 30% em 1 dia)
2. **Item sem visualizações** (7 dias sem eventos)
3. **Aumento de taxa de conversão** (> 50% em 1 semana)

**Como configurar:**
- GA4 > Configurar > Alertas inteligentes

---

## 🚀 Próximos Passos

1. **Configurar relatórios customizados** no GA4
2. **Criar dashboards** para cada estabelecimento
3. **Configurar alertas** para métricas importantes
4. **Revisar mensalmente** e ajustar estratégias
5. **A/B testar** layouts baseados em dados

---

## 📝 Notas Importantes

- ⚠️ **Privacidade:** Todos os dados são anônimos e respeitam LGPD
- ⏱️ **Atualização:** Dados podem levar até 24-48h para aparecer no GA4
- 🔄 **Retenção:** Dados ficam disponíveis por 14 meses no GA4 gratuito
- 📊 **Precisão:** Métricas são baseadas em amostragem para grandes volumes

---

## 🆘 Suporte

Para dúvidas sobre métricas ou configuração de relatórios:
- Consulte a [Documentação do GA4](https://support.google.com/analytics/answer/10089681)
- Verifique os eventos em tempo real: GA4 > Relatórios > Tempo real





