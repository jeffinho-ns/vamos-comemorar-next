/**
 * IDs operacionais — Reserva Rooftop (legado) vs Reserva Pinheiros (novo).
 * Migration 2026-09-02 (Render prod): Pinheiros place 21, bar 18.
 */

export const RESERVA_ROOFTOP_PLACE_ID = 9;
export const RESERVA_ROOFTOP_BAR_ID = 5;
export const RESERVA_PINHEIROS_PLACE_ID = 21;
export const RESERVA_PINHEIROS_BAR_ID = 18;

/** Resolve place id do Pinheiros a partir da lista de places da API (fallback: constante). */
export function resolveReservaPinheirosPlaceIdFromPlaces(
  places: Array<{ id?: number | string; slug?: string | null; name?: string | null }>,
): number {
  const match = places.find((p) => {
    const slug = String(p.slug || "").toLowerCase();
    const name = String(p.name || "").toLowerCase();
    return slug === "reserva-pinheiros" || name.includes("reserva pinheiros");
  });
  const id = Number(match?.id);
  return Number.isFinite(id) && id > 0 ? id : RESERVA_PINHEIROS_PLACE_ID;
}

export function isReservaRooftopPlaceId(id: number | string | null | undefined): boolean {
  const n = Number(id);
  return n === RESERVA_ROOFTOP_PLACE_ID || n === RESERVA_ROOFTOP_BAR_ID;
}

export function isReservaPinheirosPlaceId(id: number | string | null | undefined): boolean {
  const n = Number(id);
  return n === RESERVA_PINHEIROS_PLACE_ID || n === RESERVA_PINHEIROS_BAR_ID;
}
