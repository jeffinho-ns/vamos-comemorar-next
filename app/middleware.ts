import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('role')?.value;
  const promoterCodigo = request.cookies.get('promoterCodigo')?.value;
  const url = request.nextUrl.pathname;

  // 🔍 DEBUG
  console.log("🔍 Middleware DEBUG");
  console.log("Token:", token);
  console.log("Role:", role);
  console.log("Pathname:", url);

  // Se não houver token ou role, redireciona para login
  if (!token || !role) {
    console.log("🔁 Redirecionando para /login por falta de token ou role.");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isPromoter = role === 'promoter';
  const isPromoterList = role === 'promoter-list';

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

  // Define as permissões para as rotas específicas (promoter e promoter-list para analista.mkt03 - Pracinha)
  const routePermissions: Record<string, string[]> = {
    // Rota principal do admin
    '/admin': ['admin', 'gerente', 'recepção', 'promoter', 'promoter-list'],
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
    '/admin/reservas': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/qrcode': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/checkins': ['admin', 'promoter', 'promoter-list', 'recepção', 'recepcao', 'atendente', 'gerente'],
    '/admin/restaurant-reservations': ['admin', 'promoter', 'promoter-list', 'recepção', 'gerente'],
    '/admin/detalhes-operacionais': ['admin', 'recepção', 'gerente'],
  };

  // Verifica a rota mais específica (maior prefixo que bate) para aplicar as permissões corretas
  const matchedRoute = Object.keys(routePermissions)
    .filter(route => url.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  const allowedRoles = matchedRoute ? routePermissions[matchedRoute] : null;
  

  // Verifica se o papel do usuário tem permissão para acessar a rota
  const roleAllowed = allowedRoles && allowedRoles.includes(role);

  if (allowedRoles && !roleAllowed) {
    console.log("⛔ Acesso negado. Role:", role, "| URL:", url);
    return NextResponse.redirect(new URL('/acesso-negado', request.url));
  }

  console.log("✅ Acesso liberado");
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
