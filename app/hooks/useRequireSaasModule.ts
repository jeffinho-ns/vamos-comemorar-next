"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSaasAccess } from "./useSaasAccess";
import { useEntitlements } from "../context/EntitlementsContext";
import { shouldEnforceEntitlements } from "../utils/saasMode";
import { firstAllowedAdminPath } from "../utils/adminRouteModules";
import { useCan } from "./useCan";

/**
 * Redireciona para o primeiro módulo contratado. Só cai em /acesso-negado
 * se o usuário autenticado não tiver nenhum módulo e não estiver em /admin.
 */
export function useRequireSaasModule(allowed: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const { entitlementsLoading } = useSaasAccess();
  const { canModule } = useCan();
  const { entitlements } = useEntitlements();
  const { allowAll, legacyScoped } = entitlements;
  const enforce = shouldEnforceEntitlements(entitlements);

  useEffect(() => {
    if (!enforce || entitlementsLoading || allowAll || legacyScoped || allowed) {
      return;
    }
    const fallback = firstAllowedAdminPath(canModule, allowAll);
    if (fallback && fallback !== pathname) {
      router.replace(fallback);
      return;
    }
    if (pathname === "/admin" || pathname === "/admin/") return;
    router.replace("/admin");
  }, [
    enforce,
    entitlementsLoading,
    allowAll,
    legacyScoped,
    allowed,
    router,
    canModule,
    pathname,
  ]);

  const guardLoading =
    enforce && entitlementsLoading && !allowAll && !legacyScoped && !allowed;

  const blocked =
    enforce && !entitlementsLoading && !allowed && !allowAll && !legacyScoped;

  return { guardLoading, blocked };
}
