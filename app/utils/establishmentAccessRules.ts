/**
 * Regras de visibilidade de estabelecimentos (UI + alinhamento com API).
 * - Regiane: apenas Highline e grupo Seu Justino (inclui Pracinha). Sitio Ilha é outro estabelecimento (só cardápio).
 */

export const REGIANE_RESTRICTED_EMAIL = "regianebrunno@gmail.com";

export function normalizeUserEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isHighlineOrSeuJustinoGroupName(name: string | undefined): boolean {
  if (!name) return false;
  const n = stripDiacritics(name.toLowerCase());
  if (n.includes("sitio") && n.includes("ilha")) return false;
  if (n.includes("high")) return true;
  if (n.includes("seu justino")) return true;
  if (n.includes("pracinha")) return true;
  return false;
}

export function filterEstablishmentPermissionsForUser<
  T extends { establishment_name?: string },
>(userEmail: string | null | undefined, permissions: T[]): T[] {
  const e = normalizeUserEmail(userEmail);
  let out = [...permissions];

  if (e === REGIANE_RESTRICTED_EMAIL) {
    out = out.filter((p) => isHighlineOrSeuJustinoGroupName(p.establishment_name));
  }

  return out;
}

export function filterEstablishmentListForUser<
  T extends { name: string; id?: string | number },
>(userEmail: string | null | undefined, establishments: T[]): T[] {
  const e = normalizeUserEmail(userEmail);
  let out = [...establishments];

  if (e === REGIANE_RESTRICTED_EMAIL) {
    out = out.filter((est) => isHighlineOrSeuJustinoGroupName(est.name));
  }

  return out;
}
