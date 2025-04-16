import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('role')?.value;
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

  // Define as permissões para as rotas específicas
  const routePermissions: Record<string, string[]> = {
    '/admin/commodities': ['Administrador'],
    '/admin/enterprise': ['Administrador'],
    '/admin/eventos': ['Administrador', 'Gerente'],
    '/admin/events': ['Administrador', 'Gerente', 'Promoter'],
    '/admin/gifts': ['Administrador', 'Gerente'],
    '/admin/qrcode': ['Administrador'],
    '/admin/reservas': ['Administrador', 'Gerente', 'Promoter'],
    '/admin/users': ['Administrador', 'Gerente'],
    '/admin/workday': ['Administrador', 'Gerente'],
  };

  // Verifica se a rota está definida nas permissões de rota
  const allowedRoles = Object.keys(routePermissions).find(route => url.startsWith(route)) 
    ? routePermissions[url] 
    : null;

  // Verifica se o papel do usuário tem permissão para acessar a rota
  if (allowedRoles && !allowedRoles.includes(role)) {
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
