/**
 * Rotas de check-in — modo tablet só quando o usuário escolhe (botão "Modo Tablet").
 */

/** Rota padrão ao abrir check-in de um evento (lista em /admin/checkins). */
export function eventCheckinsPath(eventoId: number | string): string {
  return `/admin/eventos/${String(eventoId)}/check-ins`;
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
