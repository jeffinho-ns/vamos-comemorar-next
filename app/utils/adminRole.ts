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

/** Role canônico para cookie/localStorage/JWT (sem acento). */
export function canonicalSessionRole(role: string | null | undefined): string {
  const n = normalizeAdminRole(role);
  if (n === "recepcao" || n === "atendente") return "recepcao";
  return n || "cliente";
}

export function isStaffAdminRole(role: string | null | undefined): boolean {
  const n = canonicalSessionRole(role);
  return (
    isAdminRole(n) ||
    isGerenteRole(n) ||
    isReceptionRole(n) ||
    isPromoterRole(n)
  );
}

export function rolesMatchForAccess(
  allowedRole: string,
  userRole: string,
): boolean {
  const allowed = canonicalSessionRole(allowedRole);
  const user = canonicalSessionRole(userRole);
  if (!allowed || !user) return false;
  if (allowed === user) return true;
  if (
    (allowed === "recepcao" || allowed === "atendente") &&
    (user === "recepcao" || user === "atendente")
  ) {
    return true;
  }
  return false;
}

export function readSessionRoleSync(): string {
  if (typeof window === "undefined") return "";
  try {
    const match = document.cookie.match(/(?:^|;\s*)role=([^;]*)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem("role")?.trim() || "";
  } catch {
    return "";
  }
}
