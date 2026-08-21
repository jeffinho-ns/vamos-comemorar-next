"use client";

import { ReactNode } from "react";
import { formatDateTime } from "../../lib/justino360/labels";
import {
  J360CalendarEvent,
  eventTypeClass,
  eventTypeLabel,
  relativeDayLabel,
} from "./calendarMeta";

/**
 * Card de evento do calendário operacional.
 * `highlightSector` destaca o impacto no setor da pessoa que está lendo.
 */
export function CalendarEventCard({
  event,
  highlightSectorId,
  actions,
}: {
  event: J360CalendarEvent;
  highlightSectorId?: number | null;
  actions?: ReactNode;
}) {
  const sectors = event.impact_sectors ?? [];
  const impactsMe =
    highlightSectorId != null && sectors.some((s) => s.id === highlightSectorId);
  const cancelled = event.is_active === false;

  return (
    <li
      className={`rounded-xl p-4 ring-1 ${
        cancelled
          ? "bg-white/[0.02] ring-white/5"
          : impactsMe
            ? "bg-amber-500/10 ring-amber-500/30"
            : "bg-white/5 ring-white/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs ring-1 ${eventTypeClass(event.event_type)}`}
            >
              {eventTypeLabel(event.event_type)}
            </span>
            {cancelled && (
              <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-200 ring-1 ring-red-500/30">
                Cancelado
              </span>
            )}
            {impactsMe && !cancelled && (
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100 ring-1 ring-amber-400/40">
                Impacta seu setor
              </span>
            )}
          </div>
          <p
            className={`mt-1 font-medium ${cancelled ? "text-gray-400 line-through" : ""}`}
          >
            {event.title}
          </p>
          <p className="text-sm text-gray-400">
            {relativeDayLabel(event.starts_at)} · {formatDateTime(event.starts_at)}
            {event.ends_at ? ` → ${formatDateTime(event.ends_at)}` : ""}
          </p>
        </div>
        {actions}
      </div>

      {event.description && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
          {event.description}
        </p>
      )}

      {sectors.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {sectors.map((sector) => (
            <li
              key={sector.id}
              className={`rounded-md px-2 py-0.5 text-xs ring-1 ${
                sector.id === highlightSectorId
                  ? "bg-amber-500/25 text-amber-100 ring-amber-400/40"
                  : "bg-white/5 text-gray-300 ring-white/10"
              }`}
            >
              {sector.name}
            </li>
          ))}
        </ul>
      )}

      {impactsMe && event.sector_briefing && (
        <p className="mt-3 rounded-lg bg-black/30 px-3 py-2 text-sm text-amber-100">
          <span className="font-medium">No seu setor: </span>
          {event.sector_briefing}
        </p>
      )}

      {event.briefing && (
        <details className="mt-3 rounded-lg bg-black/20 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-gray-400">
            Briefing por setor
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
            {event.briefing}
          </p>
        </details>
      )}

      {event.materials_url && (
        <a
          href={event.materials_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs text-amber-400 hover:underline"
        >
          Abrir material de apoio
        </a>
      )}
    </li>
  );
}
