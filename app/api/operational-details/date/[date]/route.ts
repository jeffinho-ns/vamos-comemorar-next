import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  'https://vamos-comemorar-api.onrender.com';

// GET - Buscar detalhe operacional por data (público - para uso no formulário de reserva)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await context.params;

    // Validar formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Formato de data inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/operational-details/date/${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Se não encontrar, retornar 404 mas não erro crítico
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Nenhum detalhe operacional encontrado para esta data' },
          { status: 404 }
        );
      }
      
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar detalhe operacional' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhe operacional por data:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


