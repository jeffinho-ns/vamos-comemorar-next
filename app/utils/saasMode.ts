/** Modo SaaS ativo no front (build-time env). */
export function isSaasModeEnabled(): boolean {
  return String(process.env.NEXT_PUBLIC_SAAS_MODE || "").toLowerCase() === "on";
}

/** Isola menu/rotas quando a API já devolveu o contrato da organização. */
export function shouldEnforceEntitlements(entitlements?: {
  allowAll?: boolean;
} | null): boolean {
  if (entitlements && entitlements.allowAll === false) return true;
  return isSaasModeEnabled();
}
