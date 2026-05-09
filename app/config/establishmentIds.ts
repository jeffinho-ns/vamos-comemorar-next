/**
 * IDs fixos na tabela `places` (API).
 * Highline permanece no id 7; Sitio Ilha é outro cadastro (cardápio).
 */

/** Highline — eventos, reservas, check-ins. */
export const HIGHLINE_PLACE_ID = 7;

/**
 * Sitio Ilha — id retornado pela migração `2026-05-09_place_sitio_ilha_separate_from_highline.sql` em produção (10).
 * Sobrescreva com NEXT_PUBLIC_SITIO_ILHA_PLACE_ID se o id for outro no seu ambiente.
 */
export const SITIO_ILHA_PLACE_ID =
  typeof process.env.NEXT_PUBLIC_SITIO_ILHA_PLACE_ID === "string" &&
  process.env.NEXT_PUBLIC_SITIO_ILHA_PLACE_ID.trim() !== ""
    ? Number(process.env.NEXT_PUBLIC_SITIO_ILHA_PLACE_ID)
    : 10;

/** Alias histórico — mesmo valor que HIGHLINE_PLACE_ID (7). */
export const LEGACY_HIGHLINE_PLACE_ID = HIGHLINE_PLACE_ID;
