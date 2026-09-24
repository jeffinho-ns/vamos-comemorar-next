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

export function AnnouncementForm({
  sectors,
  onSubmit,
  tone = "dark",
}: {
  sectors: J360Sector[];
  onSubmit: (payload: AnnouncementPayload) => Promise<boolean>;
  tone?: "dark" | "light";
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sectorId, setSectorId] = useState("");
  const [requiresAck, setRequiresAck] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const light = tone === "light";
  const FIELD = light
    ? "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    : "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
  const LABEL = light
    ? "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
    : "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";
  const formShell = light
    ? "mb-8 space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "mb-8 space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10";
  const checkLabel = light ? "flex items-center gap-2 text-sm text-slate-700" : "flex items-center gap-2 text-sm text-gray-300";
  const checkInput = light
    ? "h-4 w-4 rounded border-stone-300 accent-teal-600"
    : "h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500";
  const submitBtn = light
    ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-60"
    : "rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60";

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
    <form onSubmit={handleSubmit} className={formShell}>
      <h2 className={`font-medium ${light ? "text-slate-900" : ""}`}>Novo comunicado</h2>

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

      <label className={checkLabel}>
        <input
          type="checkbox"
          checked={requiresAck}
          onChange={(e) => setRequiresAck(e.target.checked)}
          className={checkInput}
        />
        Exigir confirmação de ciência da equipe
      </label>

      <button type="submit" disabled={saving} className={submitBtn}>
        {saving ? "Publicando…" : "Publicar comunicado"}
      </button>
    </form>
  );
}
