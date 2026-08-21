"use client";

import { useCallback, useEffect, useState } from "react";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";

type CalendarEvent = {
  id: number;
  title: string;
  starts_at: string;
  event_type: string;
  description?: string;
  briefing?: string;
};

export default function StaffAgendaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<CalendarEvent[]>([]);

  const load = useCallback(() => {
    j360Fetch<CalendarEvent[]>("/calendar").then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Agenda">
      <ul className="space-y-3">
        {items.map((ev) => (
          <li key={ev.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="font-medium">{ev.title}</p>
            <p className="text-sm text-gray-400">
              {ev.event_type} · {new Date(ev.starts_at).toLocaleString("pt-BR")}
            </p>
            {ev.description && (
              <p className="mt-1 text-sm text-gray-300">{ev.description}</p>
            )}
            {ev.briefing && (
              <p className="mt-2 whitespace-pre-wrap text-xs text-gray-500">{ev.briefing}</p>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum evento nos próximos 30 dias.</p>
        )}
      </ul>
    </Justino360Shell>
  );
}
