"use client";

/**
 * Combina useUserPermissions (UEP legado) com useCan (entitlements SaaS).
 */
import { useCan } from "./useCan";
import { useUserPermissions } from "./useUserPermissions";
import {
  resolveSaasModuleAccess,
  resolveSaasPermissionAccess,
} from "../utils/resolveSaasAccess";

export function useSaasAccess() {
  const { canModule, canPermission, allowAll, loading: entitlementsLoading } = useCan();
  const legacy = useUserPermissions();

  const resolveModule = (moduleKey: string, legacyAllowed: boolean) =>
    resolveSaasModuleAccess(moduleKey, legacyAllowed, { allowAll, canModule });

  const resolvePermission = (permissionKey: string, legacyAllowed: boolean) =>
    resolveSaasPermissionAccess(permissionKey, legacyAllowed, { allowAll, canPermission });

  return {
    ...legacy,
    entitlementsLoading,
    allowAll,
    canModule,
    canPermission,
    resolveModule,
    resolvePermission,
    canAccessCardapio: resolveModule("cardapio", legacy.canAccessCardapio),
    canAccessWhatsapp: resolveModule("whatsapp", legacy.canAccessWhatsapp),
    canAccessEventos: resolveModule("eventos", legacy.canAccessAdmin),
    canAccessReservas: resolveModule("reservas", legacy.canAccessAdmin),
    canViewActionLogs: resolvePermission("relatorios:read", legacy.canViewActionLogs),
    canDeleteUsers: resolvePermission("reservas:delete", legacy.canDeleteUsers),
    canEditCardapio: resolvePermission("cardapio:update", legacy.canAccessCardapio),
    canManageReservas: resolvePermission("reservas:update", legacy.canAccessAdmin),
  };
}
