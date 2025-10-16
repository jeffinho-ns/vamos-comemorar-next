# Upload de Imagens dos Eventos - Atualização

## 📋 Resumo das Alterações

Este documento descreve as mudanças realizadas para padronizar o upload de imagens dos eventos, aplicando o mesmo sistema usado no cardápio.

## 🎯 Objetivo

Fazer com que as imagens dos eventos (imagem do evento e imagem do combo) sejam enviadas para o servidor FTP da mesma forma que as imagens do cardápio, garantindo consistência e centralização do armazenamento.

## 🔄 Mudanças Realizadas

### 1. API de Eventos (Backend)

**Arquivo:** `vamos-comemorar-api/routes/events.js`

#### Antes:
- Usava `multer` para upload local de arquivos em `uploads/events/`
- Recebia arquivos via FormData nos endpoints POST e PUT
- Armazenava imagens localmente no servidor
- URLs das imagens: `https://vamos-comemorar-api.onrender.com/uploads/events/{filename}`

#### Depois:
- **Removido** multer e uploads locais
- Recebe apenas os **filenames** no body da requisição (JSON)
- As imagens são armazenadas no FTP via endpoint `/api/images/upload`
- URLs das imagens: `https://grupoideiaum.com.br/cardapio-agilizaiapp/{filename}`

#### Alterações específicas:

**POST /api/events** (Criar evento):
```javascript
// Antes
router.post('/', auth, upload.fields([...]), async (req, res) => {
  const imagemDoEventoFile = req.files?.['imagem_do_evento']?.[0];
  const imagemDoEvento = imagemDoEventoFile ? imagemDoEventoFile.filename : null;
  ...
}

// Depois
router.post('/', auth, async (req, res) => {
  const { imagem_do_evento, imagem_do_combo, ... } = req.body;
  // imagem_do_evento e imagem_do_combo já são filenames
  ...
}
```

**PUT /api/events/:id** (Editar evento):
```javascript
// Antes
router.put('/:id', auth, upload.fields([...]), async (req, res) => {
  const imagemDoEventoFile = req.files?.['imagem_do_evento']?.[0];
  if (imagemDoEventoFile) {
    // Deleta arquivo antigo e salva novo
  }
  ...
}

// Depois
router.put('/:id', auth, async (req, res) => {
  const { imagem_do_evento, imagem_do_combo, ... } = req.body;
  const imagemDoEventoFinal = imagem_do_evento || eventoAntigo.imagem_do_evento;
  // Usa nova imagem ou mantém a antiga
  ...
}
```

**DELETE /api/events/:id** (Deletar evento):
```javascript
// Antes
// Deletava arquivos locais com fs.unlinkSync

// Depois
// Apenas deleta o registro do banco
// As imagens permanecem no FTP (futuramente pode-se implementar deleção via FTP)
```

**addFullImageUrls** (Construção de URLs):
```javascript
// Antes
const baseUrl = process.env.API_BASE_URL || 'https://vamos-comemorar-api.onrender.com';
imagem_do_evento_url: `${baseUrl}/uploads/events/${event.imagem_do_evento}`

// Depois
const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
imagem_do_evento_url: `${BASE_IMAGE_URL}${event.imagem_do_evento}`
```

### 2. Componentes Frontend (Já estavam corretos)

**Arquivo:** `vamos-comemorar-next/app/components/events/AddEvent.tsx`
**Arquivo:** `vamos-comemorar-next/app/components/EditEvent/EditEvent.tsx`

Os componentes já estavam implementados corretamente:

1. **Upload de imagens via FTP:**
   - Função `uploadImage()` envia arquivo para `/api/images/upload`
   - Inclui `entityType: 'event'` no FormData
   - Recebe o `filename` de volta

2. **Criação/Edição de evento:**
   - Envia apenas os `filenames` no JSON para `/api/events`
   - Não envia os arquivos novamente

3. **Exibição de imagens:**
   - EditEvent já usa `BASE_IMAGE_URL` para montar URLs completas
   - URLs montadas como: `https://grupoideiaum.com.br/cardapio-agilizaiapp/{filename}`

## 🎨 Fluxo Completo

### Criar Novo Evento:

1. **Usuário seleciona imagem** → Preview local criado
2. **Upload da imagem:**
   - `uploadImage()` envia arquivo para `/api/images/upload`
   - API salva no FTP e retorna `filename`
3. **Criação do evento:**
   - Envia JSON com `imagem_do_evento: filename`
   - API salva `filename` no banco de dados
4. **Exibição:**
   - API retorna `imagem_do_evento_url: BASE_IMAGE_URL + filename`

### Editar Evento Existente:

1. **Carregar evento:**
   - API retorna `imagem_do_evento` (filename) e `imagem_do_evento_url` (URL completa)
   - EditEvent monta preview usando `getImageUrl()`
2. **Se usuário trocar imagem:**
   - Nova imagem enviada para FTP via `uploadImage()`
   - Novo `filename` recebido
3. **Salvar alterações:**
   - Envia novo `filename` ou mantém o antigo
   - API atualiza no banco

## ✅ Benefícios

1. **Consistência:** Mesma lógica do cardápio
2. **Centralização:** Todas imagens no mesmo FTP
3. **Escalabilidade:** Não depende do servidor da API para armazenamento
4. **Manutenibilidade:** Código mais limpo e organizado
5. **Performance:** FTP dedicado para imagens

## 🔍 Arquivos Modificados

- ✅ `vamos-comemorar-api/routes/events.js`

## 📝 Arquivos Verificados (já estavam corretos)

- ✅ `vamos-comemorar-next/app/components/events/AddEvent.tsx`
- ✅ `vamos-comemorar-next/app/components/EditEvent/EditEvent.tsx`
- ✅ `vamos-comemorar-api/routes/images.js` (endpoint de upload)

## 🚀 Próximos Passos (Opcional)

1. Implementar deleção de imagens do FTP quando evento é deletado
2. Implementar atualização de imagens (deletar antiga ao fazer upload de nova)
3. Adicionar validação de tamanho e tipo de imagem no frontend
4. Implementar compressão de imagens antes do upload

## 📌 Notas Importantes

- As imagens antigas que estavam em `uploads/events/` não serão mais acessíveis
- Eventos existentes precisarão ter suas imagens re-enviadas ou migradas
- O endpoint `/api/images/upload` já registra as imagens no banco `cardapio_images`
- URLs antigas não funcionarão mais após o deploy dessas mudanças

