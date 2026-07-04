/**
 * Regras de middleware /admin — roles globais (JWT cookie).
 * Checagem fina de módulo fica no AdminPageGate + API.
 */

import {
  canonicalSessionRole,
  rolesMatchForAccess,
} from "./adminRole";

const RECEPTION_ROLES = ["recepção", "recepcao", "atendente"] as const;

/** Rotas /admin → roles permitidos (sem listas de e-mail). */
export const ADMIN_ROUTE_ROLES: Record<string, string[]> = {
  "/admin": ["admin", "gerente", ...RECEPTION_ROLES, "promoter", "promoter-list"],
  "/admin/commodities": ["admin"],
  "/admin/enterprise": ["admin"],
  "/admin/gifts": ["admin"],
  "/admin/users": ["admin"],
  "/admin/equipe": ["admin"],
  "/admin/workdays": ["admin", "gerente", "promoter", "promoter-list"],
  "/admin/places": ["admin"],
  "/admin/tables": ["admin"],
  "/admin/eventos": ["admin", "gerente", ...RECEPTION_ROLES, "promoter", "promoter-list"],
  "/admin/painel-eventos": ["admin", "gerente", "promoter", "promoter-list"],
  "/admin/cardapio": ["admin", "gerente", ...RECEPTION_ROLES, "promoter", "promoter-list"],
  "/admin/eventos/dashboard": ["admin", "gerente", "promoter", "promoter-list", ...RECEPTION_ROLES],
  "/admin/events": ["admin", "gerente", "promoter", "promoter-list", ...RECEPTION_ROLES],
  "/admin/reservas": ["admin"],
  "/admin/qrcode": ["admin", "gerente", "promoter", "promoter-list", ...RECEPTION_ROLES],
  "/admin/checkins": ["admin", "gerente", "promoter", "promoter-list", ...RECEPTION_ROLES],
  "/admin/restaurant-reservations": ["admin", "gerente", "promoter", "promoter-list", ...RECEPTION_ROLES],
  "/admin/detalhes-operacionais": ["admin", "gerente", ...RECEPTION_ROLES],
  "/admin/estabelecimentos": ["admin", "gerente", ...RECEPTION_ROLES, "administrador"],
  "/admin/guia": ["admin", "gerente", ...RECEPTION_ROLES, "promoter", "promoter-list"],
  "/admin/whatsapp": ["admin", "gerente", ...RECEPTION_ROLES, "atendente", "hostess"],
  "/admin/logs": ["admin", "gerente", ...RECEPTION_ROLES, "promoter", "promoter-list"],
  "/admin/relatorios-gerador": ["admin"],
  "/admin/galeria": ["admin"],
};

export function matchAdminRouteRoles(pathname: string): string[] | null {
  const matched = Object.keys(ADMIN_ROUTE_ROLES)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  return matched ? ADMIN_ROUTE_ROLES[matched] : null;
}

export function roleAllowedForAdminPath(pathname: string, roleRaw: string): boolean {
  const allowedRoles = matchAdminRouteRoles(pathname);
  if (!allowedRoles) return true;
  const roleNorm = canonicalSessionRole(roleRaw);
  return allowedRoles.some((r) => rolesMatchForAccess(r, roleNorm));
}
