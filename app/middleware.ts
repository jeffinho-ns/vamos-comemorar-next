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
    // Rotas estritamente administrativas
    '/admin/commodities': ['admin'],
    '/admin/enterprise': ['admin'],
    '/admin/eventos': ['admin'],
    '/admin/gifts': ['admin'],
    '/admin/painel-eventos': ['admin'],
    '/admin/users': ['admin'],
    '/admin/workdays': ['admin'],
    '/admin/places': ['admin'],
    '/admin/tables': ['admin'],
    
    // Outras rotas internas controladas
    '/admin/cardapio': ['admin', 'promoter'],
    '/admin/events': ['admin', 'promoter'],
    '/admin/reservas': ['admin', 'promoter'],
    '/admin/qrcode': ['admin', 'promoter'],
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
