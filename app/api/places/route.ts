import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

// GET - Buscar todos os estabelecimentos (places)
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/places`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar estabelecimentos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar estabelecimentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}




