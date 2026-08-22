"use client";

/**
 * Combina useUserPermissions (UEP legado) com useCan (entitlements SaaS).
 */
import { useCan } from "./useCan";
import { useUserPermissions } from "./useUserPermissions";
import { useEntitlements } from "../context/EntitlementsContext";
import {
  resolveSaasModuleAccess,
  resolveSaasPermissionAccess,
} from "../utils/resolveSaasAccess";

export function useSaasAccess() {
  const { canModule, canPermission, allowAll, loading: entitlementsLoading } = useCan();
  const { entitlements } = useEntitlements();
  const legacy = useUserPermissions();
  const legacyScoped = entitlements.legacyScoped === true;

  const resolveModule = (moduleKey: string, legacyAllowed: boolean) =>
    resolveSaasModuleAccess(moduleKey, legacyAllowed, {
      allowAll,
      legacyScoped,
      canModule,
      canPermission,
    });

  const resolvePermission = (permissionKey: string, legacyAllowed: boolean) =>
    resolveSaasPermissionAccess(permissionKey, legacyAllowed, {
      allowAll,
      legacyScoped,
      canPermission,
      canModule,
    });

  const isOrgAccountAdmin =
    entitlements.allowAll ||
    entitlements.isAccountAdmin === true ||
    legacy.isSuperAdmin;

  return {
    ...legacy,
    entitlementsLoading,
    allowAll,
    canModule,
    canPermission,
    resolveModule,
    resolvePermission,
    /** Account admin da org (ou super): gerencia funcionários em /admin/users. */
    canManageOrgUsers: isOrgAccountAdmin || resolvePermission("reservas:update", legacy.isAdmin),
    canAccessCardapio: resolveModule("cardapio", legacy.canAccessCardapio),
    canAccessWhatsapp: resolveModule("whatsapp", legacy.canAccessWhatsapp),
    canAccessEventos: resolveModule("eventos", legacy.canAccessAdmin),
    canAccessReservas: resolveModule("reservas", legacy.canAccessAdmin),
    canAccessCheckin:
      resolveModule("checkin", legacy.canAccessAdmin) ||
      legacy.myEstablishmentPermissions.some(
        (p) => p.is_active !== false && p.can_manage_checkins,
      ),
    canAccessRelatorios: resolveModule("relatorios", legacy.canViewActionLogs),
    canAccessJustino360: resolveModule(
      "justino360",
      legacy.myEstablishmentPermissions.some(
        (p) =>
          p.establishment_id === 1 &&
          p.is_active !== false &&
          (!!p.can_access_justino360 ||
            !!p.can_manage_justino360 ||
            legacy.isSuperAdmin ||
            legacy.isAdmin),
      ),
    ),
    canViewActionLogs: resolvePermission("relatorios:read", legacy.canViewActionLogs),
    canDeleteUsers:
      isOrgAccountAdmin || resolvePermission("reservas:delete", legacy.canDeleteUsers),
    canEditCardapio: resolvePermission("cardapio:update", legacy.canAccessCardapio),
    canManageReservas: resolvePermission("reservas:update", legacy.canAccessAdmin),
    canReadReservas: resolvePermission("reservas:read", legacy.canAccessAdmin),
    canManageCheckins: resolvePermission("checkin:update", legacy.canAccessAdmin),
    canManageEventos: resolvePermission("eventos:update", legacy.canAccessAdmin),
  };
}
