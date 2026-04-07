const AUTH_CHANGED_EVENT = "auth:changed";

const AUTH_STORAGE_KEYS = [
  "authToken",
  "userId",
  "role",
  "userName",
  "userEmail",
  "promoterId",
  "promoterCodigo",
] as const;

const AUTH_COOKIE_KEYS = ["authToken", "role", "userEmail", "promoterCodigo"] as const;

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthSession(options?: { notify?: boolean }) {
  if (typeof window === "undefined") return;

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  for (const key of AUTH_COOKIE_KEYS) {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  if (options?.notify !== false) {
    notifyAuthChanged();
  }
}

export function setAuthSessionCookies(params: {
  authToken: string;
  role: string;
  userEmail?: string;
  promoterCodigo?: string;
}) {
  if (typeof document === "undefined") return;

  document.cookie = `authToken=${params.authToken}; path=/`;
  document.cookie = `role=${params.role}; path=/`;

  if (params.userEmail) {
    document.cookie = `userEmail=${encodeURIComponent(params.userEmail)}; path=/`;
  } else {
    document.cookie = "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }

  if (params.promoterCodigo) {
    document.cookie = `promoterCodigo=${encodeURIComponent(params.promoterCodigo)}; path=/`;
  } else {
    document.cookie = "promoterCodigo=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }
}

export { AUTH_CHANGED_EVENT };
