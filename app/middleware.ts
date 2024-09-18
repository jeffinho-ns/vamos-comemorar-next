import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verifique se o token existe no localStorage
  const token = request.cookies.get('authToken');

  // Se não tiver token, redirecione para a página de login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Defina quais páginas devem passar por essa verificação
export const config = {
  matcher: ['/justino/ :path*', '/webapp/profile/ :path*', '/webapp/ :path*'],  // Exemplo de páginas protegidas
};
