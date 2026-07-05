/** Monta mapas de convidados a partir da resposta única de GET /eventos/:id/checkins. */

export function buildGuestsMapFromCheckinsResponse(
  guestLists: any[],
  convidadosReservasRestaurante: any[],
): Record<number, any[]> {
  const guests: Record<number, any[]> = {};
  const listByReservationId = new Map<number, number>();

  for (const gl of guestLists) {
    const listId = Number(gl.guest_list_id || gl.id);
    const resId = Number(gl.reservation_id);
    if (listId > 0 && resId > 0) {
      listByReservationId.set(resId, listId);
    }
  }

  for (const c of convidadosReservasRestaurante || []) {
    const listId = listByReservationId.get(Number(c.reserva_id));
    if (!listId) continue;
    if (!guests[listId]) guests[listId] = [];
    guests[listId].push({
      id: c.id,
      name: c.nome,
      checked_in:
        c.status_checkin === true ||
        c.status_checkin === 1 ||
        c.status_checkin === "Check-in",
      checkin_time: c.data_checkin,
      entrada_tipo: c.entrada_tipo,
      entrada_valor: c.entrada_valor,
    });
  }

  return guests;
}

export function buildPromoterGuestsMap(
  promoters: any[],
  convidadosPromoters: any[],
): Record<number, any[]> {
  const promoterGuests: Record<number, any[]> = {};
  for (const promoter of promoters || []) {
    const promoterId = promoter.id || promoter.promoter_id;
    promoterGuests[promoterId] = (convidadosPromoters || []).filter((c: any) => {
      const cPromoterId = c.promoter_id || c.promoter_responsavel_id;
      return Number(cPromoterId) === Number(promoterId);
    });
  }
  return promoterGuests;
}

export function parseCheckinsApiPayload(checkinsData: any) {
  const dados = checkinsData?.dados || checkinsData || {};
  const guestLists = dados.guestListsRestaurante || dados.restaurant_guest_lists || [];
  const promoters = dados.promoters || [];
  const convidadosPromoters = dados.convidadosPromoters || [];
  const convidadosReservasRestaurante = dados.convidadosReservasRestaurante || [];

  return {
    guestLists,
    promoters,
    guests: buildGuestsMapFromCheckinsResponse(guestLists, convidadosReservasRestaurante),
    promoterGuests: buildPromoterGuestsMap(promoters, convidadosPromoters),
    reservations: dados.reservasRestaurante || dados.restaurant_reservations || [],
  };
}
