"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CALENDAR_EVENT_TYPES,
  J360CalendarEvent,
  J360CalendarSector,
  toDateTimeLocal,
} from "./calendarMeta";
import { DocumentFileField } from "./DocumentFileField";

export type CalendarEventPayload = {
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  impact_sector_ids: number[];
  briefing: string | null;
  materials_url: string | null;
};

const FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

/**
 * Formulário de evento do calendário operacional (Marketing → Operação).
 * Briefing em branco = a API gera o texto por setor impactado.
 */
export function CalendarEventForm({
  sectors,
  editing,
  onSubmit,
  onCancelEdit,
}: {
  sectors: J360CalendarSector[];
  editing: J360CalendarEvent | null;
  onSubmit: (payload: CalendarEventPayload) => Promise<boolean>;
  onCancelEdit: () => void;
}) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string>("evento");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [briefing, setBriefing] = useState("");
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [sectorIds, setSectorIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setTitle("");
      setEventType("evento");
      setStartsAt("");
      setEndsAt("");
      setDescription("");
      setBriefing("");
      setMaterialsUrl("");
      setSectorIds([]);
      setError(null);
      return;
    }
    setTitle(editing.title);
    setEventType(editing.event_type);
    setStartsAt(toDateTimeLocal(editing.starts_at));
    setEndsAt(toDateTimeLocal(editing.ends_at));
    setDescription(editing.description || "");
    setBriefing(editing.briefing || "");
    setMaterialsUrl(editing.materials_url || "");
    setSectorIds(
      editing.impact_sectors?.map((s) => s.id) ?? editing.impact_sector_ids ?? [],
    );
    setError(null);
  }, [editing]);

  const selectedCount = sectorIds.length;
  const sortedSectors = useMemo(
    () => [...sectors].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [sectors],
  );

  function toggleSector(id: number) {
    setSectorIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (selectedCount === 0) {
      setError("Selecione ao menos um setor impactado.");
      return;
    }
    if (endsAt && startsAt && endsAt < startsAt) {
      setError("O término não pode ser antes do início.");
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      event_type: eventType,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      description: description.trim() || null,
      impact_sector_ids: sectorIds,
      briefing: briefing.trim() || null,
      materials_url: materialsUrl.trim() || null,
    });
    setSaving(false);
    if (ok && !editing) {
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setDescription("");
      setBriefing("");
      setMaterialsUrl("");
      setSectorIds([]);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">
          {editing ? `Editando “${editing.title}”` : "Novo evento no calendário"}
        </h2>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-gray-400 underline hover:text-gray-200"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-cal-title">
          Título
        </label>
        <input
          id="j360-cal-title"
          className={FIELD}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Campanha chopp dobrado de quinta"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="j360-cal-type">
            Tipo
          </label>
          <select
            id="j360-cal-type"
            className={FIELD}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            {CALENDAR_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-cal-start">
            Início
          </label>
          <input
            id="j360-cal-start"
            type="datetime-local"
            className={FIELD}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-cal-end">
            Término (opcional)
          </label>
          <input
            id="j360-cal-end"
            type="datetime-local"
            className={FIELD}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className={LABEL}>
          Setores impactados{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </legend>
        <div className="flex flex-wrap gap-2">
          {sortedSectors.map((sector) => {
            const active = sectorIds.includes(sector.id);
            return (
              <label
                key={sector.id}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs ring-1 transition ${
                  active
                    ? "bg-amber-500 text-gray-900 ring-amber-400"
                    : "bg-black/30 text-gray-300 ring-white/10 hover:bg-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => toggleSector(sector.id)}
                />
                {sector.name}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          A equipe de cada setor marcado recebe o briefing na agenda.
        </p>
      </fieldset>

      <div>
        <label className={LABEL} htmlFor="j360-cal-desc">
          Descrição para a operação (opcional)
        </label>
        <textarea
          id="j360-cal-desc"
          className={FIELD}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Contexto, público esperado, combinados com o cliente…"
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-cal-briefing">
          Briefing por setor
        </label>
        <textarea
          id="j360-cal-briefing"
          className={FIELD}
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          rows={4}
          placeholder="Deixe em branco para o sistema gerar o briefing pelos setores marcados."
        />
        <p className="mt-1 text-xs text-gray-500">
          Em branco, o sistema gera automaticamente conforme o tipo e os setores.
          Se você escrever aqui, o texto é preservado nas próximas edições.
        </p>
      </div>

      <DocumentFileField
        value={materialsUrl}
        onChange={setMaterialsUrl}
        disabled={saving}
        label="Material de apoio (arte, briefing em PDF, vídeo — até 15 MB)"
      />

      {error && (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {saving
          ? "Salvando…"
          : editing
            ? "Salvar alterações"
            : "Publicar no calendário"}
      </button>
    </form>
  );
}
