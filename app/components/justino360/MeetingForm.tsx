"use client";

import { FormEvent, useId, useRef, useState } from "react";
import { J360CalendarSector } from "./calendarMeta";
import {
  J360Assignee,
  MeetingDecisionFields,
} from "./MeetingDecisionFields";
import {
  DecisionDraft,
  DecisionPayload,
  emptyDecisionDraft,
  toDecisionPayload,
} from "./meetingMeta";

export type MeetingPayload = {
  title: string;
  meeting_at: string | null;
  attendees: string | null;
  minutes: string | null;
  decisions: DecisionPayload[];
};

const FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

export function MeetingForm({
  sectors,
  assignees,
  onSubmit,
}: {
  sectors: J360CalendarSector[];
  assignees: J360Assignee[];
  onSubmit: (payload: MeetingPayload) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [attendees, setAttendees] = useState("");
  const [minutes, setMinutes] = useState("");
  const [drafts, setDrafts] = useState<DecisionDraft[]>([emptyDecisionDraft(0)]);
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(1);
  const formId = useId();

  function addDraft() {
    setDrafts((prev) => [...prev, emptyDecisionDraft(nextKey.current++)]);
  }

  function updateDraft(key: number, patch: Partial<DecisionDraft>) {
    setDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function resetForm() {
    setTitle("");
    setMeetingAt("");
    setAttendees("");
    setMinutes("");
    setDrafts([emptyDecisionDraft(nextKey.current++)]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const decisions = drafts
      .filter((draft) => draft.decision.trim().length > 0)
      .map(toDecisionPayload);
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null,
      attendees: attendees.trim() || null,
      minutes: minutes.trim() || null,
      decisions,
    });
    setSaving(false);
    if (ok) resetForm();
  }

  const filledDecisions = drafts.filter((d) => d.decision.trim().length > 0).length;

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <h2 className="font-medium">Nova reunião</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="j360-meet-title">
            Assunto
          </label>
          <input
            id="j360-meet-title"
            className={FIELD}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Alinhamento semanal de operação"
            required
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-meet-at">
            Data e hora (padrão: agora)
          </label>
          <input
            id="j360-meet-at"
            type="datetime-local"
            className={FIELD}
            value={meetingAt}
            onChange={(e) => setMeetingAt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-meet-attendees">
          Presentes (opcional)
        </label>
        <input
          id="j360-meet-attendees"
          className={FIELD}
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="Nomes separados por vírgula"
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-meet-minutes">
          Ata
        </label>
        <textarea
          id="j360-meet-minutes"
          className={FIELD}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          rows={5}
          placeholder="O que foi conversado, contexto e combinados."
        />
      </div>

      <fieldset className="space-y-3">
        <legend className={LABEL}>
          Decisões{filledDecisions > 0 ? ` (${filledDecisions})` : ""}
        </legend>
        <ul className="space-y-3">
          {drafts.map((draft, index) => (
            <MeetingDecisionFields
              key={draft.key}
              index={index}
              idPrefix={`${formId}-d${draft.key}`}
              draft={draft}
              sectors={sectors}
              assignees={assignees}
              canRemove={drafts.length > 1}
              onChange={(patch) => updateDraft(draft.key, patch)}
              onRemove={() =>
                setDrafts((prev) => prev.filter((d) => d.key !== draft.key))
              }
            />
          ))}
        </ul>
        <button
          type="button"
          onClick={addDraft}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        >
          + Adicionar decisão
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar ata e gerar tarefas"}
      </button>
    </form>
  );
}
