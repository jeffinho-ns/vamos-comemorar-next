"use client";

/**
 * Protege páginas /admin por módulo/permissão (Bloco D).
 * Fail-open quando SAAS off ou legacyScoped (UEP sem memberships).
 */

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCan } from "../hooks/useCan";
import { useEntitlements } from "../context/EntitlementsContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { firstAllowedAdminPath, pathAllowedByEntitlements } from "../utils/adminRouteModules";
import { shouldEnforceEntitlements } from "../utils/saasMode";
import { uepAllowsModule } from "../utils/uepModuleAccess";

function isCheckinAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return (
    path === "/admin/checkins" ||
    path.startsWith("/admin/checkins/") ||
    /^\/admin\/eventos\/[^/]+\/check-ins(\/.*)?$/.test(path)
  );
}

export function AdminPageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canModule, canPermission, loading } = useCan();
  const { entitlements } = useEntitlements();
  const { myEstablishmentPermissions } = useUserPermissions();
  const activeUep = myEstablishmentPermissions.filter((p) => p.is_active !== false);

  const enforceEntitlements = shouldEnforceEntitlements(entitlements);
  const hasUepCheckin = activeUep.some((p) => p.can_manage_checkins);
  const allowedByEntitlements = pathAllowedByEntitlements(pathname, canModule, canPermission, {
    allowAll: !enforceEntitlements || entitlements.allowAll,
    legacyScoped: false,
    permissions: entitlements.permissions,
    isAccountAdmin: entitlements.isAccountAdmin === true,
    legacyPathAllowed: (_path, meta) =>
      uepAllowsModule(meta.module, activeUep) && canModule(meta.module),
  });
  const allowed =
    allowedByEntitlements || (hasUepCheckin && isCheckinAdminPath(pathname));

  useEffect(() => {
    if (!enforceEntitlements || loading || allowed) return;
    const fallback = firstAllowedAdminPath(canModule, entitlements.allowAll);
    if (fallback && fallback !== pathname) {
      router.replace(fallback);
      return;
    }
    if (pathname === "/admin" || pathname === "/admin/") return;
    router.replace("/admin");
  }, [enforceEntitlements, loading, allowed, router, canModule, entitlements.allowAll, pathname]);

  if (enforceEntitlements && loading && !entitlements.allowAll && !hasUepCheckin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Carregando permissões…
      </div>
    );
  }

  if (enforceEntitlements && !loading && !allowed) {
    return null;
  }

  return <>{children}</>;
}

export default AdminPageGate;
