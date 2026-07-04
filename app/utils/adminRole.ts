/**
 * Normalização de role para comparações no admin (middleware, layout, login).
 * Remove acentos e unifica recepcao/recepção/atendente.
 */

export function normalizeAdminRole(role: string | null | undefined): string {
  return String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isReceptionRole(role: string | null | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === "recepcao" || r === "atendente";
}

export function isPromoterRole(role: string | null | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === "promoter" || r === "promoter-list";
}

export function isGerenteRole(role: string | null | undefined): boolean {
  return normalizeAdminRole(role) === "gerente";
}

export function isAdminRole(role: string | null | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === "admin" || r === "administrador";
}
