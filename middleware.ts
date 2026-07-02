import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isBarAnalystEmail,
  resolveEventPromoterDashboardPath,
  shouldUseEventPromoterPortal,
} from './app/utils/promoterPortalAccess';
import { isRooftopFluxoEmail } from './app/utils/adminProfileEmails';

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const roleRaw = request.cookies.get('role')?.value;
  const promoterCodigoRaw = request.cookies.get('promoterCodigo')?.value;
  const userEmailRaw = request.cookies.get('userEmail')?.value || '';
  const url = request.nextUrl.pathname;

  if (!token || !roleRaw) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (url.startsWith('/admin/checkins/rooftop-fluxo')) {
    return NextResponse.next();
  }

  const roleNorm = safeDecodeURIComponent(roleRaw).toLowerCase().trim();
  const userEmail = safeDecodeURIComponent(userEmailRaw).toLowerCase().trim();
  const promoterCodigo = promoterCodigoRaw
    ? safeDecodeURIComponent(promoterCodigoRaw).trim()
    : '';

  const SUPER_ADMIN_EMAILS = new Set(['teste@teste', 'jeffinho_ns@hotmail.com']);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.has(userEmail);

  const CARDAPIO_ONLY_EMAILS = new Set(['vinicius.gomes@ideiaum.com.br']);
  if (CARDAPIO_ONLY_EMAILS.has(userEmail)) {
    const isCardapioRoute =
      url === '/admin/cardapio' || url.startsWith('/admin/cardapio/');
    if (url === '/admin' || url === '/admin/') {
      return NextResponse.redirect(new URL('/admin/cardapio', request.url));
    }
    if (!isCardapioRoute) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
  }

  const isEventPromoterPortal = shouldUseEventPromoterPortal(
    roleNorm,
    userEmail,
    promoterCodigo,
  );

  // Promoters de evento: nunca /admin — sempre o dashboard de convidados.
  if (isEventPromoterPortal && url.startsWith('/admin')) {
    return NextResponse.redirect(
      new URL(resolveEventPromoterDashboardPath(promoterCodigo), request.url),
    );
  }

  if (url === '/admin/reservas' || url.startsWith('/admin/reservas/')) {
    if (!isSuperAdmin) {
      if (isEventPromoterPortal && promoterCodigo) {
        return NextResponse.redirect(
          new URL(resolveEventPromoterDashboardPath(promoterCodigo), request.url),
        );
      }
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
  }

  if (isSuperAdmin && url.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Reserva Rooftop (fluxo dedicado): perfil por e-mail, independente do role no JWT.
  if (isRooftopFluxoEmail(userEmail) && url.startsWith('/admin')) {
    return NextResponse.next();
  }

  const staffPromoterRoles = isBarAnalystEmail(userEmail)
    ? ['promoter', 'promoter-list']
    : [];

  const routePermissions: Record<string, string[]> = {
    '/admin': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', ...staffPromoterRoles],
    '/admin/commodities': ['admin'],
    '/admin/enterprise': ['admin'],
    '/admin/gifts': ['admin'],
    '/admin/users': ['admin'],
    '/admin/workdays': ['admin', ...staffPromoterRoles],
    '/admin/places': ['admin'],
    '/admin/tables': ['admin'],
    '/admin/eventos': ['admin', 'gerente', ...staffPromoterRoles],
    '/admin/painel-eventos': ['admin', 'gerente', ...staffPromoterRoles],
    '/admin/cardapio': ['admin', ...staffPromoterRoles, 'recepção', 'recepcao', 'atendente', 'gerente'],
    '/admin/eventos/dashboard': ['admin', 'gerente', ...staffPromoterRoles, 'recepção', 'recepcao', 'atendente'],
    '/admin/events': ['admin', ...staffPromoterRoles, 'recepção', 'gerente'],
    '/admin/reservas': ['admin'],
    '/admin/qrcode': ['admin', ...staffPromoterRoles, 'recepção', 'recepcao', 'atendente', 'gerente'],
    '/admin/checkins': ['admin', ...staffPromoterRoles, 'recepção', 'recepcao', 'atendente', 'gerente'],
    '/admin/restaurant-reservations': ['admin', ...staffPromoterRoles, 'recepção', 'gerente'],
    '/admin/detalhes-operacionais': ['admin', 'recepção', 'gerente'],
    '/admin/estabelecimentos': ['admin', 'gerente', 'recepção', 'recepcao', 'administrador'],
    '/admin/guia': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', ...staffPromoterRoles],
    '/admin/whatsapp': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', 'hostess'],
    '/admin/logs': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', ...staffPromoterRoles],
    '/admin/relatorios-gerador': ['admin'],
  };

  const matchedRoute = Object.keys(routePermissions)
    .filter((route) => url.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  const allowedRoles = matchedRoute ? routePermissions[matchedRoute] : null;
  const roleAllowed =
    allowedRoles &&
    allowedRoles.some((r) => (r || '').toLowerCase().trim() === roleNorm);

  if (allowedRoles && !roleAllowed) {
    if (isEventPromoterPortal && promoterCodigo) {
      return NextResponse.redirect(
        new URL(resolveEventPromoterDashboardPath(promoterCodigo), request.url),
      );
    }
    return NextResponse.redirect(new URL('/acesso-negado', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/gerente/:path*',
    '/promoter/:path*',
    '/cliente/:path*',
  ],
};
