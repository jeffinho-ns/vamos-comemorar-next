/**
 * Flags derivadas de establishmentRules (API) com fallback por nome legado.
 */

export type EstablishmentRulesData = {
  establishmentId?: number;
  profile?: string;
  reservations?: {
    maxDaily?: number | null;
    maxPartySize?: number | null;
    areaNamePrefix?: string | null;
    excludeAreaPrefix?: string | null;
    dualShift?: boolean;
    strictHours?: boolean;
    tableBlocking?: string | null;
  };
  cardapio?: { barId?: number };
  events?: { extendedGuestListWindow?: boolean };
};

export type EstablishmentRulesFlags = {
  profile: string;
  isRooftop: boolean;
  isPracinha: boolean;
  isSeuJustino: boolean;
  isHighline: boolean;
  isOhFregues: boolean;
  dualShift: boolean;
  strictHours: boolean;
  maxDaily: number | null;
  maxPartySize: number | null;
  areaNamePrefix: string | null;
  excludeAreaPrefix: string | null;
  extendedGuestListWindow: boolean;
  tableBlocking: string | null;
  fromApi: boolean;
};

function normalizeName(name?: string | null): string {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function inferProfileFromEstablishmentName(name?: string | null): string {
  const lower = normalizeName(name);
  if (lower.includes("rooftop") || lower.includes("reserva rooftop")) return "rooftop";
  if (lower.includes("pracinha")) return "pracinha";
  if (lower.includes("highline") || lower.includes("high line") || lower.includes("high "))
    return "highline";
  if (lower.includes("fregu")) return "oh_fregues";
  if (lower.includes("justino")) return "seu_justino";
  if (lower.includes("ilha")) return "sitio_ilha";
  return "generic";
}

function flagsFromProfile(
  profile: string,
  rules?: EstablishmentRulesData | null,
  fromApi = false,
): EstablishmentRulesFlags {
  const reservations = rules?.reservations || {};
  const events = rules?.events || {};
  return {
    profile,
    isRooftop: profile === "rooftop",
    isPracinha: profile === "pracinha",
    isSeuJustino: profile === "seu_justino",
    isHighline: profile === "highline",
    isOhFregues: profile === "oh_fregues",
    dualShift: !!reservations.dualShift,
    strictHours: !!reservations.strictHours,
    maxDaily:
      reservations.maxDaily != null && Number(reservations.maxDaily) > 0
        ? Number(reservations.maxDaily)
        : null,
    maxPartySize:
      reservations.maxPartySize != null && Number(reservations.maxPartySize) > 0
        ? Number(reservations.maxPartySize)
        : null,
    areaNamePrefix: reservations.areaNamePrefix
      ? String(reservations.areaNamePrefix)
      : null,
    excludeAreaPrefix: reservations.excludeAreaPrefix
      ? String(reservations.excludeAreaPrefix)
      : null,
    extendedGuestListWindow:
      profile === "rooftop" || !!events.extendedGuestListWindow,
    tableBlocking: reservations.tableBlocking
      ? String(reservations.tableBlocking)
      : null,
    fromApi,
  };
}

export function deriveEstablishmentRulesFlags(
  rules: EstablishmentRulesData | null | undefined,
  establishmentName?: string | null,
): EstablishmentRulesFlags {
  const profileFromApi = rules?.profile?.trim().toLowerCase();
  if (profileFromApi) {
    return flagsFromProfile(profileFromApi, rules, true);
  }
  const inferred = inferProfileFromEstablishmentName(establishmentName);
  return flagsFromProfile(inferred, rules, false);
}

/** Rooftop operacional — prioriza profile da API; fallback conservador por nome. */
export function isRooftopEstablishment(
  rules: EstablishmentRulesData | null | undefined,
  establishmentName?: string | null,
): boolean {
  return deriveEstablishmentRulesFlags(rules, establishmentName).isRooftop;
}

export function isSeuJustinoEstablishment(
  rules: EstablishmentRulesData | null | undefined,
  establishmentName?: string | null,
): boolean {
  return deriveEstablishmentRulesFlags(rules, establishmentName).isSeuJustino;
}

/** Telefone fallback por profile (lista pública de estabelecimentos). */
export function fallbackPhoneForEstablishment(
  establishmentName?: string | null,
  rules?: EstablishmentRulesData | null,
): string {
  const flags = deriveEstablishmentRulesFlags(rules, establishmentName);
  if (flags.isHighline) return "(11) 3032-2934";
  if (flags.isRooftop) return "(11) 4280-3345";
  if (flags.isSeuJustino) return "(11) 5200-3650";
  if (flags.isPracinha) return "(11) 2305-0938";
  return "(11) 99999-9999";
}
