/**
 * Perfis de admin identificados por e-mail (legado, pré-memberships).
 * Compartilhado entre middleware, login e layout admin.
 */

export const ROOFTOP_FLUXO_EMAILS = new Set([
  "recepcao@reservarooftop.com.br",
  "gerente.maitre@reservarooftop.com.br",
  "diego.gomes@reservarooftop.com.br",
  "vbs14@hotmail.com",
  "reservas@reservarooftop.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "analista.mkt02@ideiaum.com.br",
]);

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

export function isRooftopFluxoEmail(email: string | null | undefined): boolean {
  return ROOFTOP_FLUXO_EMAILS.has(normalizeAdminEmail(email));
}
