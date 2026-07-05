import { safeGetItem } from "./safeStorage";

/** Token de auth: cookie primeiro, localStorage como fallback. */
export function readAuthToken(): string {
  if (typeof document === "undefined") return safeGetItem("authToken");
  try {
    const hit = document.cookie
      .split(";")
      .find((part) => part.trim().startsWith("authToken="));
    if (hit) {
      const value = hit.split("=").slice(1).join("=").trim();
      if (value) return decodeURIComponent(value);
    }
  } catch {
    /* ignore */
  }
  return safeGetItem("authToken");
}
