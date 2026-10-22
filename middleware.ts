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

const BI_HOST = 'bi.agilizaiapp.com.br';

function requestHostname(request: NextRequest) {
  const headerHost = request.headers.get('host');
  if (headerHost) {
    return headerHost.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  }
  return request.nextUrl.hostname.toLowerCase();
}

/** Rotas que o matcher antigo já protegia. O restante segue sem login. */
function isLegacyProtectedPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/superadmin' ||
    pathname.startsWith('/superadmin/') ||
    pathname.startsWith('/gerente/') ||
    pathname.startsWith('/cliente/')
  );
}

function rewriteBiHost(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/bi-justino/') || pathname === '/bi-justino') {
    if (pathname === '/bi-justino' || pathname === '/bi-justino/') {
      const indexUrl = request.nextUrl.clone();
      indexUrl.pathname = '/bi-justino/index.html';
      return NextResponse.rewrite(indexUrl);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  // public/ não entrega index.html de diretório; /bi-justino sozinho responderia 404.
  url.pathname = pathname === '/' ? '/bi-justino/index.html' : `/bi-justino${pathname}`;
  return NextResponse.rewrite(url);
}

export function middleware(request: NextRequest) {
  const host = requestHostname(request);
  const pathname = request.nextUrl.pathname;

  if (host === BI_HOST) {
    return rewriteBiHost(request);
  }

  if (!isLegacyProtectedPath(pathname)) {
    return NextResponse.next();
  }

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
    '/',
    '/bi-justino',
    '/bi-justino/:path*',
    '/admin',
    '/admin/:path*',
    '/superadmin',
    '/superadmin/:path*',
    '/gerente/:path*',
    '/cliente/:path*',
    // /manual-index.js e /bi-agilizai.js são pedidos na raiz do host BI
    // (o rewrite não muda a URL do navegador). Fora desse host, o early-return
    // devolve next() antes de qualquer redirect de login.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
