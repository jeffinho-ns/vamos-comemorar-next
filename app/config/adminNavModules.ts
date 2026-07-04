/**
 * Mapeamento href → módulo SaaS para filtragem da sidebar (Fase 4).
 * Links sem entrada aqui permanecem visíveis (fail-open para rotas legadas).
 */

export interface NavModuleMeta {
  module: string;
  requiredPermission?: string;
}

export const NAV_MODULE_BY_HREF: Record<string, NavModuleMeta> = {
  "/admin": { module: "reservas" },
  "/admin/restaurant-reservations": {
    module: "reservas",
    requiredPermission: "reservas:read",
  },
  "/admin/reservas": { module: "reservas", requiredPermission: "reservas:read" },
  "/admin/checkins": { module: "checkin", requiredPermission: "checkin:read" },
  "/admin/checkins/rooftop-fluxo": { module: "checkin" },
  "/admin/cardapio": { module: "cardapio", requiredPermission: "cardapio:read" },
  "/admin/galeria": { module: "cardapio" },
  "/admin/whatsapp": { module: "whatsapp", requiredPermission: "whatsapp:read" },
  "/admin/eventos": { module: "eventos", requiredPermission: "eventos:read" },
  "/admin/eventos/dashboard": { module: "eventos" },
  "/admin/eventos/listas": { module: "eventos" },
  "/admin/eventos/promoters": { module: "promoters" },
  "/admin/painel-eventos": { module: "eventos" },
  "/admin/events": { module: "eventos" },
  "/admin/workdays": { module: "reservas" },
  "/admin/detalhes-operacionais": { module: "reservas" },
  "/admin/qrcode": { module: "checkin" },
  "/admin/guia": { module: "reservas" },
  "/admin/gifts": { module: "reservas" },
  "/admin/enterprise": { module: "reservas" },
  "/admin/commodities": { module: "cardapio" },
  "/admin/users": { module: "reservas" },
  "/admin/equipe": { module: "reservas", requiredPermission: "reservas:update" },
  "/admin/places": { module: "reservas" },
  "/admin/tables": { module: "reservas" },
  "/admin/estabelecimentos": { module: "reservas" },
  "/admin/logs": { module: "relatorios" },
  "/admin/relatorios-gerador": {
    module: "relatorios",
    requiredPermission: "relatorios:read",
  },
  "/admin/permissions": {
    module: "reservas",
    requiredPermission: "reservas:update",
  },
  "/admin/executive-events": { module: "eventos", requiredPermission: "eventos:read" },
  "/admin/eventos/configurar": {
    module: "eventos",
    requiredPermission: "eventos:update",
  },
  "/admin/eventos/aniversarios": { module: "eventos", requiredPermission: "eventos:read" },
  "/admin/eventos/hostess": { module: "eventos", requiredPermission: "eventos:read" },
  "/admin/checkins/tablet": { module: "checkin", requiredPermission: "checkin:update" },
  "/admin/contausuariopage": { module: "reservas" },
};

export function filterNavByEntitlements<T extends { href: string }>(
  links: T[],
  canModule: (moduleKey: string) => boolean,
  canPermission: (permission: string) => boolean,
  allowAll: boolean,
  permissions: string[] = [],
  legacyScoped = false,
): T[] {
  if (allowAll || legacyScoped) return links;
  // Usuários legados (UEP sem memberships): API devolve permissions=[] — não esvaziar sidebar.
  const skipFinePermissions = permissions.length === 0;
  return links.filter((link) => {
    const meta = NAV_MODULE_BY_HREF[link.href];
    if (!meta) return true;
    if (!canModule(meta.module)) return false;
    if (
      meta.requiredPermission &&
      !skipFinePermissions &&
      !canPermission(meta.requiredPermission)
    ) {
      return false;
    }
    return true;
  });
}
