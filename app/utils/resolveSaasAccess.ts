import { isSaasModeEnabled } from "./saasMode";

/** Combina entitlements SaaS com fallback legado (UEP) durante a transição. */
export function resolveSaasModuleAccess(
  moduleKey: string,
  legacyAllowed: boolean,
  opts: {
    allowAll: boolean;
    legacyScoped?: boolean;
    canModule: (key: string) => boolean;
    canPermission?: (key: string) => boolean;
  },
): boolean {
  if (!isSaasModeEnabled() || opts.allowAll) return legacyAllowed;
  if (!opts.canModule(moduleKey)) return false;
  if (legacyAllowed || opts.legacyScoped) return true;
  const readPerm = `${moduleKey}:read`;
  if (opts.canPermission?.(readPerm)) return true;
  return false;
}

export function resolveSaasPermissionAccess(
  permissionKey: string,
  legacyAllowed: boolean,
  opts: {
    allowAll: boolean;
    legacyScoped?: boolean;
    canPermission: (key: string) => boolean;
  },
): boolean {
  if (!isSaasModeEnabled() || opts.allowAll) return legacyAllowed;
  if (legacyAllowed || opts.legacyScoped) return true;
  return opts.canPermission(permissionKey);
}
