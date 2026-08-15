import {
  NAV_MODULE_BY_HREF,
  type NavModuleMeta,
} from "../config/adminNavModules";

/** Resolve módulo/permissão para pathname admin (prefixo mais longo). */
export function resolveNavModuleForPath(pathname: string): NavModuleMeta | null {
  const path = pathname.split("?")[0];
  if (/^\/admin\/eventos\/[^/]+\/check-ins(\/.*)?$/.test(path)) {
    return { module: "checkin", requiredPermission: "checkin:read" };
  }
  const matches = Object.entries(NAV_MODULE_BY_HREF)
    .filter(([href]) => path === href || (href !== "/admin" && path.startsWith(href)))
    .sort((a, b) => b[0].length - a[0].length);
  return matches[0]?.[1] ?? null;
}

export function firstAllowedAdminPath(
  canModule: (key: string) => boolean,
  allowAll: boolean,
): string {
  if (allowAll) return "/admin";
  const candidates = [
    "/admin/cardapio",
    "/admin/restaurant-reservations",
    "/admin/checkins",
    "/admin/eventos",
    "/admin/whatsapp",
    "/admin",
  ];
  for (const href of candidates) {
    const meta = NAV_MODULE_BY_HREF[href];
    if (!meta || canModule(meta.module)) return href;
  }
  return "/admin/cardapio";
}

export function pathAllowedByEntitlements(
  pathname: string,
  canModule: (key: string) => boolean,
  canPermission: (key: string) => boolean,
  opts: {
    allowAll: boolean;
    legacyScoped: boolean;
    permissions: string[];
    legacyPathAllowed?: (pathname: string, meta: NavModuleMeta) => boolean;
  },
): boolean {
  if (opts.allowAll || opts.legacyScoped) return true;
  const meta = resolveNavModuleForPath(pathname);
  if (!meta) return true;
  if (opts.legacyPathAllowed?.(pathname, meta)) return true;
  if (!canModule(meta.module)) return false;
  if (
    meta.requiredPermission &&
    opts.permissions.length > 0 &&
    !canPermission(meta.requiredPermission)
  ) {
    return false;
  }
  return true;
}
