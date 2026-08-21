"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarEventCard } from "../../components/justino360/CalendarEventCard";
import {
  J360CalendarEvent,
  J360CalendarSector,
  dayLabel,
} from "../../components/justino360/calendarMeta";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

/** O setor fica no aparelho: a equipe usa tablet compartilhado, não tem UEP por setor. */
const SECTOR_STORAGE_KEY = "j360:agenda:sector";

const WINDOWS = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
] as const;

const CONTROL =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";

export default function StaffAgendaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360CalendarEvent[]>([]);
  const [sectors, setSectors] = useState<J360CalendarSector[]>([]);
  const [sectorId, setSectorId] = useState<string>("");
  const [onlySector, setOnlySector] = useState(false);
  const [days, setDays] = useState<string>("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SECTOR_STORAGE_KEY);
    if (stored) setSectorId(stored);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    j360Fetch<J360CalendarSector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    // sector_id só acrescenta o impacto do setor; only_sector é que filtra.
    const params = new URLSearchParams({ days });
    if (sectorId) {
      params.set("sector_id", sectorId);
      if (onlySector) params.set("only_sector", "true");
    }
    j360Fetch<J360CalendarEvent[]>(`/calendar?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else setError(res.message || "Não foi possível carregar a agenda.");
      })
      .catch(() => setError("Não foi possível carregar a agenda."))
      .finally(() => setLoading(false));
  }, [days, sectorId, onlySector]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  function handleSectorChange(value: string) {
    setSectorId(value);
    if (value) {
      window.localStorage.setItem(SECTOR_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(SECTOR_STORAGE_KEY);
      setOnlySector(false);
    }
  }

  const highlightSectorId = sectorId ? Number(sectorId) : null;

  /** Agrupa por dia: a equipe lê a agenda como escala, não como lista solta. */
  const grouped = useMemo(() => {
    const map = new Map<string, J360CalendarEvent[]>();
    for (const event of items) {
      const key = dayLabel(event.starts_at);
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return [...map.entries()];
  }, [items]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Agenda">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className={CONTROL}
          value={sectorId}
          onChange={(e) => handleSectorChange(e.target.value)}
          aria-label="Meu setor"
        >
          <option value="">Agenda geral (todos os setores)</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              Meu setor: {sector.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1" role="group" aria-label="Janela da agenda">
          {WINDOWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDays(option.value)}
              aria-pressed={days === option.value}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                days === option.value
                  ? "bg-amber-500 text-gray-900"
                  : "bg-white/5 text-gray-200 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {sectorId && (
        <label className="mb-3 flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={onlySector}
            onChange={(e) => setOnlySector(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500"
          />
          Mostrar só o que impacta o meu setor
        </label>
      )}

      <p className="mb-4 text-sm text-gray-400">
        {sectorId
          ? "Eventos que impactam o seu setor aparecem destacados, com o que muda na prática."
          : "Escolha o seu setor acima para ver o impacto de cada evento no seu dia."}
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="space-y-6">
        {grouped.map(([day, events]) => (
          <section key={day}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-400/90">
              {day}
            </h2>
            <ul className="space-y-3">
              {events.map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  highlightSectorId={highlightSectorId}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Carregando agenda…</p>}
      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-gray-400">
          Nada marcado para os próximos {days} dias.
        </p>
      )}
    </Justino360Shell>
  );
}
