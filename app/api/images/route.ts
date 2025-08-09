import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

// Função para salvar arquivo localmente (fallback)
async function saveFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Criar nome único para o arquivo
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `upload-${timestamp}.${extension}`;

  // Caminho para salvar na pasta public/images
  const uploadDir = join(process.cwd(), 'public', 'images');
  const filePath = join(uploadDir, filename);

  try {
    // Garantir que a pasta existe
    await mkdir(uploadDir, { recursive: true });
    
    // Salvar o arquivo
    await writeFile(filePath, buffer);
    
    console.log('✅ Arquivo salvo localmente:', filename);
    return filename;
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo localmente:', error);
    throw new Error('Erro ao salvar arquivo');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API route iniciada');
    
    const formData = await request.formData();
    console.log('📋 FormData recebido');
    
    // Verificar se há um arquivo no FormData
    const file = formData.get('image') as File;
    if (!file) {
      console.error('❌ Nenhum arquivo encontrado no FormData');
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }
    
    console.log('📁 Arquivo encontrado:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validar o arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Apenas imagens são permitidas' },
        { status: 400 }
      );
    }
    
    // Limitar o tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      );
    }
    
    // Criar um novo FormData para enviar ao backend
    const backendFormData = new FormData();
    backendFormData.append('image', file);
    
    const uploadUrl = `${API_BASE_URL}/api/images/upload`;
    console.log('🚀 Enviando para backend:', uploadUrl);
    
    try {
      // Fazer proxy da requisição para o backend com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Resposta do backend:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload externo bem-sucedido:', result);
        
        return NextResponse.json({
          success: true,
          filename: result.filename || result.url,
          source: 'external',
          ...result
        });
      } else {
        // Se falhar na API externa, usar fallback local
        console.log('⚠️ API externa falhou, tentando salvar localmente...');
        throw new Error('API externa indisponível');
      }
    } catch (externalError) {
      console.log('🔄 Tentando upload local como fallback...');
      
      try {
        const filename = await saveFileLocally(file);
        
        return NextResponse.json({
          success: true,
          filename: filename,
          source: 'local',
          message: 'Arquivo salvo localmente (fallback)'
        });
      } catch (localError) {
        console.error('❌ Erro no fallback local:', localError);
        throw new Error('Falha tanto na API externa quanto no upload local');
      }
    }
  } catch (error) {
    console.error('❌ Erro no proxy de upload:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout na requisição' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
