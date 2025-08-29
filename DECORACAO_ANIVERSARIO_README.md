# 🎉 Páginas de Decoração de Aniversário

Este documento descreve as duas novas páginas criadas para o sistema de reserva de decoração de aniversário no projeto Next.js.

## 📁 Estrutura dos Arquivos

```
app/
├── decoracao-aniversario/
│   ├── page.tsx          # Página explicativa sobre o serviço
│   └── styles.scss       # Estilos específicos da página
├── reserva-aniversario/
│   ├── page.tsx          # Formulário de reserva
│   └── styles.scss       # Estilos específicos da página
└── services/
    └── birthdayService.ts # Serviço atualizado com método de criação
```

## 🎨 Página 1: `/decoracao-aniversario` - Página Explicativa

### Funcionalidades
- **Header atrativo** com gradiente laranja-vermelho e ícone de bolo
- **Navegação por abas** para organizar o conteúdo:
  - Como Funciona
  - Opções de Decoração
  - Nossos Bares
  - Preços e Custos

### Conteúdo das Abas

#### 1. Como Funciona
- Explicação do processo em 3 etapas
- Informações importantes sobre aluguel vs. compra
- Botão CTA para fazer reserva

#### 2. Opções de Decoração
- Grid com 6 opções de decoração
- Preços de R$ 200,00 a R$ 320,00
- Descrições detalhadas de cada kit

#### 3. Nossos Bares
- Lista dos 4 bares parceiros
- Informações de localização
- Cards interativos

#### 4. Preços e Custos
- Explicação transparente sobre cobrança
- Destaque para painéis sem custo adicional
- Botão CTA para reserva

### Design
- Tema escuro com gradientes laranja-vermelho
- Cards interativos com hover effects
- Layout responsivo para mobile e desktop
- Ícones do FontAwesome para melhor UX

## 📝 Página 2: `/reserva-aniversario` - Formulário de Reserva

### Funcionalidades
- **Formulário completo** baseado na tela Flutter
- **Navegação por seções** para organizar o processo:
  - Dados Pessoais
  - Decoração
  - Painel
  - Bebidas
  - Comidas
  - Presentes

### Seções do Formulário

#### 1. Dados Pessoais
- Nome do aniversariante (obrigatório)
- Documento
- WhatsApp
- E-mail
- Data do aniversário (obrigatório)
- Bar selecionado (obrigatório)
- Quantidade de convidados (slider 1-50)

#### 2. Decoração
- Seleção entre 6 opções de decoração
- Preços e descrições
- Seleção visual com indicador de escolha

#### 3. Painel
- Opção entre painel do estoque ou personalizado
- Seleção visual de painéis do estoque (grid 5x2)
- Campos para tema e frase personalizados
- Validação de 5 dias para painéis personalizados

#### 4. Bebidas
- 10 opções de bebidas do bar
- Controles de quantidade (+/-)
- Preços individuais
- Total calculado automaticamente

#### 5. Comidas
- 10 opções de comidas do bar
- Controles de quantidade (+/-)
- Preços individuais
- Total calculado automaticamente

#### 6. Presentes
- 20 opções de presentes
- Seleção múltipla (máximo 20)
- Preços individuais
- Indicadores visuais de seleção

### Validações
- Campos obrigatórios marcados com *
- Validação de data para painéis personalizados
- Limite de 20 presentes
- Verificação de seleção de decoração

### Integração com Backend
- Usa o serviço `BirthdayService.createBirthdayReservation()`
- Envia dados para a API `/api/birthday-reservations`
- Mapeia dados para o formato esperado pelo backend
- Tratamento de erros e sucesso

## 🔧 Serviço Atualizado

### `BirthdayService.createBirthdayReservation()`
- Método para criar novas reservas
- POST para `/api/birthday-reservations`
- Tratamento de erros HTTP
- Retorna a reserva criada com ID

## 🎯 Fluxo de Uso

1. **Usuário acessa** `/decoracao-aniversario`
2. **Navega pelas abas** para entender o serviço
3. **Clica em "Fazer Minha Reserva"** → vai para `/reserva-aniversario`
4. **Preenche o formulário** seção por seção
5. **Confirma a reserva** → dados enviados para o backend
6. **Recebe confirmação** e é redirecionado

## 🎨 Características de Design

### Cores
- **Primária**: Laranja (#f97316)
- **Secundária**: Vermelho (#dc2626)
- **Fundo**: Tons de slate (#0f172a, #1e293b, #334155)
- **Texto**: Branco e tons de cinza

### Componentes
- **Cards interativos** com hover effects
- **Gradientes** para headers e elementos especiais
- **Ícones** do FontAwesome para melhor UX
- **Animações** suaves de transição

### Responsividade
- **Mobile-first** design
- **Grid adaptativo** para diferentes tamanhos de tela
- **Navegação horizontal** com scroll em telas pequenas
- **Botões** que se adaptam ao layout

## 🚀 Como Implementar

### 1. Instalar Dependências
```bash
npm install react-icons
```

### 2. Importar Estilos
```scss
// No arquivo principal de estilos
@import './decoracao-aniversario/styles.scss';
@import './reserva-aniversario/styles.scss';
```

### 3. Configurar Rotas
As páginas já estão configuradas com Next.js App Router:
- `/decoracao-aniversario` → `app/decoracao-aniversario/page.tsx`
- `/reserva-aniversario` → `app/reserva-aniversario/page.tsx`

### 4. Verificar API
Certificar que o backend está rodando e acessível em:
`https://vamos-comemorar-api.onrender.com/api`

## 🔍 Funcionalidades Especiais

### Widgets Informativos
- **InfoWidget**: Informações gerais (laranja)
- **WarningWidget**: Avisos importantes (vermelho)
- Clique para ver detalhes (simula popup do Flutter)

### Cálculo Automático
- Total da decoração
- Soma de bebidas e comidas
- Atualização em tempo real

### Validações Inteligentes
- Painéis personalizados só com 5+ dias de antecedência
- Campos obrigatórios destacados
- Feedback visual para seleções

## 📱 Compatibilidade

- ✅ **Desktop** (1024px+)
- ✅ **Tablet** (768px - 1023px)
- ✅ **Mobile** (320px - 767px)
- ✅ **Navegadores modernos**
- ✅ **Next.js 13+** com App Router

## 🎯 Próximos Passos

1. **Testar integração** com o backend
2. **Adicionar imagens reais** para decorações e painéis
3. **Implementar autenticação** para obter user_id real
4. **Adicionar validações** mais robustas
5. **Criar testes** automatizados
6. **Otimizar performance** com lazy loading

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs do console do navegador
- Confirmar conectividade com a API
- Validar dados enviados no formato correto
- Testar em diferentes dispositivos e navegadores









