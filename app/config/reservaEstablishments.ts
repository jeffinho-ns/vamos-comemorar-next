/**
 * IDs operacionais — Reserva Rooftop (legado) vs Reserva Pinheiros (novo).
 * Migration 2026-09-02 (Render prod): Pinheiros place 21, bar 18.
 */

export const RESERVA_ROOFTOP_PLACE_ID = 9;
export const RESERVA_ROOFTOP_BAR_ID = 5;
export const RESERVA_PINHEIROS_PLACE_ID = 21;
export const RESERVA_PINHEIROS_BAR_ID = 18;

export function canonicalizeReservaEstablishmentId(
  id: number | string | null | undefined,
): number {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return n;
  if (n === RESERVA_ROOFTOP_BAR_ID) return RESERVA_ROOFTOP_PLACE_ID;
  if (n === RESERVA_PINHEIROS_BAR_ID) return RESERVA_PINHEIROS_PLACE_ID;
  return n;
}

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

function normalizeReserveQuery(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Evita "reserva rooftop" casar em Pinheiros (e o contrário) no formulário público. */
export function matchEstablishmentFromReserveQuery<
  T extends { id?: number | string; name?: string | null; slug?: string | null },
>(query: string, places: T[]): T | undefined {
  const q = normalizeReserveQuery(query);
  if (!q || places.length === 0) return undefined;

  const pinheiros = places.find((p) => {
    const slug = String(p.slug || "").toLowerCase();
    const name = normalizeReserveQuery(String(p.name || ""));
    return (
      slug === "reserva-pinheiros" ||
      name.includes("pinheiros") ||
      Number(p.id) === RESERVA_PINHEIROS_PLACE_ID
    );
  });
  const rooftop = places.find((p) => {
    const slug = String(p.slug || "").toLowerCase();
    const name = normalizeReserveQuery(String(p.name || ""));
    if (name.includes("pinheiros")) return false;
    return (
      slug === "reserva-rooftop" ||
      name.includes("reserva rooftop") ||
      Number(p.id) === RESERVA_ROOFTOP_PLACE_ID
    );
  });

  if (q.includes("pinheiros")) return pinheiros;
  if (q.includes("rooftop")) return rooftop;

  return places.find((p) => {
    const name = normalizeReserveQuery(String(p.name || ""));
    const slug = String(p.slug || "").toLowerCase().replace(/-/g, " ");
    return name === q || slug === q || name.includes(q) || q.includes(name);
  });
}
