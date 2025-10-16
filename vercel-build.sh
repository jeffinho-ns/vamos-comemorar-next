#!/bin/bash

# Script de build específico para Vercel
echo "🚀 Iniciando build para Vercel..."

# Configurar variáveis de ambiente para Sharp
export SHARP_IGNORE_GLOBAL_LIBVIPS=1
export npm_config_platform=linux
export npm_config_arch=x64

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --platform=linux --arch=x64

# Build do projeto
echo "🔨 Executando build..."
npm run build

echo "✅ Build concluído com sucesso!"


















