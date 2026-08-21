"use client";

import { FormEvent, useState } from "react";
import { ANNOUNCEMENT_PRIORITIES } from "./announcementMeta";
import { J360Sector } from "./documentMeta";

export type AnnouncementPayload = {
  title: string;
  body: string;
  priority: string;
  sector_id: number | null;
  requires_ack: boolean;
  expires_at: string | null;
};

const FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

export function AnnouncementForm({
  sectors,
  onSubmit,
}: {
  sectors: J360Sector[];
  onSubmit: (payload: AnnouncementPayload) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sectorId, setSectorId] = useState("");
  const [requiresAck, setRequiresAck] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      body: body.trim(),
      priority,
      sector_id: sectorId ? Number(sectorId) : null,
      requires_ack: requiresAck,
      expires_at: expiresAt || null,
    });
    setSaving(false);
    if (ok) {
      setTitle("");
      setBody("");
      setPriority("normal");
      setSectorId("");
      setRequiresAck(true);
      setExpiresAt("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <h2 className="font-medium">Novo comunicado</h2>

      <div>
        <label className={LABEL} htmlFor="j360-ann-title">
          Título
        </label>
        <input
          id="j360-ann-title"
          className={FIELD}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Novo procedimento de fechamento do caixa"
          required
        />
      </div>

      <div>
        <label className={LABEL} htmlFor="j360-ann-body">
          Mensagem
        </label>
        <textarea
          id="j360-ann-body"
          className={FIELD}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="j360-ann-priority">
            Prioridade
          </label>
          <select
            id="j360-ann-priority"
            className={FIELD}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {ANNOUNCEMENT_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-ann-sector">
            Setor
          </label>
          <select
            id="j360-ann-sector"
            className={FIELD}
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
          >
            <option value="">Geral (todos)</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="j360-ann-expires">
            Expira em (opcional)
          </label>
          <input
            id="j360-ann-expires"
            type="datetime-local"
            className={FIELD}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={requiresAck}
          onChange={(e) => setRequiresAck(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500"
        />
        Exigir confirmação de ciência da equipe
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {saving ? "Publicando…" : "Publicar comunicado"}
      </button>
    </form>
  );
}
