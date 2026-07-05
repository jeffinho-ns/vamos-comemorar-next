/**
 * Roteamento check-in por tipo de dispositivo.
 *
 * Desktop/notebook → tela completa (`/admin/eventos/:id/check-ins`).
 * Tablet real → rota tablet (`/admin/eventos/:id/check-ins/tablet`).
 *
 * NÃO usar RAM/CPU como proxy de tablet — isso mandava desktops normais para modo tablet.
 */

/** Detecta tablet/iPad (touch + UA), não notebook com pouca RAM. */
export function isTabletDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ua = navigator.userAgent || "";
    if (/iPad|Android(?!.*Mobile)|Tablet|Silk|Kindle|PlayBook/i.test(ua)) {
      return true;
    }
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const compact = window.matchMedia("(max-width: 1024px)").matches;
    if (coarse && !fine && compact && navigator.maxTouchPoints > 0) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Rota ao abrir check-in de um evento (lista em /admin/checkins). */
export function eventCheckinsPath(eventoId: number | string): string {
  const id = String(eventoId);
  const base = `/admin/eventos/${id}/check-ins`;
  return isTabletDevice() ? `${base}/tablet` : base;
}

/** Hub modo tablet com evento pré-selecionado (botão "Modo Tablet"). */
export function checkinsTabletHubPath(
  eventoId?: number | string,
  establishmentId?: number | null,
): string {
  const params = new URLSearchParams();
  if (eventoId != null && String(eventoId) !== "") {
    params.set("evento_id", String(eventoId));
  }
  if (establishmentId != null && Number(establishmentId) > 0) {
    params.set("establishment_id", String(establishmentId));
  }
  const qs = params.toString();
  return qs ? `/admin/checkins/tablet?${qs}` : "/admin/checkins/tablet";
}
