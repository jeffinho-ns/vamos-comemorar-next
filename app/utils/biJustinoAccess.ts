/** Mesma lista da API (services/biJustino/access.js). Não abre o BI para a equipe inteira. */
const BI_JUSTINO_EMAILS = new Set([
  "renatocury@ideiaum.com.br",
  "renato@seujustino.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "luisfelipe@ideiaum.com.br",
  "gabrielmenda@ideiaum.com.br",
]);

export function canAccessBiJustino(email?: string | null): boolean {
  return BI_JUSTINO_EMAILS.has((email || "").trim().toLowerCase());
}
