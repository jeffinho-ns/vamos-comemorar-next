import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isBarAnalystEmail,
  resolveEventPromoterDashboardPath,
  shouldUseEventPromoterPortal,
} from './app/utils/promoterPortalAccess';
import { canonicalSessionRole } from './app/utils/adminRole';
import { roleAllowedForAdminPath } from './app/utils/adminMiddlewareAccess';

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

  // Emergencial: as páginas admin usam localStorage para enviar o Bearer token
  // às APIs. Quando o cookie do middleware fica desatualizado, usuários logados
  // são derrubados para /login antes da página carregar. As APIs continuam
  // protegidas por Authorization, então não bloquear /admin no middleware.
  // Rotas /promoter/* (lista de convidados) são públicas — fora do matcher.
  if (url.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (!token || !roleRaw) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userEmail = safeDecodeURIComponent(userEmailRaw).toLowerCase().trim();
  const isSuperAdmin = request.cookies.get('isSuperAdmin')?.value === '1';

  if (url.startsWith('/superadmin')) {
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
    return NextResponse.next();
  }

  const roleNorm = canonicalSessionRole(safeDecodeURIComponent(roleRaw));
  const promoterCodigo = promoterCodigoRaw
    ? safeDecodeURIComponent(promoterCodigoRaw).trim()
    : '';

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

  // Analistas de bar: role efetivo promoter nas rotas admin (legado UEP).
  const effectiveRole =
    isBarAnalystEmail(userEmail) &&
    !['promoter', 'promoter-list'].includes(roleNorm)
      ? 'promoter'
      : roleNorm;

  if (
    url.startsWith('/admin') &&
    !roleAllowedForAdminPath(url, effectiveRole)
  ) {
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
    '/admin',
    '/admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
    '/gerente/:path*',
    '/cliente/:path*',
  ],
};
