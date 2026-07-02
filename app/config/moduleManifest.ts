/**
 * moduleManifest — descrição data-driven dos módulos e itens de menu do admin.
 *
 * ADITIVO: consumido por `filterNavByEntitlements` em `app/admin/layout.tsx`
 * quando `NEXT_PUBLIC_SAAS_MODE=on` (via EntitlementsProvider + useCan).
 */

export interface ModuleDef {
  key: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  /** módulo SaaS necessário para o item aparecer (entitlements). */
  module: string;
  /** permissão RBAC opcional (modulo:acao). */
  requiredPermission?: string;
}

export const MODULES: ModuleDef[] = [
  { key: "reservas", label: "Reservas" },
  { key: "checkin", label: "Check-in" },
  { key: "cardapio", label: "Cardápio" },
  { key: "whatsapp", label: "WhatsApp/IA" },
  { key: "eventos", label: "Eventos" },
  { key: "promoters", label: "Promoters" },
  { key: "relatorios", label: "Relatórios" },
];

/**
 * Mapa dos itens de menu do admin para seus módulos. Reflete os links hoje
 * hardcoded em app/admin/layout.tsx (getNavLinks). Mantido como dado para a
 * futura sidebar data-driven — não consumido ainda.
 */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", module: "reservas" },
  { href: "/admin/restaurant-reservations", label: "Reservas", module: "reservas", requiredPermission: "reservas:read" },
  { href: "/admin/reservas", label: "Reservas (legado)", module: "reservas", requiredPermission: "reservas:read" },
  { href: "/admin/checkins", label: "Check-ins", module: "checkin", requiredPermission: "checkin:read" },
  { href: "/admin/cardapio", label: "Cardápio", module: "cardapio", requiredPermission: "cardapio:read" },
  { href: "/admin/whatsapp", label: "WhatsApp", module: "whatsapp", requiredPermission: "whatsapp:read" },
  { href: "/admin/eventos", label: "Eventos", module: "eventos", requiredPermission: "eventos:read" },
  { href: "/admin/eventos/promoters", label: "Promoters", module: "promoters" },
  { href: "/admin/relatorios-gerador", label: "Relatórios", module: "relatorios", requiredPermission: "relatorios:read" },
  { href: "/admin/galeria", label: "Galeria", module: "cardapio" },
  { href: "/admin/gifts", label: "Brindes", module: "reservas" },
  { href: "/admin/detalhes-operacionais", label: "Detalhes Operacionais", module: "reservas" },
];
