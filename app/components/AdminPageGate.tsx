"use client";

/**
 * Protege páginas /admin por módulo/permissão (Bloco D).
 * Fail-open quando SAAS off ou legacyScoped (UEP sem memberships).
 */

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCan } from "../hooks/useCan";
import { useEntitlements } from "../context/EntitlementsContext";
import { pathAllowedByEntitlements } from "../utils/adminRouteModules";
import { isSaasModeEnabled } from "../utils/saasMode";

export function AdminPageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canModule, canPermission, loading } = useCan();
  const { entitlements } = useEntitlements();

  const saasOn = isSaasModeEnabled();
  const allowed = pathAllowedByEntitlements(pathname, canModule, canPermission, {
    allowAll: !saasOn || entitlements.allowAll,
    legacyScoped: entitlements.legacyScoped === true,
    permissions: entitlements.permissions,
  });

  useEffect(() => {
    if (!saasOn || loading || allowed) return;
    router.replace("/acesso-negado");
  }, [saasOn, loading, allowed, router]);

  if (saasOn && loading && !entitlements.allowAll && !entitlements.legacyScoped) {
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
