/**
 * Promoters de EVENTO (tabela `promoters`, portal /promoter/{codigo}) ≠
 * analistas de bar (`analista@*`, painel /admin restrito a uma casa).
 */

/** Contas com painel /admin por estabelecimento (não usar portal de convidados). */
const BAR_ANALYST_EMAILS = new Set([
  "analista@seujustino.com",
  "analista@ohfregues.com",
  "analista@pracinha.com",
  "analista@reserva.com",
  "analista@highline.com",
  "analista.mkt03@ideiaum.com.br",
  "franciely.mendes@ideiaum.com.br",
  "recepcao@pracinhadoseujustino.com.br",
]);

/** Promoters de evento que nunca devem cair no /admin (lista legada). */
export const EVENT_PROMOTER_ONLY_EMAILS = new Set([
  "montoya@ideiaum.com.br",
  "golin@ideiaum.com.br",
  "juliosolto@ideiaum.com.br",
  "renans@ideiaum.com.br",
  "renato@ideiaum.com.br",
]);

export function normalizeEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

export function isBarAnalystEmail(email: string | null | undefined): boolean {
  return BAR_ANALYST_EMAILS.has(normalizeEmail(email));
}

/**
 * Usuário deve usar apenas o portal /promoter/{codigo}/dashboard (convidados),
 * não o painel /admin.
 */
export function shouldUseEventPromoterPortal(
  role: string | null | undefined,
  email: string | null | undefined,
  promoterCodigo?: string | null,
): boolean {
  const codigo = (promoterCodigo || "").trim();
  if (!codigo) return false;

  const r = (role || "").trim().toLowerCase();
  if (r !== "promoter" && r !== "promoter-list") return false;

  const e = normalizeEmail(email);
  if (isBarAnalystEmail(e)) return false;

  return true;
}

export function resolveEventPromoterDashboardPath(
  promoterCodigo: string,
): string {
  const codigo = promoterCodigo.trim();
  return `/promoter/${encodeURIComponent(codigo)}/dashboard`;
}
