/**
 * Mesma lista da API (services/biJustino/access.js). Não abre o BI para a equipe inteira.
 * renatocury@ideiaum.com.br é o Renato Cury. renato@ideiaum.com.br (promoter) não entra.
 */
const BI_JUSTINO_EMAILS = new Set([
  "renatocury@ideiaum.com.br",
  "renato@seujustino.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "luisfelipe@ideiaum.com.br",
  "gabrielmenda@ideiaum.com.br",
  "carolline.moreira@ideiaum.com.br",
]);

export function canAccessBiJustino(email?: string | null): boolean {
  return BI_JUSTINO_EMAILS.has((email || "").trim().toLowerCase());
}
