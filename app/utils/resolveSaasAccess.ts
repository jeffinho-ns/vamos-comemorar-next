import { isSaasModeEnabled } from "./saasMode";

/** Combina entitlements SaaS com fallback legado (UEP) durante a transição. */
export function resolveSaasModuleAccess(
  moduleKey: string,
  legacyAllowed: boolean,
  opts: {
    allowAll: boolean;
    canModule: (key: string) => boolean;
  },
): boolean {
  if (!isSaasModeEnabled() || opts.allowAll) return legacyAllowed;
  return opts.canModule(moduleKey);
}

export function resolveSaasPermissionAccess(
  permissionKey: string,
  legacyAllowed: boolean,
  opts: {
    allowAll: boolean;
    canPermission: (key: string) => boolean;
  },
): boolean {
  if (!isSaasModeEnabled() || opts.allowAll) return legacyAllowed;
  return opts.canPermission(permissionKey);
}
