import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

// GET - Buscar todos os detalhes operacionais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const establishment_id = searchParams.get('establishment_id');
    const event_date = searchParams.get('event_date');
    const is_active = searchParams.get('is_active');

    let url = `${API_BASE_URL}/api/v1/operational-details`;
    const params = new URLSearchParams();
    
    if (establishment_id) params.append('establishment_id', establishment_id);
    if (event_date) params.append('event_date', event_date);
    if (is_active !== null && is_active !== undefined) params.append('is_active', is_active);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const token = request.headers.get('authorization');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar detalhes operacionais' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes operacionais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo detalhe operacional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const token = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/operational-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao criar detalhe operacional' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao criar detalhe operacional:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

