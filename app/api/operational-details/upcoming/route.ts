import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  'https://vamos-comemorar-api.onrender.com';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const startDateParam = url.searchParams.get('startDate');

    let days = DEFAULT_DAYS;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        days = Math.min(parsed, MAX_DAYS);
      }
    }

    let startDate = new Date();
    if (startDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam)) {
      const parsedDate = new Date(`${startDateParam}T00:00:00`);
      if (!Number.isNaN(parsedDate.getTime())) {
        startDate = parsedDate;
      }
    }

    const details: any[] = [];

    for (let i = 0; i < days; i += 1) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const formattedDate = formatDate(currentDate);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/operational-details/date/${formattedDate}`,
          { cache: 'no-store' }
        );

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          console.warn(
            `[upcoming-operational-details] Falha ao obter dados para ${formattedDate}: ${response.status}`
          );
          continue;
        }

        const payload = await response.json();
        if (payload?.success && payload?.data) {
          details.push(payload.data);
        }
      } catch (error) {
        console.error(
          `[upcoming-operational-details] Erro ao buscar dados para ${formattedDate}:`,
          error
        );
      }
    }

    const grouped: Record<string, any[]> = {};

    details.forEach((detail) => {
      const key =
        detail?.establishment_id !== null && detail?.establishment_id !== undefined
          ? String(detail.establishment_id)
          : 'unknown';

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(detail);
    });

    Object.values(grouped).forEach((events) => {
      events.sort((a, b) =>
        (a?.event_date || '').localeCompare(b?.event_date || '')
      );
    });

    const rangeEnd = new Date(startDate);
    rangeEnd.setDate(rangeEnd.getDate() + Math.max(days - 1, 0));

    return NextResponse.json({
      success: true,
      data: grouped,
      total: details.length,
      range: {
        start: formatDate(startDate),
        end: formatDate(rangeEnd),
      },
    });
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

