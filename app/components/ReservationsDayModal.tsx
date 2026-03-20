"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MdClose,
  MdExpandMore,
  MdGroups,
  MdMap,
  MdPrint,
  MdRestaurant,
} from "react-icons/md";
import { useEffect, useMemo, useRef, useState } from "react";

import { Reservation } from '@/app/types/reservation';
import {
  getReservationStatusColor,
  getReservationStatusText,
  isReservationStatusOneOf,
} from "@/app/utils/reservationStatus";
import { printReservationsDayPdf } from "@/app/utils/printReservationsDayPdf";
import { getReservationAreaLabel } from "@/app/utils/reservationDayModalShared";

interface ReservationsDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  reservations: Reservation[];
  isReservaRooftop?: boolean;
  /** Nome do estabelecimento (ex.: no PDF impresso). */
  establishmentName?: string;
  onReservationClick: (reservation: Reservation) => void;
}

type AreaBreakdownItem = { name: string; people: number };

export default function ReservationsDayModal({
  isOpen,
  onClose,
  date,
  reservations,
  isReservaRooftop = false,
  establishmentName,
  onReservationClick,
}: ReservationsDayModalProps) {
  const [areasOpen, setAreasOpen] = useState(false);
  const areasButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (areasButtonRef.current?.contains(target)) return;
      setAreasOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [isOpen, onClose]);

  const getStatusColor = (status: string, notes?: string) => {
    // Verificar se é espera antecipada primeiro
    if (notes && notes.includes('ESPERA ANTECIPADA')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return getReservationStatusColor(status, { withBorder: true, isReservaRooftop });
  };

  const getStatusText = (status: string, notes?: string) => {
    // Verificar se é espera antecipada primeiro
    if (notes && notes.includes('ESPERA ANTECIPADA')) {
      return 'ESPERA ANTECIPADA';
    }
    return getReservationStatusText(status, { isReservaRooftop });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const areasBreakdown = useMemo<AreaBreakdownItem[]>(() => {
    const map = new Map<string, number>();
    reservations.forEach((r) => {
      const area = getReservationAreaLabel(r);
      const people = Number((r as any).number_of_people ?? 0) || 0;
      map.set(area, (map.get(area) || 0) + people);
    });
    return Array.from(map.entries())
      .map(([name, people]) => ({ name, people }))
      .sort((a, b) => b.people - a.people);
  }, [reservations]);

  const areaPeopleTotal = useMemo(
    () => areasBreakdown.reduce((sum, x) => sum + (Number(x.people) || 0), 0),
    [areasBreakdown],
  );

  const reservationsCheckedIn = useMemo(() => {
    return reservations.filter((r) =>
      isReservationStatusOneOf((r as any).status, ["seated", "completed"]),
    ).length;
  }, [reservations]);

  const totalPeopleExpected = useMemo(() => {
    return reservations.reduce(
      (sum, r) => sum + (Number((r as any).number_of_people ?? 0) || 0),
      0,
    );
  }, [reservations]);

  const sortedReservations = useMemo(() => {
    const copy = reservations.slice();
    copy.sort((a: any, b: any) => {
      const ta = String(a.reservation_time || "");
      const tb = String(b.reservation_time || "");
      if (ta && tb) return ta.localeCompare(tb);
      if (ta) return -1;
      if (tb) return 1;
      return String(a.client_name || "").localeCompare(String(b.client_name || ""));
    });
    return copy;
  }, [reservations]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Fechar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-5xl overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            style={{ height: "90vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-12 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 pb-3 pt-3 backdrop-blur-sm sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {establishmentName ? (
                    <p className="truncate text-xs font-semibold text-gray-500 sm:text-sm">
                      {establishmentName}
                    </p>
                  ) : null}
                  <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                    Reservas • {formatDate(date)}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                    {reservations.length} reserva{reservations.length !== 1 ? "s" : ""}{" "}
                    no dia
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      printReservationsDayPdf(
                        date,
                        reservations,
                        isReservaRooftop,
                        establishmentName,
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 sm:px-3"
                    aria-label="Imprimir PDF das reservas do dia"
                    title="Imprimir ou salvar PDF"
                  >
                    <MdPrint size={20} className="shrink-0" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Fechar painel"
                  >
                    <MdClose size={22} />
                  </button>
                </div>
              </div>

              {/* 3 cards (Áreas / Reservas / Pessoas) */}
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                <div ref={areasButtonRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAreasOpen((prev) => !prev)}
                    className="w-full rounded-xl border border-sky-200 bg-sky-50 p-2 text-left text-gray-900 transition-colors hover:bg-sky-100 sm:p-3"
                  >
                    <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-sky-700 sm:gap-2 sm:text-xs">
                      <MdMap size={14} className="shrink-0" />
                      <span className="truncate">Área</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold tabular-nums text-gray-900 sm:text-2xl">
                        {areaPeopleTotal}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-800">
                        <MdExpandMore
                          size={16}
                          className={
                            areasOpen
                              ? "rotate-180 transition-transform"
                              : "transition-transform"
                          }
                        />
                      </span>
                    </div>
                    <div className="mt-0.5 hidden text-[10px] text-sky-700/80 sm:block sm:text-xs">
                      Pessoas por área
                    </div>
                  </button>

                  <AnimatePresence>
                    {areasOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl"
                      >
                        {areasBreakdown.length === 0 ? (
                          <div className="rounded-lg px-3 py-2 text-sm text-gray-500">
                            Sem dados de área.
                          </div>
                        ) : (
                          areasBreakdown.map((area) => (
                            <div
                              key={area.name}
                              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                            >
                              <span className="min-w-0 pr-3 whitespace-normal break-words">
                                {area.name}
                              </span>
                              <span className="font-semibold tabular-nums text-sky-700">
                                {area.people}
                              </span>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-gray-900 sm:p-3">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 sm:gap-2 sm:text-xs">
                    <MdRestaurant size={14} className="shrink-0" />
                    <span className="truncate">Reservas</span>
                  </div>
                  <div className="text-base font-extrabold tabular-nums sm:text-2xl">
                    {reservationsCheckedIn}/{reservations.length}
                  </div>
                  <div className="mt-0.5 hidden text-[10px] text-emerald-700/80 sm:block sm:text-xs">
                    Check-ins / total
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-gray-900 sm:p-3">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700 sm:gap-2 sm:text-xs">
                    <MdGroups size={14} className="shrink-0" />
                    <span className="truncate">Pessoas</span>
                  </div>
                  <div className="text-base font-extrabold tabular-nums sm:text-2xl">
                    {totalPeopleExpected}
                  </div>
                  <div className="mt-0.5 hidden text-[10px] text-amber-700/80 sm:block sm:text-xs">
                    Total previsto
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="h-[calc(90vh-168px)] overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4 sm:px-6">
              {reservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma reserva encontrada
                  </h3>
                  <p className="text-gray-500">
                    Não há reservas para este dia.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedReservations.map((reservation) => {
                    const notes = (reservation as any).notes as string | undefined;
                    const tableNumber = (reservation as any).table_number as string | number | undefined;
                    const statusCls = getStatusColor((reservation as any).status, notes);
                    const statusText = getStatusText((reservation as any).status, notes);
                    const areaName = getReservationAreaLabel(reservation);
                    const time = String((reservation as any).reservation_time || "").trim();
                    const people = Number((reservation as any).number_of_people ?? 0) || 0;
                    const observation = notes
                      ? notes.replace(/ESPERA ANTECIPADA/gi, "").trim()
                      : "";

                    return (
                      <motion.button
                        type="button"
                        key={(reservation as any).id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onReservationClick(reservation)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-left shadow-sm transition hover:bg-gray-50 active:scale-[0.99] sm:px-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {notes && notes.includes("🎂") && (
                                <span className="shrink-0 text-lg leading-none" aria-hidden={true}>
                                  🎂
                                </span>
                              )}
                              <span className="truncate text-sm font-extrabold text-gray-900 sm:text-base">
                                {String((reservation as any).client_name || "Sem nome")}
                              </span>
                              {notes && notes.includes("ESPERA ANTECIPADA") && (
                                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                                  ⏳ ESPERA
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-600 sm:text-sm">
                              <span className="tabular-nums">{time || "--:--"}</span>
                              <span className="tabular-nums">
                                {people}p
                              </span>
                            </div>
                            <div className="mt-1 w-full text-xs font-semibold text-gray-700 sm:text-sm">
                              <span className="block w-full whitespace-normal break-words">
                                {areaName}
                              </span>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-gray-600">
                                <span className="whitespace-nowrap">
                                  Mesa: {tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== "" ? tableNumber : "-"}
                                </span>
                                <span className="min-w-0 truncate flex-1">
                                  Obs: {observation ? observation : "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold sm:text-xs ${statusCls}`}
                            title={statusText}
                          >
                            {statusText}
                          </span>
                        </div>

                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <span className="text-[11px] font-semibold text-blue-600">
                            Toque para ver detalhes
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
