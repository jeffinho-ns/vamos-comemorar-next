/**
 * IDs e slugs — Reserva Rooftop (legado, place 9) vs Reserva Pinheiros (novo).
 * Após migration 2026-09-02, configure NEXT_PUBLIC_RESERVA_PINHEIROS_PLACE_ID.
 */

export const RESERVA_ROOFTOP_PLACE_ID = 9;
export const RESERVA_ROOFTOP_BAR_ID = 5;

export function getReservaPinheirosPlaceIdFromEnv(): number | null {
  const raw = Number(process.env.NEXT_PUBLIC_RESERVA_PINHEIROS_PLACE_ID);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** Resolve place id do Pinheiros a partir da lista de places da API. */
export function resolveReservaPinheirosPlaceIdFromPlaces(
  places: Array<{ id?: number | string; slug?: string | null; name?: string | null }>,
): number | null {
  const fromEnv = getReservaPinheirosPlaceIdFromEnv();
  if (fromEnv) return fromEnv;

  const match = places.find((p) => {
    const slug = String(p.slug || "").toLowerCase();
    const name = String(p.name || "").toLowerCase();
    return slug === "reserva-pinheiros" || name.includes("reserva pinheiros");
  });
  const id = Number(match?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isReservaRooftopPlaceId(id: number | string | null | undefined): boolean {
  const n = Number(id);
  return n === RESERVA_ROOFTOP_PLACE_ID || n === RESERVA_ROOFTOP_BAR_ID;
}

export function isReservaPinheirosPlaceId(
  id: number | string | null | undefined,
  pinheirosPlaceId: number | null,
): boolean {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return false;
  if (pinheirosPlaceId && n === pinheirosPlaceId) return true;
  const fromEnv = getReservaPinheirosPlaceIdFromEnv();
  return fromEnv != null && n === fromEnv;
}
