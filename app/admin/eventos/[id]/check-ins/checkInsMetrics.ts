/**
 * Cálculo centralizado de métricas de check-in para /admin/eventos/[id]/check-ins.
 * Usado pela página principal (page.tsx) e disponível para a página tablet (tablet/page.tsx)
 * e qualquer outra rota sob check-ins, para exibir os mesmos números reais em todas as páginas.
 *
 * Regras:
 * - Total Geral: check-ins / total de pessoas em todas as listas (reservas + promoters + camarotes).
 * - Reservas: check-ins de pessoas em reservas / número de reservas (numReservas).
 * - Promoters: check-ins / total de convidados de promoters.
 * - Camarotes: check-ins / total de pessoas em camarotes.
 */

export interface ReservasMetricsParams {
  convidadosReservas: Array<{ status?: string }>;
  convidadosReservasRestaurante: Array<{ status_checkin?: number | boolean }>;
  guestListsRestaurante: Array<{
    guest_list_id: number;
    owner_name?: string;
    owner_checked_in?: number;
  }>;
  guestsByList: Record<number, Array<{ checked_in?: number | boolean }>>;
  checkInStatus: Record<
    number,
    { totalGuests?: number; guestsCheckedIn?: number; ownerCheckedIn?: boolean }
  >;
  reservasMesa: unknown[];
  reservasRestaurante: Array<{ guest_list_id?: number | null; checked_in?: boolean }>;
}

export function computeReservasMetrics(params: ReservasMetricsParams): {
  total: number;
  checkins: number;
  numReservas: number;
} {
  const {
    convidadosReservas,
    convidadosReservasRestaurante,
    guestListsRestaurante,
    guestsByList,
    checkInStatus,
    reservasMesa,
    reservasRestaurante,
  } = params;

  const totalConvidadosReservas = convidadosReservas.length;
  const checkinConvidadosReservas = convidadosReservas.filter(
    (c) => c.status === "CHECK-IN",
  ).length;

  let totalConvidadosRestaurante = 0;
  let checkinConvidadosRestaurante = 0;

  if (convidadosReservasRestaurante.length > 0) {
    totalConvidadosRestaurante = convidadosReservasRestaurante.length;
    checkinConvidadosRestaurante = convidadosReservasRestaurante.filter(
      (c) => c.status_checkin === 1 || c.status_checkin === true,
    ).length;
  } else {
    const guestsLoaded = Object.values(guestsByList).reduce(
      (sum, guests) => sum + guests.length,
      0,
    );
    const guestsCheckedInLoaded = Object.values(guestsByList).reduce(
      (sum, guests) =>
        sum +
        guests.filter((g) => g.checked_in === 1 || g.checked_in === true).length,
      0,
    );
    if (guestsLoaded > 0) {
      totalConvidadosRestaurante = guestsLoaded;
      checkinConvidadosRestaurante = guestsCheckedInLoaded;
    } else {
      guestListsRestaurante.forEach((gl) => {
        const status = checkInStatus[gl.guest_list_id];
        if (status && status.totalGuests && status.totalGuests > 0) {
          totalConvidadosRestaurante += status.totalGuests;
          checkinConvidadosRestaurante += status.guestsCheckedIn || 0;
        }
      });
    }
  }

  guestListsRestaurante.forEach((gl) => {
    totalConvidadosRestaurante += 1;
    if (
      checkInStatus[gl.guest_list_id]?.ownerCheckedIn ||
      gl.owner_checked_in === 1
    ) {
      checkinConvidadosRestaurante += 1;
    }
  });

  const reservasSemLista = reservasRestaurante.filter(
    (r) => r.guest_list_id == null,
  );
  reservasSemLista.forEach((r) => {
    totalConvidadosRestaurante += 1;
    if (r.checked_in) checkinConvidadosRestaurante += 1;
  });

  return {
    total:
      Number(totalConvidadosReservas) + Number(totalConvidadosRestaurante),
    checkins:
      Number(checkinConvidadosReservas) + Number(checkinConvidadosRestaurante),
    numReservas: Number(reservasMesa.length) + Number(reservasRestaurante.length),
  };
}

export interface ConvidadoPromoterLike {
  status_checkin?: string;
}

export function computePromoterMetrics(
  convidadosPromoters: ConvidadoPromoterLike[],
): { total: number; checkins: number } {
  const total = Number(convidadosPromoters.length);
  const checkins = Number(
    convidadosPromoters.filter((c) => c.status_checkin === "Check-in").length,
  );
  return { total, checkins };
}

export interface CamaroteLike {
  total_convidados?: number;
  convidados_checkin?: number;
}

export function computeCamarotesMetrics(
  camarotes: CamaroteLike[],
): { total: number; checkins: number } {
  const total = camarotes.reduce(
    (s, c) => s + Number(c.total_convidados || 0),
    0,
  );
  const checkins = camarotes.reduce(
    (s, c) => s + Number(c.convidados_checkin || 0),
    0,
  );
  return { total, checkins };
}

export interface MetricsLike {
  total: number;
  checkins: number;
}

export function computeTotalGeralMetrics(
  reservasMetrics: MetricsLike & { numReservas?: number },
  promoterMetrics: MetricsLike,
  camarotes: CamaroteLike[],
): { total: number; checkins: number } {
  const { total: camTotal, checkins: camCheckin } =
    computeCamarotesMetrics(camarotes);
  const totalPessoas =
    Number(reservasMetrics.total) +
    Number(promoterMetrics.total) +
    Number(camTotal);
  const totalCheckins =
    Number(reservasMetrics.checkins) +
    Number(promoterMetrics.checkins) +
    Number(camCheckin);
  return { total: totalPessoas, checkins: totalCheckins };
}
