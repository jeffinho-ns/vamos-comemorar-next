export interface RooftopReservationLike {
  id: number;
  reservation_date?: string | null;
  number_of_people?: number | null;
  checked_in?: boolean | number | null;
  checked_out?: boolean | number | null;
  checkin_time?: string | null;
  table_number?: string | number | null;
  area_name?: string | null;
  guest_list_id?: number | null;
  client_name?: string | null;
  responsavel?: string | null;
}

export interface RooftopGuestListLike {
  guest_list_id: number;
  reservation_id?: number | null;
  reservation_date?: string | null;
  owner_name?: string | null;
  owner_checked_in?: boolean | number | null;
  owner_checked_out?: boolean | number | null;
  owner_checkin_time?: string | null;
  owner_checkout_time?: string | null;
  guests_checked_in?: number | null;
  total_guests?: number | null;
  table_number?: string | number | null;
  area_name?: string | null;
}

export interface RooftopGuestLike {
  id: number;
  name?: string | null;
  checked_in?: boolean | number | null;
  checked_out?: boolean | number | null;
  checkin_time?: string | null;
}

export interface RooftopAreaCount {
  name: string;
  people: number;
}

export interface RooftopUnifiedMetrics {
  areasBreakdown: RooftopAreaCount[];
  areaPeopleTotal: number;
  reservationsCheckedIn: number;
  reservationsTotal: number;
  totalPeopleExpected: number;
}

export interface RooftopFlowQueueItem {
  id: string;
  name: string;
  statusLabel: "Dono" | "Convidado";
  tableLabel: string;
  subareaLabel: string;
  checkinTime?: string;
}

const HIGHLINE_SUBAREA_BY_TABLE: Record<string, string> = {
  "01": "Deck",
  "02": "Deck",
  "03": "Deck",
  "04": "Deck",
  "05": "Deck",
  "06": "Deck",
  "07": "Deck",
  "08": "Deck",
  "09": "Deck",
  "10": "Deck",
  "11": "Deck",
  "12": "Deck",
  "15": "Bar",
  "16": "Bar",
  "17": "Bar",
  "40": "Vista",
  "41": "Vista",
  "42": "Vista",
  "44": "Rooftop Centro",
  "45": "Rooftop Centro",
  "46": "Rooftop Centro",
  "47": "Rooftop Centro",
  "50": "Rooftop Direito",
  "51": "Rooftop Direito",
  "52": "Rooftop Direito",
  "53": "Rooftop Direito",
  "54": "Rooftop Direito",
  "55": "Rooftop Direito",
  "56": "Rooftop Direito",
  "60": "Rooftop Esquerdo",
  "61": "Rooftop Esquerdo",
  "62": "Rooftop Esquerdo",
  "63": "Rooftop Esquerdo",
  "64": "Rooftop Esquerdo",
  "65": "Rooftop Esquerdo",
  "70": "Bistro",
  "71": "Bistro",
  "72": "Bistro",
  "73": "Bistro",
};

export const toBoolean = (value: unknown): boolean => {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "sim";
  }
  return false;
};

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toDateKey = (value?: string | null): string | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const datePart = raw.split("T")[0] || raw.split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

export const isSameDateKey = (
  value: string | null | undefined,
  dateKey: string,
): boolean => toDateKey(value) === dateKey;

export const isReservaRooftopEstablishment = (
  establishmentName?: string | null,
): boolean => {
  const normalized = String(establishmentName || "").toLowerCase();
  return (
    normalized.includes("reserva rooftop") ||
    normalized.includes("rooftop")
  );
};

const normalizeRooftopAreaName = (areaName?: string | null): string | undefined => {
  const original = String(areaName || "").trim();
  if (!original) return undefined;
  const lower = original.toLowerCase();

  if (lower.includes("reserva rooftop - corredor") || lower.includes("corredor")) {
    return "Corredor";
  }
  if (lower.includes("lg 1") || lower.includes("lg1")) return "LG 1";
  if (lower.includes("lg 2") || lower.includes("lg2")) return "LG 2";
  if (lower.includes("lg 3") || lower.includes("lg3")) return "LG 3";
  if (lower.includes("gramado 1") || lower.includes("gramado1")) {
    return "Gramado 1";
  }
  if (lower.includes("gramado 2") || lower.includes("gramado2")) {
    return "Gramado 2";
  }
  if (lower.includes("parrilha")) return "Parrilha";
  if (lower.includes("redario") || lower.includes("redário")) return "Redario";
  if (lower.includes("pq 1") || lower.includes("pq1")) return "PQ 1";
  if (lower.includes("pq 2") || lower.includes("pq2")) return "PQ 2";
  if (lower.includes("pq 3") || lower.includes("pq3")) return "PQ 3";
  if (lower.includes("pq 4") || lower.includes("pq4")) return "PQ 4";
  if (lower.includes("vista")) return "Vista";
  if (lower.includes("deck")) return "Deck";
  if (lower.includes("bar")) return "Bar";
  if (lower.includes("bistro") || lower.includes("bistrô")) return "Bistro";
  if (lower.includes("centro")) return "Rooftop Centro";
  if (lower.includes("direito")) return "Rooftop Direito";
  if (lower.includes("esquerdo")) return "Rooftop Esquerdo";

  return original.replace(/^reserva rooftop\s*-\s*/i, "").trim() || original;
};

export const getRooftopSubareaName = (
  tableNumber?: string | number | null,
  areaName?: string | null,
): string | undefined => {
  const mappedByArea = normalizeRooftopAreaName(areaName);
  if (mappedByArea) return mappedByArea;

  const tableRaw = String(tableNumber || "").trim();
  if (!tableRaw) return undefined;

  const firstTable = tableRaw.includes(",")
    ? tableRaw.split(",")[0].trim()
    : tableRaw;
  const normalizedTable = firstTable.padStart(2, "0");
  return HIGHLINE_SUBAREA_BY_TABLE[normalizedTable];
};

const addToAreaCount = (map: Map<string, number>, area: string, people: number) => {
  if (people <= 0) return;
  map.set(area, Number(map.get(area) || 0) + people);
};

const parseIntSafe = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const computeRooftopUnifiedMetrics = (params: {
  reservations: RooftopReservationLike[];
  guestLists: RooftopGuestListLike[];
  dateKey: string;
}): RooftopUnifiedMetrics => {
  const { reservations, guestLists, dateKey } = params;
  const reservationsToday = reservations.filter((r) =>
    isSameDateKey(r.reservation_date, dateKey),
  );
  const guestListsToday = guestLists.filter((gl) =>
    isSameDateKey(gl.reservation_date, dateKey),
  );

  const reservationById = new Map<number, RooftopReservationLike>();
  reservationsToday.forEach((r) => {
    reservationById.set(Number(r.id), r);
  });

  const guestListByReservationId = new Map<number, RooftopGuestListLike[]>();
  guestListsToday.forEach((gl) => {
    const reservationId = parseIntSafe(gl.reservation_id);
    if (!reservationId) return;
    const current = guestListByReservationId.get(reservationId) || [];
    current.push(gl);
    guestListByReservationId.set(reservationId, current);
  });

  let reservationsTotal = reservationsToday.length;
  let reservationsCheckedIn = 0;
  let totalPeopleExpected = reservationsToday.reduce(
    (sum, reservation) => sum + Math.max(parseIntSafe(reservation.number_of_people), 0),
    0,
  );

  reservationsToday.forEach((reservation) => {
    const listForReservation =
      guestListByReservationId.get(Number(reservation.id)) || [];
    if (listForReservation.length > 0) {
      const ownerCheckedIn = listForReservation.some((gl) =>
        toBoolean(gl.owner_checked_in),
      );
      if (ownerCheckedIn) reservationsCheckedIn += 1;
      return;
    }

    if (toBoolean(reservation.checked_in)) {
      reservationsCheckedIn += 1;
    }
  });

  // Fallback for rare cases where the reservation is not returned
  // in /restaurant-reservations, but the guest list exists for today.
  const missingReservationIds = new Set<number>();
  guestListsToday.forEach((gl) => {
    const reservationId = parseIntSafe(gl.reservation_id);
    if (!reservationId || reservationById.has(reservationId)) return;
    if (missingReservationIds.has(reservationId)) return;

    missingReservationIds.add(reservationId);
    reservationsTotal += 1;
    totalPeopleExpected += 1 + Math.max(parseIntSafe(gl.total_guests), 0);
    if (toBoolean(gl.owner_checked_in)) {
      reservationsCheckedIn += 1;
    }
  });

  const areasMap = new Map<string, number>();
  const reservationsHandledByGuestList = new Set<number>();

  guestListsToday.forEach((gl) => {
    const reservationId = parseIntSafe(gl.reservation_id);
    const reservation =
      reservationId && reservationById.has(reservationId)
        ? reservationById.get(reservationId)
        : undefined;

    const ownerPresent =
      toBoolean(gl.owner_checked_in) && !toBoolean(gl.owner_checked_out) ? 1 : 0;
    const guestsPresent = Math.max(parseIntSafe(gl.guests_checked_in), 0);
    const peoplePresent = ownerPresent + guestsPresent;
    if (peoplePresent <= 0) return;

    const subarea =
      getRooftopSubareaName(
        gl.table_number ?? reservation?.table_number,
        gl.area_name ?? reservation?.area_name,
      ) || "Sem subarea";
    addToAreaCount(areasMap, subarea, peoplePresent);

    if (reservationId) {
      reservationsHandledByGuestList.add(reservationId);
    }
  });

  reservationsToday.forEach((reservation) => {
    if (reservationsHandledByGuestList.has(Number(reservation.id))) return;
    if (!toBoolean(reservation.checked_in) || toBoolean(reservation.checked_out)) return;

    const peoplePresent = Math.max(parseIntSafe(reservation.number_of_people), 1);
    const subarea =
      getRooftopSubareaName(reservation.table_number, reservation.area_name) ||
      "Sem subarea";
    addToAreaCount(areasMap, subarea, peoplePresent);
  });

  const areasBreakdown = Array.from(areasMap.entries())
    .map(([name, people]) => ({ name, people }))
    .sort((a, b) => {
      if (b.people !== a.people) return b.people - a.people;
      return a.name.localeCompare(b.name, "pt-BR");
    });

  const areaPeopleTotal = areasBreakdown.reduce(
    (sum, item) => sum + item.people,
    0,
  );

  return {
    areasBreakdown,
    areaPeopleTotal,
    reservationsCheckedIn,
    reservationsTotal,
    totalPeopleExpected,
  };
};

const formatTableLabel = (tableNumber?: string | number | null): string => {
  const value = String(tableNumber || "").trim();
  if (!value) return "Mesa nao informada";
  return `Mesa ${value}`;
};

const parseTimestamp = (value?: string): number => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

export const buildRooftopFlowQueue = (params: {
  dateKey: string;
  reservations: RooftopReservationLike[];
  guestLists: RooftopGuestListLike[];
  guestsByList: Record<number, RooftopGuestLike[]>;
  conducedIds: Set<string>;
}): RooftopFlowQueueItem[] => {
  const { dateKey, reservations, guestLists, guestsByList, conducedIds } = params;
  const reservationsToday = reservations.filter((r) =>
    isSameDateKey(r.reservation_date, dateKey),
  );
  const guestListsToday = guestLists.filter((gl) =>
    isSameDateKey(gl.reservation_date, dateKey),
  );

  const reservationById = new Map<number, RooftopReservationLike>();
  reservationsToday.forEach((r) => {
    reservationById.set(Number(r.id), r);
  });

  const queue: RooftopFlowQueueItem[] = [];
  const reservationsWithGuestList = new Set<number>();

  guestListsToday.forEach((gl) => {
    const reservationId = parseIntSafe(gl.reservation_id);
    if (reservationId) reservationsWithGuestList.add(reservationId);
    const reservation =
      reservationId && reservationById.has(reservationId)
        ? reservationById.get(reservationId)
        : undefined;

    const tableLabel = formatTableLabel(
      gl.table_number ?? reservation?.table_number,
    );
    const subareaLabel =
      getRooftopSubareaName(
        gl.table_number ?? reservation?.table_number,
        gl.area_name ?? reservation?.area_name,
      ) || "Sem subarea";

    const ownerId = `owner-${gl.guest_list_id}`;
    if (
      toBoolean(gl.owner_checked_in) &&
      !toBoolean(gl.owner_checked_out) &&
      !conducedIds.has(ownerId)
    ) {
      queue.push({
        id: ownerId,
        name: String(gl.owner_name || "Cliente"),
        statusLabel: "Dono",
        tableLabel,
        subareaLabel,
        checkinTime:
          String(gl.owner_checkin_time || reservation?.checkin_time || "") || undefined,
      });
    }

    const guests = guestsByList[Number(gl.guest_list_id)] || [];
    guests.forEach((guest) => {
      const guestQueueId = `guest-${gl.guest_list_id}-${guest.id}`;
      if (
        !toBoolean(guest.checked_in) ||
        toBoolean(guest.checked_out) ||
        conducedIds.has(guestQueueId)
      ) {
        return;
      }

      queue.push({
        id: guestQueueId,
        name: String(guest.name || "Convidado"),
        statusLabel: "Convidado",
        tableLabel,
        subareaLabel,
        checkinTime: String(guest.checkin_time || "") || undefined,
      });
    });
  });

  reservationsToday.forEach((reservation) => {
    const reservationId = Number(reservation.id);
    const hasGuestList =
      reservation.guest_list_id != null || reservationsWithGuestList.has(reservationId);
    if (hasGuestList) return;

    const itemId = `reservation-${reservationId}`;
    if (
      !toBoolean(reservation.checked_in) ||
      toBoolean(reservation.checked_out) ||
      conducedIds.has(itemId)
    ) {
      return;
    }

    queue.push({
      id: itemId,
      name: String(reservation.client_name || reservation.responsavel || "Cliente"),
      statusLabel: "Dono",
      tableLabel: formatTableLabel(reservation.table_number),
      subareaLabel:
        getRooftopSubareaName(reservation.table_number, reservation.area_name) ||
        "Sem subarea",
      checkinTime: String(reservation.checkin_time || "") || undefined,
    });
  });

  queue.sort((a, b) => {
    const byTime = parseTimestamp(a.checkinTime) - parseTimestamp(b.checkinTime);
    if (byTime !== 0) return byTime;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return queue;
};
