/**
 * Base pública da API (sem barra final).
 * Produção padrão: domínio atrás do Cloudflare (Render custom domain).
 * Override: NEXT_PUBLIC_API_URL ou NEXT_PUBLIC_API_URL_LOCAL.
 */
const PRODUCTION_FALLBACK = 'https://api.agilizaiapp.com.br';

export function getPublicApiUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : PRODUCTION_FALLBACK);
  return String(raw).replace(/\/+$/, '');
}

/** Socket.IO / mesma origem da API em produção. */
export function getPublicSocketUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL_LOCAL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : PRODUCTION_FALLBACK);
  return String(raw).replace(/\/+$/, '');
}
