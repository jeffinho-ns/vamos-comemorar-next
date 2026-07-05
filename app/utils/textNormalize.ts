/**
 * Normalização de texto compatível com navegadores antigos (sem \\p{Diacritic}).
 */

export function stripDiacritics(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeForSearch(s: string): string {
  return stripDiacritics(s).toLowerCase().replace(/\s+/g, " ").trim();
}
