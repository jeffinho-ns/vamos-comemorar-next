import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://vamos-comemorar-api.onrender.com';

// GET - Buscar lista de espera
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const establishmentId = searchParams.get('establishment_id');
    const date = searchParams.get('date');
    const preferredTime = searchParams.get('preferred_time');

    let url = `${API_BASE_URL}/api/waitlist`;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (establishmentId) params.append('establishment_id', establishmentId);
    if (date) params.append('date', date);
    if (preferredTime) params.append('preferred_time', preferredTime);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar lista de espera' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar lista de espera:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar à lista de espera
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Erro ao adicionar à lista de espera' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro ao adicionar à lista de espera:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
