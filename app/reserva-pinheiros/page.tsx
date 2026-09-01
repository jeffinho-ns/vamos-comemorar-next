"use client";

import { ReservaVenuePage } from "../reserva-rooftop/page";
import { RESERVA_PINHEIROS_VENUE } from "../config/reservaVenueConfig";

export default function ReservaPinheirosPage() {
  return <ReservaVenuePage venue={RESERVA_PINHEIROS_VENUE} />;
}
