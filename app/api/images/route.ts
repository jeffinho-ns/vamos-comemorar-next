import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Fazer proxy para o backend
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro do servidor:', errorData);
      return NextResponse.json(
        { error: errorData.error || `Erro no upload: ${response.status} - ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Resultado do upload:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: `Erro no upload: ${errorMessage}` },
      { status: 500 }
    );
  }
}
