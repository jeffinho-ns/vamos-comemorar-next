import type { MyEstablishmentPermission } from "../hooks/useUserPermissions";

type PermRow = Pick<
  MyEstablishmentPermission,
  | "is_active"
  | "can_manage_reservations"
  | "can_manage_checkins"
  | "can_manage_whatsapp"
  | "can_configure_ia"
  | "can_view_cardapio"
  | "can_create_cardapio"
  | "can_edit_cardapio"
  | "can_delete_cardapio"
  | "can_view_os"
  | "can_create_os"
  | "can_edit_os"
  | "can_view_operational_detail"
  | "can_view_reports"
>;

const MODULE_UEP_CHECK: Record<string, (p: PermRow) => boolean> = {
  reservas: (p) => !!p.can_manage_reservations,
  checkin: (p) => !!p.can_manage_checkins,
  cardapio: (p) =>
    p.can_view_cardapio !== false &&
    (!!p.can_view_cardapio ||
      !!p.can_create_cardapio ||
      !!p.can_edit_cardapio ||
      !!p.can_delete_cardapio),
  whatsapp: (p) => !!p.can_manage_whatsapp || !!p.can_manage_reservations,
  eventos: (p) =>
    !!p.can_view_os ||
    !!p.can_create_os ||
    !!p.can_edit_os ||
    !!p.can_view_operational_detail,
  promoters: (p) =>
    !!p.can_view_os ||
    !!p.can_manage_reservations ||
    !!p.can_manage_checkins,
  relatorios: (p) => !!p.can_view_reports,
};

export function uepAllowsModule(
  moduleKey: string,
  permissions: PermRow[],
): boolean {
  const check = MODULE_UEP_CHECK[moduleKey];
  if (!check) return false;
  return permissions.some((p) => p.is_active !== false && check(p));
}

export function uepAllowsNavHref(
  href: string,
  moduleKey: string,
  permissions: PermRow[],
): boolean {
  return uepAllowsModule(moduleKey, permissions);
}
