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

  const isSuperAdmin = request.cookies.get('isSuperAdmin')?.value === '1';

  // Super Admin SaaS: área /superadmin só com cookie isSuperAdmin=1.
  if (url.startsWith('/superadmin')) {
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
    return NextResponse.next();
  }

  // Rotas /admin sensíveis: exigem Super Admin mesmo sem auth cookie completo
  // (páginas usam Bearer no localStorage; cookie pode estar atrasado).
  const superAdminOnlyAdmin =
    url === '/admin/reservas' ||
    url.startsWith('/admin/reservas/') ||
    url === '/admin/equipe' ||
    url.startsWith('/admin/equipe/');
  if (superAdminOnlyAdmin && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/acesso-negado', request.url));
  }

  // Demais /admin: não bloquear por role no edge (Bearer no localStorage).
  // Isolamento de organização fica na API + AdminPageGate no client.
  if (url.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (!token || !roleRaw) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userEmail = safeDecodeURIComponent(userEmailRaw).toLowerCase().trim();
  const roleNorm = canonicalSessionRole(safeDecodeURIComponent(roleRaw));
  const promoterCodigo = promoterCodigoRaw
    ? safeDecodeURIComponent(promoterCodigoRaw).trim()
    : '';

  const isEventPromoterPortal = shouldUseEventPromoterPortal(
    roleNorm,
    userEmail,
    promoterCodigo,
  );

  if (isEventPromoterPortal) {
    return NextResponse.redirect(
      new URL(resolveEventPromoterDashboardPath(promoterCodigo), request.url),
    );
  }

  const effectiveRole =
    isBarAnalystEmail(userEmail) &&
    !['promoter', 'promoter-list'].includes(roleNorm)
      ? 'promoter'
      : roleNorm;

  if (!roleAllowedForAdminPath(url, effectiveRole)) {
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
