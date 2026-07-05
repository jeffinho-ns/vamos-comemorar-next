/**
 * Notebooks lentos / pouca RAM: usa a rota tablet (bundle menor) em vez da tela completa.
 */

export function preferLiteCheckinsRoute(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; saveData?: boolean } };
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 4) {
      return true;
    }
    if (
      typeof nav.hardwareConcurrency === "number" &&
      nav.hardwareConcurrency > 0 &&
      nav.hardwareConcurrency <= 4
    ) {
      return true;
    }
    const conn = nav.connection;
    if (conn?.saveData) return true;
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function eventCheckinsPath(eventoId: number | string): string {
  const id = String(eventoId);
  const base = `/admin/eventos/${id}/check-ins`;
  return preferLiteCheckinsRoute() ? `${base}/tablet` : base;
}
