"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { CalendarEventCard } from "../../../components/justino360/CalendarEventCard";
import {
  CalendarEventForm,
  CalendarEventPayload,
} from "../../../components/justino360/CalendarEventForm";
import {
  CALENDAR_EVENT_TYPES,
  J360CalendarEvent,
  J360CalendarSector,
} from "../../../components/justino360/calendarMeta";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";

type Scope = "active" | "all";

const WINDOW_OPTIONS = [
  { value: "14", label: "Próximos 14 dias" },
  { value: "30", label: "Próximos 30 dias" },
  { value: "90", label: "Próximos 90 dias" },
] as const;

const CONTROL =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";

export default function AdminCalendarioPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360CalendarEvent[]>([]);
  const [sectors, setSectors] = useState<J360CalendarSector[]>([]);
  const [days, setDays] = useState<string>("30");
  const [eventType, setEventType] = useState<string>("");
  const [scope, setScope] = useState<Scope>("active");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<J360CalendarEvent | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const query = useMemo(() => {
    const params = new URLSearchParams({ days, scope });
    if (eventType) params.set("event_type", eventType);
    return params.toString();
  }, [days, eventType, scope]);

  const load = useCallback(() => {
    setLoading(true);
    j360Fetch<J360CalendarEvent[]>(`/calendar?${query}`)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
        else
          setFeedback({
            tone: "error",
            text: res.message || "Falha ao carregar o calendário.",
          });
      })
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed) return;
    j360Fetch<J360CalendarSector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, [allowed]);

  async function handleSubmit(payload: CalendarEventPayload) {
    const path = editing ? `/calendar/${editing.id}` : "/calendar";
    const res = await j360Fetch<J360CalendarEvent>(path, {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao salvar evento." });
      return false;
    }
    setFeedback({
      tone: "ok",
      text: editing
        ? "Evento atualizado — a equipe vê o briefing novo na agenda."
        : "Evento publicado no calendário da operação.",
    });
    setEditing(null);
    load();
    return true;
  }

  async function cancelEvent(event: J360CalendarEvent) {
    const res = await j360Fetch(`/calendar/${event.id}`, { method: "DELETE" });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao cancelar evento." });
      return;
    }
    setFeedback({ tone: "ok", text: "Evento cancelado (segue no histórico)." });
    if (editing?.id === event.id) setEditing(null);
    load();
  }

  async function reactivateEvent(event: J360CalendarEvent) {
    const res = await j360Fetch(`/calendar/${event.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: true }),
    });
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao reativar evento." });
      return;
    }
    setFeedback({ tone: "ok", text: "Evento reativado." });
    load();
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Calendário operacional">
        <p className="mb-6 max-w-3xl text-sm text-gray-300">
          O que o Marketing planeja aqui chega traduzido para cada setor na agenda
          da equipe. Marque os setores impactados e o sistema monta o briefing.
        </p>

        {feedback && (
          <p
            role="status"
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              feedback.tone === "ok"
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-red-500/15 text-red-200"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <CalendarEventForm
          sectors={sectors}
          editing={editing}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            className={CONTROL}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-label="Janela de datas"
          >
            {WINDOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={CONTROL}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos os tipos</option>
            {CALENDAR_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className={CONTROL}
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            aria-label="Filtrar por situação"
          >
            <option value="active">Vigentes</option>
            <option value="all">Todos (inclui cancelados)</option>
          </select>
        </div>

        <ul className="space-y-3">
          {items.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(event);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Editar
                  </button>
                  {event.is_active === false ? (
                    <button
                      type="button"
                      onClick={() => reactivateEvent(event)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Reativar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cancelEvent(event)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-red-500/20 hover:text-red-200"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </ul>

        {loading && <p className="text-sm text-gray-400">Carregando calendário…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-400">
            Nenhum evento na janela selecionada.
          </p>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
