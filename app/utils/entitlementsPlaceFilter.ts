import type { Entitlements } from "../context/EntitlementsContext";
import { isSaasModeEnabled } from "./saasMode";

type PlaceLike = { id: number | string };

/**
 * Filtra estabelecimentos pelo escopo SaaS (establishmentIds ou organizationId).
 * Fail-open com allowAll / legacyScoped (espelha sidebar e API).
 */
export function filterPlacesByEntitlements<T extends PlaceLike>(
  places: T[],
  entitlements: Pick<
    Entitlements,
    "allowAll" | "legacyScoped" | "establishmentIds" | "organizationId"
  >,
  getOrgId?: (place: T) => number | null | undefined,
): T[] {
  if (!isSaasModeEnabled() || entitlements.allowAll || entitlements.legacyScoped) {
    return places;
  }

  const ids = entitlements.establishmentIds;
  if (Array.isArray(ids) && ids.length > 0) {
    const allowed = new Set(ids.map(Number));
    return places.filter((p) => allowed.has(Number(p.id)));
  }

  const orgId = entitlements.organizationId;
  if (orgId != null && getOrgId) {
    return places.filter((p) => {
      const placeOrg = getOrgId(p);
      return placeOrg == null || placeOrg === orgId;
    });
  }

  return places;
}
