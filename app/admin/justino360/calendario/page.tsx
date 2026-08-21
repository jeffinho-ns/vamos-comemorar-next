"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

type CalendarEvent = {
  id: number;
  title: string;
  starts_at: string;
  event_type: string;
  description?: string;
  briefing?: string;
};

export default function AdminCalendarioPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [eventType, setEventType] = useState("evento");
  const [description, setDescription] = useState("");

  const load = useCallback(() => {
    j360Fetch<CalendarEvent[]>("/calendar").then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await j360Fetch("/calendar", {
      method: "POST",
      body: JSON.stringify({
        title,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
        event_type: eventType,
        description: description || undefined,
      }),
    });
    if (res.success) {
      setTitle("");
      setStartsAt("");
      setEventType("evento");
      setDescription("");
      load();
    }
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Calendário operacional">
        <form
          onSubmit={onCreate}
          className="mb-8 space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
          <h2 className="font-medium">Novo evento</h2>
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Tipo (evento, show, privado…)"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Criar
          </button>
        </form>
        <ul className="space-y-3">
          {items.map((ev) => (
            <li key={ev.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-medium">{ev.title}</p>
              <p className="text-sm text-gray-400">
                {ev.event_type} ·{" "}
                {new Date(ev.starts_at).toLocaleString("pt-BR")}
              </p>
              {ev.description && (
                <p className="mt-1 text-sm text-gray-300">{ev.description}</p>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400">Nenhum evento nos próximos 30 dias.</p>
          )}
        </ul>
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
