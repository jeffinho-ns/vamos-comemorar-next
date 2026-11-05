"use client";

/**
 * Protege páginas /admin por módulo/permissão (Bloco D).
 * Fail-open quando SAAS off ou legacyScoped (UEP sem memberships).
 */

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCan } from "../hooks/useCan";
import { useEntitlements } from "../context/EntitlementsContext";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { firstAllowedAdminPath, pathAllowedByEntitlements } from "../utils/adminRouteModules";
import { shouldEnforceEntitlements } from "../utils/saasMode";
import { uepAllowsModule } from "../utils/uepModuleAccess";
import { decodeJwtPayload, readSuperAdminFromCookie } from "../utils/superAdminAccess";
import { canAccessBiJustino } from "../utils/biJustinoAccess";
import {
  hasActiveMenuAccess,
  menuAccessIncludes,
  pathAllowedByMenuAccess,
  uepRowsHaveMenuKey,
} from "../config/adminMenuAccess";

function isCheckinAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return (
    path === "/admin/checkins" ||
    path.startsWith("/admin/checkins/") ||
    /^\/admin\/eventos\/[^/]+\/check-ins(\/.*)?$/.test(path)
  );
}

function isJustino360AdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return path === "/admin/justino360" || path.startsWith("/admin/justino360/");
}

function isRhIdeiaAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return path === "/admin/rh-ideia" || path.startsWith("/admin/rh-ideia/");
}

function isSuperAdminOnlyPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return (
    path === "/admin/equipe" ||
    path.startsWith("/admin/equipe/") ||
    path === "/admin/reservas" ||
    path.startsWith("/admin/reservas/")
  );
}

function isBiJustinoPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return path === "/admin/bi-justino" || path.startsWith("/admin/bi-justino/");
}

function readSessionEmail(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)userEmail=([^;]*)/);
  if (match) {
    try {
      const fromCookie = decodeURIComponent(match[1]).trim().toLowerCase();
      if (fromCookie) return fromCookie;
    } catch {
      // segue para localStorage / JWT
    }
  }
  const stored = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  if (stored) return stored;
  const token = localStorage.getItem("authToken") || "";
  const payload = token ? decodeJwtPayload(token) : null;
  return String(payload?.email || "").trim().toLowerCase();
}

export function AdminPageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canModule, canPermission, loading } = useCan();
  const { entitlements } = useEntitlements();
  const { myEstablishmentPermissions } = useUserPermissions();
  const activeUep = myEstablishmentPermissions.filter((p) => p.is_active !== false);
  const isSuperAdmin = readSuperAdminFromCookie();
  const [sessionEmail, setSessionEmail] = useState("");
  const [emailReady, setEmailReady] = useState(false);
  useEffect(() => {
    setSessionEmail(readSessionEmail());
    setEmailReady(true);
  }, []);
  const menuAccess = entitlements.menuAccess;
  const menuRestricted = !isSuperAdmin && hasActiveMenuAccess(menuAccess);
  const biFromMenu = menuAccessIncludes(menuAccess, "bi-justino");
  const biFromUep = uepRowsHaveMenuKey(activeUep, "bi-justino");
  const biAllowed =
    isSuperAdmin ||
    biFromMenu ||
    biFromUep ||
    (!menuRestricted && canAccessBiJustino(sessionEmail));

  const enforceEntitlements = shouldEnforceEntitlements(entitlements);
  const hasUepCheckin = activeUep.some((p) => p.can_manage_checkins);
  const hasUepJustino360 = activeUep.some(
    (p) =>
      p.establishment_id === 1 &&
      (!!p.can_access_justino360 ||
        !!p.can_manage_justino360 ||
        !!p.can_validate_justino360),
  );
  const hasUepRhIdeia = activeUep.some(
    (p) =>
      !!p.can_access_rh_ideia ||
      !!p.can_manage_rh_ideia ||
      !!p.can_validate_rh_ideia,
  );
  const allowedByEntitlements = pathAllowedByEntitlements(pathname, canModule, canPermission, {
    allowAll: !enforceEntitlements || entitlements.allowAll,
    legacyScoped: false,
    permissions: entitlements.permissions,
    isAccountAdmin: entitlements.isAccountAdmin === true,
    isSuperAdmin,
    legacyPathAllowed: (_path, meta) => {
      if (meta.module === "justino360" || meta.module === "rh_ideia") {
        return uepAllowsModule(meta.module, activeUep);
      }
      return uepAllowsModule(meta.module, activeUep) && canModule(meta.module);
    },
  });
  const allowedByMenu =
    !menuRestricted ||
    pathAllowedByMenuAccess(pathname, menuAccess ?? []) ||
    (isBiJustinoPath(pathname) && biAllowed);
  const allowed =
    (allowedByEntitlements ||
      (hasUepCheckin && isCheckinAdminPath(pathname)) ||
      (hasUepJustino360 && isJustino360AdminPath(pathname)) ||
      (hasUepRhIdeia && isRhIdeiaAdminPath(pathname))) &&
    (!isSuperAdminOnlyPath(pathname) || isSuperAdmin) &&
    (!isBiJustinoPath(pathname) || biAllowed) &&
    allowedByMenu;

  useEffect(() => {
    if (isSuperAdminOnlyPath(pathname) && !isSuperAdmin) {
      router.replace("/acesso-negado");
      return;
    }
    if (isBiJustinoPath(pathname)) {
      if (!emailReady) return;
      if (!biAllowed) router.replace("/acesso-negado");
      return;
    }
    if (menuRestricted && !allowedByMenu) {
      router.replace("/admin");
      return;
    }
    if (!enforceEntitlements || loading || allowed) return;
    const fallback = firstAllowedAdminPath(
      canModule,
      entitlements.allowAll,
      canPermission,
    );
    if (fallback && fallback !== pathname) {
      router.replace(fallback);
      return;
    }
    if (pathname === "/admin" || pathname === "/admin/") return;
    router.replace("/admin");
  }, [
    enforceEntitlements,
    loading,
    allowed,
    router,
    canModule,
    entitlements.allowAll,
    pathname,
    isSuperAdmin,
    emailReady,
    biAllowed,
    menuRestricted,
    allowedByMenu,
  ]);

  if (isSuperAdminOnlyPath(pathname) && !isSuperAdmin) {
    return null;
  }

  if (isBiJustinoPath(pathname) && (!emailReady || !biAllowed)) {
    return null;
  }

  if (menuRestricted && !allowedByMenu) {
    return null;
  }

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
