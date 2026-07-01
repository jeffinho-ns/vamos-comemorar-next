import { type NextRequest } from "next/server";

/**
 * Repassa a identidade do chamador para a API upstream nos route handlers (proxies).
 *
 * Procura o token no header `Authorization` e, como fallback, no cookie `authToken`
 * (que o login já grava — ver app/utils/authSession.ts). Retorna `{}` quando não há
 * token, preservando exatamente o comportamento anônimo atual.
 *
 * Necessário para o modo SaaS multi-tenant: sem o token, a API não consegue
 * identificar o usuário/tenant (observe/enforce).
 */
export function forwardAuthHeaders(request: NextRequest): Record<string, string> {
  const header = request.headers.get("authorization");
  if (header) return { Authorization: header };
  const cookieToken = request.cookies.get("authToken")?.value;
  if (cookieToken) return { Authorization: `Bearer ${cookieToken}` };
  return {};
}
