"use client";

import { useState } from "react";
import {
  MAINTENANCE_IN_PROGRESS_STATUSES,
  MAINTENANCE_KIND_LABEL,
  MAINTENANCE_STATUS_LABEL,
  formatDateTime,
  maintenanceStatusClass,
} from "../../lib/justino360/labels";
import type { J360Maintenance, MaintenanceStatus } from "../../lib/justino360/types";
import { EvidenceField } from "./EvidenceField";

export type TicketUpdate = {
  status?: MaintenanceStatus;
  evidence_url?: string;
  resolution?: string;
};

/**
 * Chamado da fila. Concluir exige evidência — a API recusa sem foto/laudo,
 * então o botão só libera depois do upload.
 */
export function MaintenanceTicketCard({
  ticket,
  busy,
  onUpdate,
}: {
  ticket: J360Maintenance;
  busy?: boolean;
  onUpdate: (id: number, update: TicketUpdate) => Promise<boolean>;
}) {
  const [closing, setClosing] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState(ticket.evidence_url || "");
  const [resolution, setResolution] = useState("");

  const overdue =
    !!ticket.due_at &&
    new Date(ticket.due_at).getTime() < Date.now() &&
    ticket.status !== "concluida";

  async function conclude() {
    const ok = await onUpdate(ticket.id, {
      status: "concluida",
      evidence_url: evidenceUrl || undefined,
      resolution: resolution.trim() || undefined,
    });
    if (ok) {
      setClosing(false);
      setResolution("");
    }
  }

  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{ticket.title}</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 ring-1 ring-white/20">
              {MAINTENANCE_KIND_LABEL[ticket.kind] || ticket.kind}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${maintenanceStatusClass(ticket.status)}`}
            >
              {MAINTENANCE_STATUS_LABEL[ticket.status] || ticket.status}
            </span>
            {overdue && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200 ring-1 ring-red-500/40">
                Atrasado
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {ticket.asset_name || "Equipamento"}
            {ticket.asset_location ? ` · ${ticket.asset_location}` : ""} ·{" "}
            {formatDateTime(ticket.created_at)}
            {ticket.created_by_name ? ` · por ${ticket.created_by_name}` : ""}
          </p>
          {ticket.description && (
            <p className="mt-1 text-sm text-gray-300">{ticket.description}</p>
          )}
          {ticket.due_at && (
            <p className="mt-1 text-xs text-gray-500">
              Prazo: {formatDateTime(ticket.due_at)}
            </p>
          )}
          {ticket.resolution && (
            <p className="mt-1 text-xs text-emerald-300">Serviço: {ticket.resolution}</p>
          )}
          {ticket.performed_at && (
            <p className="mt-1 text-xs text-gray-500">
              Concluído em {formatDateTime(ticket.performed_at)}
              {ticket.performed_by_name ? ` por ${ticket.performed_by_name}` : ""}
            </p>
          )}
          {ticket.evidence_url && (
            <a
              href={ticket.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-amber-300 underline"
            >
              Ver evidência
            </a>
          )}
        </div>

        {ticket.status !== "concluida" && ticket.status !== "cancelada" && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <label htmlFor={`st-${ticket.id}`} className="sr-only">
              Status do chamado
            </label>
            <select
              id={`st-${ticket.id}`}
              value={ticket.status}
              disabled={busy}
              onChange={(e) =>
                onUpdate(ticket.id, { status: e.target.value as MaintenanceStatus })
              }
              className="rounded-lg bg-black/30 px-2 py-1.5 text-sm ring-1 ring-white/10"
            >
              {MAINTENANCE_IN_PROGRESS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MAINTENANCE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setClosing((v) => !v)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
            >
              Concluir
            </button>
          </div>
        )}
      </div>

      {closing && (
        <div className="mt-3 space-y-3 rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
          <EvidenceField value={evidenceUrl} onChange={setEvidenceUrl} disabled={busy} />
          <div>
            <label
              htmlFor={`res-${ticket.id}`}
              className="mb-1 block text-xs text-gray-400"
            >
              O que foi feito
            </label>
            <textarea
              id={`res-${ticket.id}`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              maxLength={4000}
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={conclude}
              disabled={busy || !evidenceUrl}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-gray-900 disabled:opacity-50"
            >
              Concluir chamado
            </button>
            <button
              type="button"
              onClick={() => setClosing(false)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
          {!evidenceUrl && (
            <p className="text-xs text-gray-500">
              Anexe a foto do serviço ou o laudo para liberar a conclusão.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
