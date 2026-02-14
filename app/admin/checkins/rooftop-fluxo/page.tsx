"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MdCheckCircle,
  MdDirectionsWalk,
  MdRefresh,
  MdTableBar,
} from "react-icons/md";
import { WithPermission } from "@/app/components/WithPermission/WithPermission";
import RooftopUnifiedStatsHeader from "@/app/components/checkins/RooftopUnifiedStatsHeader";
import { useEstablishments } from "@/app/hooks/useEstablishments";
import { useEstablishmentPermissions } from "@/app/hooks/useEstablishmentPermissions";
import {
  buildConductionPayload,
  confirmConduction,
  getConducedIds,
} from "@/app/services/rooftopConduction";
import {
  buildRooftopFlowQueue,
  computeRooftopUnifiedMetrics,
  getTodayDateKey,
  isReservaRooftopEstablishment,
  isSameDateKey,
  type RooftopGuestLike,
  type RooftopGuestListLike,
  type RooftopReservationLike,
} from "@/app/utils/rooftopCheckins";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://vamos-comemorar-api.onrender.com";
const POLLING_INTERVAL_MS = 5_000;

export default function RooftopFluxoPage() {
  const establishmentPermissions = useEstablishmentPermissions();
  const { establishments, loading: establishmentsLoading, fetchEstablishments } =
    useEstablishments();

  const [rooftopEstablishmentId, setRooftopEstablishmentId] = useState<
    number | null
  >(null);
  const [rooftopEstablishmentName, setRooftopEstablishmentName] =
    useState<string>("");

  const [reservations, setReservations] = useState<RooftopReservationLike[]>([]);
  const [guestLists, setGuestLists] = useState<RooftopGuestListLike[]>([]);
  const [guestsByList, setGuestsByList] = useState<Record<number, RooftopGuestLike[]>>(
    {},
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const todayDateKey = getTodayDateKey();
  const [conducedIds, setConducedIds] = useState<Set<string>>(new Set());
  const [conductionError, setConductionError] = useState<string | null>(null);
  const [conductionSuccessId, setConductionSuccessId] = useState<string | null>(null);

  const lastDataSignatureRef = useRef<string>("");

  useEffect(() => {
    if (establishmentPermissions.isLoading) return;
    fetchEstablishments();
  }, [establishmentPermissions.isLoading, fetchEstablishments]);

  const rooftopEstablishment = useMemo(() => {
    if (establishmentPermissions.isLoading) return null;
    const normalized = establishments
      .map((est) => ({ id: Number(est.id), name: est.name || "" }))
      .filter((est) => Number.isFinite(est.id));

    const allowed = establishmentPermissions.getFilteredEstablishments(normalized);
    return (
      allowed.find((est) => isReservaRooftopEstablishment(est.name)) || null
    );
  }, [
    establishments,
    establishmentPermissions,
  ]);

  useEffect(() => {
    if (!rooftopEstablishment) {
      setRooftopEstablishmentId(null);
      setRooftopEstablishmentName("");
      return;
    }
    setRooftopEstablishmentId(Number(rooftopEstablishment.id));
    setRooftopEstablishmentName(rooftopEstablishment.name);
  }, [rooftopEstablishment]);

  const loadTodayData = useCallback(
    async (silent = false) => {
      if (!rooftopEstablishmentId) {
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const token = localStorage.getItem("authToken");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const monthKey = todayDateKey.slice(0, 7);
        const [reservationsRes, guestListsRes] = await Promise.all([
          fetch(
            `${API_URL}/api/restaurant-reservations?establishment_id=${rooftopEstablishmentId}&date=${todayDateKey}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/admin/guest-lists?month=${monthKey}&establishment_id=${rooftopEstablishmentId}`,
            { headers },
          ),
        ]);

        if (!reservationsRes.ok) {
          throw new Error("Nao foi possivel carregar as reservas do dia.");
        }

        const reservationsData = await reservationsRes.json();
        const guestListsData = guestListsRes.ok ? await guestListsRes.json() : {};

        const reservationsToday = (reservationsData.reservations || []).filter(
          (reservation: RooftopReservationLike) =>
            isSameDateKey(reservation.reservation_date, todayDateKey),
        ) as RooftopReservationLike[];

        const guestListsToday = (guestListsData.guestLists || []).filter(
          (guestList: RooftopGuestListLike) =>
            isSameDateKey(guestList.reservation_date, todayDateKey),
        ) as RooftopGuestListLike[];

        const listsWithCheckedGuests = guestListsToday.filter(
          (gl) => Number(gl.guests_checked_in || 0) > 0,
        );

        const guestsByListEntries = await Promise.all(
          listsWithCheckedGuests.map(async (gl) => {
            try {
              const response = await fetch(
                `${API_URL}/api/admin/guest-lists/${gl.guest_list_id}/guests`,
                { headers },
              );
              if (!response.ok) return [gl.guest_list_id, []] as const;
              const data = await response.json();
              return [gl.guest_list_id, data.guests || []] as const;
            } catch {
              return [gl.guest_list_id, []] as const;
            }
          }),
        );

        const nextGuestsByList: Record<number, RooftopGuestLike[]> = {};
        guestsByListEntries.forEach(([guestListId, guests]) => {
          nextGuestsByList[Number(guestListId)] = guests as RooftopGuestLike[];
        });

        let conducedList: string[] = [];
        try {
          conducedList = await getConducedIds(
            API_URL,
            rooftopEstablishmentId,
            todayDateKey,
          );
        } catch {
          // Mantém estado anterior em caso de erro (ex.: backend indisponível)
        }

        const signature = JSON.stringify({
          r: reservationsToday.map((x) => ({ id: x.id, ci: x.checked_in, co: x.checked_out })),
          g: guestListsToday.map((x) => ({
            id: x.guest_list_id,
            oci: x.owner_checked_in,
            oco: x.owner_checked_out,
            gci: x.guests_checked_in,
          })),
          gbl: Object.keys(nextGuestsByList)
            .sort()
            .map((k) => [k, (nextGuestsByList[Number(k)] || []).map((u) => ({ id: u.id, ci: u.checked_in, co: u.checked_out }))]),
          c: conducedList.slice().sort(),
        });

        if (silent && signature === lastDataSignatureRef.current) {
          return;
        }
        lastDataSignatureRef.current = signature;

        setReservations(reservationsToday);
        setGuestLists(guestListsToday);
        setGuestsByList(nextGuestsByList);
        setConducedIds(new Set(conducedList));
        setLastUpdatedAt(new Date());
        setError(null);
        setConductionError(null);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar dados de fluxo.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rooftopEstablishmentId, todayDateKey],
  );

  useEffect(() => {
    if (!rooftopEstablishmentId) return;
    loadTodayData(false);
    const interval = setInterval(() => {
      loadTodayData(true);
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rooftopEstablishmentId, loadTodayData]);

  const unifiedMetrics = useMemo(
    () =>
      computeRooftopUnifiedMetrics({
        reservations,
        guestLists,
        dateKey: todayDateKey,
      }),
    [reservations, guestLists, todayDateKey],
  );

  const queueItems = useMemo(
    () =>
      buildRooftopFlowQueue({
        dateKey: todayDateKey,
        reservations,
        guestLists,
        guestsByList,
        conducedIds,
      }),
    [todayDateKey, reservations, guestLists, guestsByList, conducedIds],
  );

  const handleConfirmConduction = useCallback(
    async (item: { id: string; guest_list_id?: number; reservation_id?: number }) => {
      const queueItemId = item.id;
      setConductionError(null);
      setConductionSuccessId(null);

      const previousIds = new Set(conducedIds);
      setConducedIds((prev) => {
        const next = new Set(prev);
        next.add(queueItemId);
        return next;
      });

      const payload = buildConductionPayload(
        queueItemId,
        rooftopEstablishmentId!,
        todayDateKey,
        item.guest_list_id,
        item.reservation_id,
      );

      try {
        await confirmConduction(API_URL, payload);
        setConductionSuccessId(queueItemId);
        setTimeout(() => setConductionSuccessId(null), 2000);
      } catch (err) {
        setConducedIds(previousIds);
        setConductionError(
          err instanceof Error ? err.message : "Erro ao confirmar condução.",
        );
      }
    },
    [
      rooftopEstablishmentId,
      todayDateKey,
      conducedIds,
    ],
  );

  const canRenderQueue = rooftopEstablishmentId != null;

  return (
    <WithPermission
      allowedRoles={["admin", "gerente", "hostess", "promoter", "recepção"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="mx-auto w-full max-w-6xl px-3 py-3 md:px-4 md:py-5">
          <div className="mb-2 rounded-lg border border-white/20 bg-white/10 p-2 text-white shadow-lg backdrop-blur-sm md:mb-4 md:rounded-xl md:p-4">
            <div className="flex items-center justify-between gap-2 md:flex-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-sm font-semibold md:text-xl md:font-bold lg:text-3xl">
                    Fluxo Rooftop - Recepção 2
                  </h1>
                  {lastUpdatedAt && (
                    <span className="shrink-0 text-[10px] text-gray-400 md:text-xs md:text-gray-300">
                      {lastUpdatedAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 hidden text-sm text-gray-200 md:block">
                  Fila em tempo real de clientes com check-in no térreo
                </p>
                <p className="mt-0.5 hidden text-xs text-gray-300 md:block lg:text-sm">
                  {rooftopEstablishmentName || "Reserva Rooftop"} - Hoje (
                  {todayDateKey.split("-").reverse().join("/")})
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadTodayData(true)}
                disabled={loading || refreshing || !canRenderQueue}
                className="shrink-0 rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex md:items-center md:gap-2 md:rounded-lg md:px-4 md:py-3 md:text-sm md:font-semibold"
                title="Atualizar agora"
              >
                <MdRefresh className={refreshing ? "animate-spin" : ""} size={20} />
                <span className="hidden md:inline">Atualizar agora</span>
              </button>
            </div>
          </div>

          <div className="sticky top-0 z-30 mb-2 md:mb-4">
            <RooftopUnifiedStatsHeader
              areaPeopleTotal={unifiedMetrics.areaPeopleTotal}
              areasBreakdown={unifiedMetrics.areasBreakdown}
              reservationsCheckedIn={unifiedMetrics.reservationsCheckedIn}
              reservationsTotal={unifiedMetrics.reservationsTotal}
              totalPeopleExpected={unifiedMetrics.totalPeopleExpected}
              loading={loading}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {conductionError && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-100">
              {conductionError}
            </div>
          )}

          {!loading && !establishmentsLoading && !canRenderQueue && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100">
              Nenhum estabelecimento Reserva Rooftop foi encontrado nas permissoes
              deste usuario.
            </div>
          )}

          {loading && canRenderQueue && (
            <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center text-white">
              <MdRefresh className="mx-auto animate-spin" size={36} />
              <p className="mt-3 text-base">Carregando fila do dia...</p>
            </div>
          )}

          {!loading && canRenderQueue && queueItems.length === 0 && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center text-green-100">
              <MdCheckCircle className="mx-auto mb-3" size={42} />
              <p className="text-lg font-semibold">Fila vazia</p>
              <p className="mt-2 text-sm text-green-200">
                Nao ha clientes aguardando conducao no momento.
              </p>
            </div>
          )}

          {!loading && canRenderQueue && queueItems.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <AnimatePresence initial={false}>
                {queueItems.map((item) => (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-white/20 bg-white p-4 shadow-xl md:p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {item.statusLabel}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {item.subareaLabel}
                          </span>
                        </div>

                        <h2 className="truncate text-xl font-extrabold text-gray-900 md:text-2xl">
                          {item.name}
                        </h2>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-700 md:text-base">
                          <span className="inline-flex items-center gap-1">
                            <MdTableBar size={18} />
                            {item.tableLabel}
                          </span>
                          {item.checkinTime && (
                            <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">
                              Check-in{" "}
                              {new Date(item.checkinTime).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmConduction(item)}
                        disabled={conductionSuccessId === item.id}
                        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-green-700 active:scale-[0.99] disabled:opacity-70 md:min-w-[260px]"
                      >
                        <MdDirectionsWalk size={20} />
                        {conductionSuccessId === item.id
                          ? "Conduzido!"
                          : "CONFIRMAR CONDUCAO"}
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </WithPermission>
  );
}
