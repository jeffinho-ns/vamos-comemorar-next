import { shouldEnforceEntitlements } from "./saasMode";

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
  if (!shouldEnforceEntitlements({ allowAll: opts.allowAll }) || opts.allowAll) {
    return legacyAllowed;
  }
  if (!opts.canModule(moduleKey)) return false;
  if (legacyAllowed) return true;
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
    canModule?: (key: string) => boolean;
  },
): boolean {
  if (!shouldEnforceEntitlements({ allowAll: opts.allowAll }) || opts.allowAll) {
    return legacyAllowed;
  }
  const moduleKey = permissionKey.includes(":")
    ? permissionKey.slice(0, permissionKey.indexOf(":"))
    : permissionKey;
  if (opts.canModule && moduleKey && !opts.canModule(moduleKey)) return false;
  if (legacyAllowed || opts.legacyScoped) return true;
  return opts.canPermission(permissionKey);
}
