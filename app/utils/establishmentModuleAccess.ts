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
 * caso as telas gerais liberam tudo. A lista do atendimento não usa essa
 * exceção: sem o módulo WhatsApp a casa não aparece.
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

type OperationalCatalogItem = WithModules & {
  id?: string | number;
  name?: string;
  email?: string;
  /** Cardápio usa outro id. No atendimento fica só o cadastro da casa. */
  catalogSource?: "place" | "bar" | null;
};

function canonicalHouseKey(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (normalized === "high line bar" || normalized === "high line" || normalized === "highline") {
    return "highline";
  }
  return normalized;
}

function hasRealEmail(email: string | undefined): boolean {
  const value = String(email || "").trim().toLowerCase();
  return value !== "" && value !== "não informado" && value !== "nao informado";
}

function prefers(candidate: OperationalCatalogItem, current: OperationalCatalogItem): boolean {
  const candidateScore =
    (candidate.catalogSource === "place" ? 4 : 0) + (hasRealEmail(candidate.email) ? 2 : 0);
  const currentScore =
    (current.catalogSource === "place" ? 4 : 0) + (hasRealEmail(current.email) ? 2 : 0);
  return candidateScore > currentScore;
}

/**
 * Casas de um módulo operacional, uma vez cada.
 * O cardápio entra na lista geral com outro id (High Line Bar x HighLine).
 * Aqui só fica o cadastro da casa, e só se o módulo estiver ligado.
 */
export function establishmentsForModule<T extends OperationalCatalogItem>(
  establishments: T[],
  moduleKey: string,
): T[] {
  const byHouse = new Map<string, T>();
  for (const establishment of establishments) {
    if (establishment.catalogSource === "bar") continue;
    const modules = normalizeModules(establishment);
    if (modules == null || !modules.includes(moduleKey)) continue;
    const key = canonicalHouseKey(String(establishment.name || establishment.id || ""));
    if (!key) continue;
    const current = byHouse.get(key);
    if (!current || prefers(establishment, current)) byHouse.set(key, establishment);
  }
  return Array.from(byHouse.values());
}
