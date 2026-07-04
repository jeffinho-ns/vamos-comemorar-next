/** Decodifica payload JWT (sem verificar assinatura — só para flags de UI). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isSuperAdminFromToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return payload?.is_super_admin === true;
}

/** Cookie setado no login quando JWT tem `is_super_admin`. */
export function readSuperAdminFromCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("isSuperAdmin=1");
}
