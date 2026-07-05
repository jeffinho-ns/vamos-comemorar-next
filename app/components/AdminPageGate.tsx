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
import { pathAllowedByEntitlements } from "../utils/adminRouteModules";
import { isSaasModeEnabled } from "../utils/saasMode";

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

  const saasOn = isSaasModeEnabled();
  const hasUepCheckin = myEstablishmentPermissions.some(
    (p) => p.is_active !== false && p.can_manage_checkins,
  );
  const allowedByEntitlements = pathAllowedByEntitlements(pathname, canModule, canPermission, {
    allowAll: !saasOn || entitlements.allowAll,
    legacyScoped: entitlements.legacyScoped === true,
    permissions: entitlements.permissions,
  });
  const allowed =
    allowedByEntitlements || (hasUepCheckin && isCheckinAdminPath(pathname));

  useEffect(() => {
    if (!saasOn || loading || allowed) return;
    router.replace("/acesso-negado");
  }, [saasOn, loading, allowed, router]);

  if (saasOn && loading && !entitlements.allowAll && !entitlements.legacyScoped && !hasUepCheckin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Carregando permissões…
      </div>
    );
  }

  if (saasOn && !loading && !allowed && !entitlements.legacyScoped) {
    return null;
  }

  return <>{children}</>;
}

export default AdminPageGate;
