"use client";

import { FormEvent, useState } from "react";
import { MAINTENANCE_KIND_LABEL } from "../../lib/justino360/labels";
import type { J360Asset, MaintenanceKind } from "../../lib/justino360/types";

export type TicketFormValues = {
  asset_id: number;
  kind: MaintenanceKind;
  title: string;
  description?: string;
  due_at?: string;
};

const FIELD_CLASS =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400";

/** Abertura de chamado: corretiva, preventiva ou inspeção. */
export function MaintenanceTicketForm({
  assets,
  busy,
  onSubmit,
}: {
  assets: J360Asset[];
  busy?: boolean;
  onSubmit: (values: TicketFormValues) => Promise<boolean>;
}) {
  const [assetId, setAssetId] = useState("");
  const [kind, setKind] = useState<MaintenanceKind>("corretiva");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = Number(assetId);
    if (!id) return;
    const ok = await onSubmit({
      asset_id: id,
      kind,
      title: title.trim(),
      description: description.trim() || undefined,
      due_at: dueAt || undefined,
    });
    if (!ok) return;
    setTitle("");
    setDescription("");
    setDueAt("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
    >
      <h2 className="font-medium">Abrir chamado</h2>
      <div>
        <label htmlFor="ticket-asset" className="mb-1 block text-xs text-gray-400">
          Equipamento
        </label>
        <select
          id="ticket-asset"
          className={FIELD_CLASS}
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          required
        >
          <option value="">Selecione o equipamento</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.location ? ` — ${a.location}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ticket-kind" className="mb-1 block text-xs text-gray-400">
            Tipo
          </label>
          <select
            id="ticket-kind"
            className={FIELD_CLASS}
            value={kind}
            onChange={(e) => setKind(e.target.value as MaintenanceKind)}
          >
            {(Object.keys(MAINTENANCE_KIND_LABEL) as MaintenanceKind[]).map((k) => (
              <option key={k} value={k}>
                {MAINTENANCE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ticket-due" className="mb-1 block text-xs text-gray-400">
            Prazo
          </label>
          <input
            id="ticket-due"
            type="date"
            className={FIELD_CLASS}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      </div>
      <input
        className={FIELD_CLASS}
        placeholder="Título (ex: chopeira não gela)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        required
      />
      <textarea
        className={FIELD_CLASS}
        placeholder="O que está acontecendo"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        maxLength={4000}
      />
      <button
        type="submit"
        disabled={busy || assets.length === 0}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
      >
        Abrir chamado
      </button>
      {assets.length === 0 && (
        <p className="text-xs text-gray-400">
          Cadastre um equipamento antes de abrir chamados.
        </p>
      )}
    </form>
  );
}
