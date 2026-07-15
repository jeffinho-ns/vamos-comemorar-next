/**
 * Filtro de funcionalidades por estabelecimento (establishment_modules do SaaS).
 *
 * Cada estabelecimento pode ter um conjunto de módulos habilitados no Super
 * Admin (ex.: "Apê do Pracinha" só com cardápio). A lista chega no front via
 * /api/places e /api/bars no campo `enabled_modules` e é exposta em
 * AppEstablishment.enabledModules.
 *
 * Regra de compatibilidade: enabledModules null/undefined significa que o
 * estabelecimento nunca teve módulos configurados (casas antigas) — nesse
 * caso tudo é liberado.
 */

type WithModules = {
  enabledModules?: string[] | null;
  /** Formato bruto vindo direto de /api/places ou /api/bars. */
  enabled_modules?: unknown;
};

function normalizeModules(establishment: WithModules): string[] | null {
  if (establishment.enabledModules !== undefined) {
    return establishment.enabledModules ?? null;
  }
  const raw = establishment.enabled_modules;
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function establishmentAllowsModule(
  establishment: WithModules | null | undefined,
  moduleKey: string,
): boolean {
  if (!establishment) return true;
  const modules = normalizeModules(establishment);
  if (modules == null) return true;
  return modules.includes(moduleKey);
}

export function filterEstablishmentsByModule<T extends WithModules>(
  establishments: T[],
  moduleKey: string,
): T[] {
  return establishments.filter((est) => establishmentAllowsModule(est, moduleKey));
}
