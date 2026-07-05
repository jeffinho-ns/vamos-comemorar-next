import { canonicalSessionRole } from "./adminRole";
import { isSuperAdminFromToken } from "./superAdminAccess";
import { safeGetItem, safeRemoveItem } from "./safeStorage";

const AUTH_CHANGED_EVENT = "auth:changed";
/** Cookies persistentes — evita perda de sessão em navegadores antigos ao fechar aba. */
const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const AUTH_STORAGE_KEYS = [
  "authToken",
  "userId",
  "role",
  "userName",
  "userEmail",
  "promoterId",
  "promoterCodigo",
] as const;
const AUTH_COOKIE_KEYS = ["authToken", "role", "userEmail", "promoterCodigo", "isSuperAdmin"] as const;

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthSession(options?: { notify?: boolean }) {
  if (typeof window === "undefined") return;

  for (const key of AUTH_STORAGE_KEYS) {
    safeRemoveItem(key);
  }

  for (const key of AUTH_COOKIE_KEYS) {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  if (options?.notify !== false) {
    notifyAuthChanged();
  }
}

function writePersistentCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function setAuthSessionCookies(params: {
  authToken: string;
  role: string;
  userEmail?: string;
  promoterCodigo?: string;
  isSuperAdmin?: boolean;
}) {
  if (typeof document === "undefined") return;

  const role = canonicalSessionRole(params.role);

  writePersistentCookie("authToken", params.authToken);
  writePersistentCookie("role", encodeURIComponent(role));

  if (params.isSuperAdmin) {
    writePersistentCookie("isSuperAdmin", "1");
  } else {
    clearCookie("isSuperAdmin");
  }

  if (params.userEmail) {
    writePersistentCookie("userEmail", encodeURIComponent(params.userEmail));
  } else {
    clearCookie("userEmail");
  }

  if (params.promoterCodigo) {
    writePersistentCookie("promoterCodigo", encodeURIComponent(params.promoterCodigo));
  } else {
    clearCookie("promoterCodigo");
  }
}

/**
 * Restaura cookies a partir do localStorage quando o cookie sumiu (comum em PCs
 * antigos, IE mode ou sessões longas). Mantém middleware e AppContext alinhados.
 */
export function ensureAuthSessionFromStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const token = safeGetItem("authToken");
    if (!token) return false;

    const hasAuthCookie = document.cookie
      .split(";")
      .some((part) => part.trim().startsWith("authToken="));
    if (hasAuthCookie) return false;

    setAuthSessionCookies({
      authToken: token,
      role: safeGetItem("role") || "cliente",
      userEmail: safeGetItem("userEmail") || undefined,
      promoterCodigo: safeGetItem("promoterCodigo") || undefined,
      isSuperAdmin: isSuperAdminFromToken(token),
    });    notifyAuthChanged();
    return true;
  } catch {
    return false;
  }
}

export { AUTH_CHANGED_EVENT };
