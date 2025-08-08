import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://vamos-comemorar-api.onrender.com' 
  : 'http://localhost:10000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API route iniciada');
    
    const formData = await request.formData();
    console.log('📋 FormData recebido:', formData);
    
    // Verificar se há um arquivo no FormData
    const file = formData.get('image');
    if (!file) {
      console.error('❌ Nenhum arquivo encontrado no FormData');
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }
    
    console.log('📁 Arquivo encontrado:', file);
    
    // Criar um novo FormData para enviar ao backend
    const backendFormData = new FormData();
    backendFormData.append('image', file);
    
    console.log('🚀 Enviando para backend:', `${API_BASE_URL}/api/images/upload`);
    
    // Fazer proxy da requisição para o backend
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    console.log('📡 Resposta do backend:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do backend:', errorText);
      
      let errorData: { error?: string } = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      return NextResponse.json(
        { success: false, error: errorData.error || `Erro no servidor: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Upload bem-sucedido:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Erro no proxy de upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
