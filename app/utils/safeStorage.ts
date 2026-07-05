/** localStorage/sessionStorage seguro — falha silenciosa em modo privado ou PCs restritos. */

export function safeGetItem(key: string, storage: Storage | null = null): string {
  if (typeof window === "undefined") return "";
  try {
    const store = storage ?? window.localStorage;
    return store.getItem(key) || "";
  } catch {
    return "";
  }
}

export function safeSetItem(
  key: string,
  value: string,
  storage: Storage | null = null,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const store = storage ?? window.localStorage;
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string, storage: Storage | null = null): void {
  if (typeof window === "undefined") return;
  try {
    const store = storage ?? window.localStorage;
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}
