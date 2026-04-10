import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROMOTER_ONLY_EMAILS = new Set([
  'montoya@ideiaum.com.br',
  'golin@ideiaum.com.br',
  'juliosolto@ideiaum.com.br',
  'renans@ideiaum.com.br',
  'renato@ideiaum.com.br',
  'luisfelipe@ideiaum.com.br',
]);

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('role')?.value;
  const promoterCodigo = request.cookies.get('promoterCodigo')?.value;
  const userEmailRaw = request.cookies.get('userEmail')?.value || '';
  const url = request.nextUrl.pathname;

  // Se não houver token ou role, redireciona para login
  if (!token || !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // LIBERAÇÃO TOTAL: /admin/checkins/rooftop-fluxo - qualquer usuário logado pode acessar
  if (url.startsWith('/admin/checkins/rooftop-fluxo')) {
    return NextResponse.next();
  }

  const safeDecodeURIComponent = (value: string) => {
    try { return decodeURIComponent(value); } catch { return value; }
  };
  const _roleNorm = (role ? safeDecodeURIComponent(role) : role || '').toLowerCase().trim();
  const userEmail = safeDecodeURIComponent(userEmailRaw).toLowerCase().trim();
  const isPromoterOnlyEmail = PROMOTER_ONLY_EMAILS.has(userEmail);
  const SUPER_ADMIN_EMAILS = new Set(['teste@teste', 'jeffinho_ns@hotmail.com']);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.has(userEmail);
  const CARDAPIO_ONLY_EMAILS = new Set([
    'vinicius.gomes@ideiaum.com.br',
  ]);
  const isCardapioOnlyUser = CARDAPIO_ONLY_EMAILS.has(userEmail);

  if (isCardapioOnlyUser) {
    const isCardapioRoute =
      url === '/admin/cardapio' || url.startsWith('/admin/cardapio/');

    if (url === '/admin' || url === '/admin/') {
      return NextResponse.redirect(new URL('/admin/cardapio', request.url));
    }

    if (!isCardapioRoute) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
  }

  const isPromoter = _roleNorm === 'promoter';
  const isPromoterList = _roleNorm === 'promoter-list';

  if (isPromoterOnlyEmail) {
    const isPromoterRoute = url.startsWith('/promoter');
    const destino = promoterCodigo
      ? `/promoter/${promoterCodigo}/dashboard`
      : '/promoter';

    if (!isPromoterRoute || url === '/admin' || url.startsWith('/admin/')) {
      return NextResponse.redirect(new URL(destino, request.url));
    }
  }

  // promoter-list: redirecionar para /promoter apenas se NÃO estiver acessando /admin (analista.mkt03 acessa /admin)
  if (isPromoterList) {
    const isPromoterRoute = url.startsWith('/promoter');
    const isAdminRoute = url.startsWith('/admin');

    if (!isPromoterRoute && !isAdminRoute) {
      const destino = promoterCodigo
        ? `/promoter/${promoterCodigo}/dashboard`
        : '/promoter';

      console.log(`⛔ Promoter-list tentando acessar rota não permitida (${url}). Redirecionando para ${destino}`);
      return NextResponse.redirect(new URL(destino, request.url));
    }
  }

  // /admin/reservas: apenas Super Admins
  if (url === '/admin/reservas' || url.startsWith('/admin/reservas/')) {
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url));
    }
  }

  // Define as permissões para as rotas específicas (promoter e promoter-list para analista.mkt03 - Pracinha)
  const routePermissions: Record<string, string[]> = {
    // Rota principal do admin
    '/admin': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', 'promoter', 'promoter-list'],
    '/admin/commodities': ['admin'],
    '/admin/enterprise': ['admin'],
    '/admin/gifts': ['admin'],
    '/admin/users': ['admin'],
    '/admin/workdays': ['admin', 'promoter', 'promoter-list'],
    '/admin/places': ['admin'],
    '/admin/tables': ['admin'],
    '/admin/eventos': ['admin', 'gerente', 'promoter', 'promoter-list'],
    '/admin/painel-eventos': ['admin', 'gerente', 'promoter', 'promoter-list'],
    '/admin/eventos/dashboard': ['admin', 'gerente', 'promoter', 'promoter-list'],
    '/admin/cardapio': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/events': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/reservas': ['admin'],
    '/admin/qrcode': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/checkins': ['admin', 'promoter', 'promoter-list', 'recepção', 'recepcao', 'atendente', 'gerente'],
    '/admin/restaurant-reservations': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/detalhes-operacionais': ['admin', 'recepção', 'gerente'],
    '/admin/guia': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', 'promoter', 'promoter-list'],
    '/admin/logs': ['admin', 'gerente', 'recepção', 'recepcao', 'atendente', 'promoter', 'promoter-list'],
    '/admin/relatorios-gerador': ['admin'],
  };

  // Verifica a rota mais específica (maior prefixo que bate) para aplicar as permissões corretas
  const matchedRoute = Object.keys(routePermissions)
    .filter(route => url.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  const allowedRoles = matchedRoute ? routePermissions[matchedRoute] : null;
  

  // Verifica se o papel do usuário tem permissão (comparação case-insensitive)
  const roleAllowed = allowedRoles && allowedRoles.some((r) => (r || '').toLowerCase().trim() === _roleNorm);

  if (allowedRoles && !roleAllowed) {
    return NextResponse.redirect(new URL('/acesso-negado', request.url));
  }

  return NextResponse.next();
}

// Define as rotas que serão protegidas pelo middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/gerente/:path*',
    '/promoter/:path*',
    '/cliente/:path*',
  ],
};
