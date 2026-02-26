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

  // Promoters só podem acessar suas páginas dedicadas
  if (isPromoterList) {
    const isPromoterRoute = url.startsWith('/promoter');

    if (!isPromoterRoute) {
      const destino = promoterCodigo
        ? `/promoter/${promoterCodigo}/dashboard`
        : '/promoter';

      console.log(`⛔ Promoter tentando acessar rota não permitida (${url}). Redirecionando para ${destino}`);
      return NextResponse.redirect(new URL(destino, request.url));
    }
  }

  // Define as permissões para as rotas específicas
  const routePermissions: Record<string, string[]> = {
    // Rota principal do admin - permite admin, gerente e recepção
    '/admin': ['admin', 'gerente', 'recepção', 'promoter'],
    
    // Rotas estritamente administrativas (apenas admin)
    '/admin/commodities': ['admin'],
    '/admin/enterprise': ['admin'],
    '/admin/gifts': ['admin'],
    '/admin/users': ['admin'],
    '/admin/workdays': ['admin', 'promoter'],
    '/admin/places': ['admin'],
    '/admin/tables': ['admin'],
    
    // Rotas que gerentes e promoters (ex: analista.mkt03 - Pracinha) podem acessar
    '/admin/eventos': ['admin', 'gerente', 'promoter'],
    '/admin/painel-eventos': ['admin', 'gerente', 'promoter'],
    '/admin/eventos/dashboard': ['admin', 'gerente', 'promoter'],
    
    // Outras rotas internas controladas
    '/admin/cardapio': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/events': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/reservas': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/qrcode': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/checkins': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/restaurant-reservations': ['admin', 'promoter', 'recepção', 'gerente'],
    '/admin/detalhes-operacionais': ['admin', 'recepção', 'gerente'],
  };

  // Verifica se a rota está definida nas permissões de rota
  const matchedRoute = Object.keys(routePermissions).find(route => url.startsWith(route));
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
