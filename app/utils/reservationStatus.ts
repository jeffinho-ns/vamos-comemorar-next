export type CanonicalReservationStatus =
  | "new"
  | "confirmed"
  | "cancelled"
  | "seated"
  | "pending"
  | "completed"
  | "no-show"
  | "unknown";

const normalizeStatusToken = (status?: string | null): string => {
  return String(status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, "-");
};

export const normalizeReservationStatus = (
  status?: string | null,
): CanonicalReservationStatus => {
  const normalized = normalizeStatusToken(status);

  if (!normalized) return "unknown";

  if (["nova", "novo", "new"].includes(normalized)) return "new";

  if (["confirmada", "confirmado", "confirmed", "confirm"].includes(normalized))
    return "confirmed";

  if (
    ["cancelada", "cancelado", "cancelled", "canceled", "cancel"].includes(
      normalized,
    )
  ) {
    return "cancelled";
  }

  if (
    [
      "sentada",
      "sentado",
      "checked-in",
      "checkedin",
      "check-in",
      "checkin",
      "checked",
      "check",
    ].includes(normalized)
  ) {
    return "seated";
  }

  if (
    ["pendente", "pending", "aguardando", "aguardando-aprovacao"].includes(
      normalized,
    )
  ) {
    return "pending";
  }

  if (
    [
      "completed",
      "concluida",
      "concluido",
      "finalizada",
      "finalizado",
      "finalized",
      "finished",
    ].includes(normalized)
  ) {
    return "completed";
  }

  if (["no-show", "noshow"].includes(normalized)) return "no-show";

  return "unknown";
};

export const isReservationStatus = (
  status: string | null | undefined,
  target: CanonicalReservationStatus,
): boolean => normalizeReservationStatus(status) === target;

export const isReservationStatusOneOf = (
  status: string | null | undefined,
  targets: CanonicalReservationStatus[],
): boolean => {
  const normalized = normalizeReservationStatus(status);
  return targets.includes(normalized);
};

interface StatusColorOptions {
  withBorder?: boolean;
  isReservaRooftop?: boolean;
}

export const getReservationStatusColor = (
  status: string | null | undefined,
  options: StatusColorOptions = {},
): string => {
  const { withBorder = false, isReservaRooftop = false } = options;
  const normalized = normalizeReservationStatus(status);

  const build = (
    bg: string,
    text: string,
    border: string,
    withBorderEnabled: boolean,
  ) => (withBorderEnabled ? `${bg} ${text} ${border}` : `${bg} ${text}`);

  switch (normalized) {
    case "new":
      return build("bg-sky-100", "text-sky-800", "border-sky-200", withBorder);
    case "confirmed":
      return build(
        "bg-green-100",
        "text-green-800",
        "border-green-200",
        withBorder,
      );
    case "cancelled":
      return build("bg-red-100", "text-red-800", "border-red-200", withBorder);
    case "seated":
      return isReservaRooftop
        ? build(
            "bg-indigo-100",
            "text-indigo-800",
            "border-indigo-200",
            withBorder,
          )
        : build("bg-blue-100", "text-blue-800", "border-blue-200", withBorder);
    case "pending":
      return build(
        "bg-amber-100",
        "text-amber-800",
        "border-amber-200",
        withBorder,
      );
    case "completed":
      return build(
        "bg-gray-100",
        "text-gray-800",
        "border-gray-200",
        withBorder,
      );
    case "no-show":
      return build(
        "bg-slate-100",
        "text-slate-800",
        "border-slate-200",
        withBorder,
      );
    default:
      return build(
        "bg-gray-100",
        "text-gray-800",
        "border-gray-200",
        withBorder,
      );
  }
};

interface StatusTextOptions {
  isReservaRooftop?: boolean;
}

export const getReservationStatusText = (
  status: string | null | undefined,
  options: StatusTextOptions = {},
): string => {
  const { isReservaRooftop = false } = options;
  const normalized = normalizeReservationStatus(status);

  if (isReservaRooftop) {
    switch (normalized) {
      case "new":
        return "Reserva nova";
      case "confirmed":
        return "Reserva confirmada";
      case "cancelled":
        return "Reserva cancelada";
      case "seated":
        return "Reserva sentada";
      case "pending":
        return "Reserva pendente";
      case "completed":
        return "Reserva finalizada";
      case "no-show":
        return "Reserva no-show";
      default:
        return String(status || "");
    }
  }

  switch (normalized) {
    case "new":
      return "Nova";
    case "confirmed":
      return "Confirmada";
    case "cancelled":
      return "Cancelada";
    case "seated":
      return "Check-in";
    case "pending":
      return "Pendente";
    case "completed":
      return "Finalizada";
    case "no-show":
      return "No Show";
    default:
      return String(status || "");
  }
};
