import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  'https://api.agilizaiapp.com.br';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const parsedDays = parseInt(url.searchParams.get('days') || '', 10);
    const days = Number.isNaN(parsedDays) || parsedDays <= 0
      ? DEFAULT_DAYS
      : Math.min(parsedDays, MAX_DAYS);

    const startDate = url.searchParams.get('startDate');
    const establishmentId = url.searchParams.get('establishment_id');

    // A API agrupa por establishment_id em uma única consulta de intervalo.
    const target = new URL(`${API_BASE_URL}/api/v1/operational-details/upcoming`);
    target.searchParams.set('days', String(days));
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      target.searchParams.set('startDate', startDate);
    }
    if (establishmentId) {
      target.searchParams.set('establishment_id', establishmentId);
    }

    const response = await fetch(target.toString(), { cache: 'no-store' });

    if (!response.ok) {
      console.warn(
        `[upcoming-operational-details] API respondeu ${response.status} para ${target.pathname}`,
      );
      return NextResponse.json(
        { success: false, error: 'Não foi possível carregar os próximos eventos.' },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[upcoming-operational-details] Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Não foi possível carregar os próximos eventos.',
      },
      { status: 500 }
    );
  }
}
