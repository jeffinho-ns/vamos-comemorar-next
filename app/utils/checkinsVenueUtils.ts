/**
 * Check-ins: Highline e Sitio Ilha são estabelecimentos diferentes.
 * Sitio Ilha só tem cardápio — não entra nas telas de check-in / eventos.
 */

import {
  HIGHLINE_PLACE_ID,
  LEGACY_HIGHLINE_PLACE_ID,
  SITIO_ILHA_PLACE_ID,
} from "../config/establishmentIds";

export { HIGHLINE_PLACE_ID, LEGACY_HIGHLINE_PLACE_ID, SITIO_ILHA_PLACE_ID };

export function stripDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isSitioIlhaEstablishmentName(name?: string | null): boolean {
  if (!name) return false;
  const n = stripDiacritics(name.toLowerCase());
  return n.includes("sitio") && n.includes("ilha");
}

/**
 * Highline (reservas/eventos). Id 7 é sempre Highline (cadastro histórico).
 * Sitio Ilha é outro place (ex.: id 10).
 */
export function isHighlineEstablishmentForOps(
  establishmentId: number,
  establishmentName?: string | null,
): boolean {
  const id = Number(establishmentId);
  if (id === HIGHLINE_PLACE_ID) return true;
  if (isSitioIlhaEstablishmentName(establishmentName)) return false;
  const n = stripDiacritics((establishmentName || "").toLowerCase());
  return n.includes("high");
}

/**
 * Mapeamento de mesas estilo Deck — só para Highline (nome com "high", sem ser Sitio Ilha).
 */
export function shouldUseHighlineDeckTableMapping(
  establishmentName?: string | null,
): boolean {
  if (isSitioIlhaEstablishmentName(establishmentName)) return false;
  const n = stripDiacritics((establishmentName || "").toLowerCase());
  return n.includes("high");
}

/** Comparação estrita: mesmo ID ou mesmo nome normalizado (sem cruzar Highline ↔ Sitio Ilha). */
export function eventBelongsToSelectedCheckinVenue(
  event: { establishment_id: number; establishment_name?: string | null },
  selectedId: number,
  selectedName: string,
  normalize: (s: string) => string,
): boolean {
  const eid = Number(event.establishment_id);
  const sid = Number(selectedId);
  if (eid === sid) return true;
  const en = normalize(event.establishment_name || "");
  const sn = normalize(selectedName || "");
  return en === sn && en !== "";
}

/** Remove Sitio Ilha da lista de check-in (só cardápio). Nunca remove o place id 7 (Highline). */
export function filterSitioIlhaOutOfCheckins<
  T extends { id: number; nome: string },
>(lista: T[]): T[] {
  return lista.filter((e) => {
    const id = Number(e.id);
    if (id === HIGHLINE_PLACE_ID) return true;
    if (
      SITIO_ILHA_PLACE_ID != null &&
      !Number.isNaN(SITIO_ILHA_PLACE_ID) &&
      id === SITIO_ILHA_PLACE_ID
    ) {
      return false;
    }
    if (isSitioIlhaEstablishmentName(e.nome)) return false;
    return true;
  });
}

/** Override Regiane: Seu Justino + Highline apenas (não Sitio Ilha). */
export function isTemporaryRegianeCheckinsVenue(est: {
  id: number;
  nome: string;
}): boolean {
  if (Number(est.id) === 1) return true;
  return isHighlineEstablishmentForOps(est.id, est.nome);
}
