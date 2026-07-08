"use client";

/**
 * useCan — checagem de módulo/permissão no front (defesa em profundidade de UI).
 *
 * FAIL-OPEN: enquanto não houver entitlements reais (modo SaaS off), retorna
 * sempre `true`, então a UI atual não muda. A autorização REAL mora na API.
 */

import { useCallback } from "react";
import { useEntitlements } from "../context/EntitlementsContext";

export function useCan() {
  const { entitlements, loading } = useEntitlements();

  const canModule = useCallback(
    (moduleKey: string): boolean => {
      if (entitlements.allowAll || entitlements.legacyScoped) return true;
      if (entitlements.modules.includes(moduleKey)) return true;
      const prefix = `${moduleKey}:`;
      return entitlements.permissions.some((p) => p.startsWith(prefix));
    },
    [entitlements],
  );

  const canPermission = useCallback(
    (permissionKey: string): boolean => {
      if (entitlements.allowAll || entitlements.legacyScoped) return true;
      return entitlements.permissions.includes(permissionKey);
    },
    [entitlements],
  );

  /** Atalho: aceita "modulo" ou "modulo:acao". */
  const can = useCallback(
    (key: string): boolean =>
      key.includes(":") ? canPermission(key) : canModule(key),
    [canModule, canPermission],
  );

  return { can, canModule, canPermission, allowAll: entitlements.allowAll, loading };
}
