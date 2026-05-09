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

/** Igual à página de reservas: places usa `name`; check-ins legado usa `nome`. */
export function establishmentDisplayLabel(e: {
  nome?: string | null;
  name?: string | null;
}): string {
  if (typeof e.name === "string" && e.name.trim() !== "") return e.name;
  if (typeof e.nome === "string" && e.nome.trim() !== "") return e.nome;
  return "";
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

/**
 * Eventos ligados ao estabelecimento: pelo `establishment_id` da API (ex.: Highline = 7).
 * Não usar pareamento só por nome — evita eventos do Highline ao escolher Sitio Ilha.
 *
 * Fallback por nome só quando o evento não tem id numérico válido (> 0).
 */
export function eventBelongsToSelectedCheckinVenue(
  event: { establishment_id: number; establishment_name?: string | null },
  selectedId: number,
  selectedName: string,
  normalize: (s: string) => string,
): boolean {
  const sid = Number(selectedId);
  if (!Number.isFinite(sid) || sid <= 0) return false;

  const rawEid = Number(event.establishment_id);
  if (Number.isFinite(rawEid) && rawEid > 0) {
    return rawEid === sid;
  }

  const en = normalize(event.establishment_name || "");
  const sn = normalize(selectedName || "");
  return en === sn && en !== "";
}

/** Remove Sitio Ilha da lista de check-in (só cardápio). Nunca remove o place id 7 (Highline). */
export function filterSitioIlhaOutOfCheckins<
  T extends { id: number; nome?: string; name?: string },
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
    if (isSitioIlhaEstablishmentName(establishmentDisplayLabel(e))) return false;
    return true;
  });
}

/** Override Regiane: Seu Justino + Highline apenas (não Sitio Ilha). */
export function isTemporaryRegianeCheckinsVenue(est: {
  id: number;
  nome?: string;
  name?: string;
}): boolean {
  if (Number(est.id) === 1) return true;
  return isHighlineEstablishmentForOps(est.id, establishmentDisplayLabel(est));
}
