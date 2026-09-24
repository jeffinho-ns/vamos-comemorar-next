"use client";

import { ReactNode } from "react";
import { formatDateTime, priorityClass } from "../../lib/justino360/labels";
import { J360Announcement, priorityLabel } from "./announcementMeta";

function priorityClassLight(priority: string): string {
  switch (priority) {
    case "critica":
      return "bg-red-50 text-red-700 ring-red-200";
    case "alta":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "baixa":
      return "bg-stone-100 text-slate-600 ring-stone-200";
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200";
  }
}

/** Cartão de comunicado reaproveitado pelas telas de gestão e de equipe. */
export function AnnouncementCard({
  item,
  actions,
  showCounts = false,
  tone = "dark",
}: {
  item: J360Announcement;
  actions?: ReactNode;
  showCounts?: boolean;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const shell = light
    ? "rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "rounded-xl bg-white/5 p-4 ring-1 ring-white/10";
  const badge = light
    ? "rounded-md bg-stone-100 px-2 py-0.5 text-xs text-slate-600"
    : "rounded-md bg-black/30 px-2 py-0.5 text-xs text-gray-400";
  const body = light ? "text-slate-600" : "text-gray-300";
  const meta = light ? "text-slate-500" : "text-gray-500";
  const ackOk = light
    ? "rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
    : "rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300";
  const ackPending = light
    ? "rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800"
    : "rounded-lg bg-amber-500/20 px-2 py-1 text-xs text-amber-300";

  return (
    <li className={shell}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`font-medium ${light ? "text-slate-900" : ""}`}>{item.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${
                light ? priorityClassLight(item.priority) : priorityClass(item.priority)
              }`}
            >
              {priorityLabel(item.priority)}
            </span>
            <span className={badge}>{item.sector_name || "Geral"}</span>
            {item.requires_ack && <span className={badge}>Exige ciência</span>}
            {!item.is_active && <span className={badge}>Encerrado</span>}
          </div>
          <p className={`mt-2 whitespace-pre-wrap text-sm ${body}`}>{item.body}</p>
          <p className={`mt-2 text-xs ${meta}`}>
            {item.published_at ? `Publicado em ${formatDateTime(item.published_at)}` : ""}
            {item.created_by_name ? ` · por ${item.created_by_name}` : ""}
            {item.expires_at ? ` · expira em ${formatDateTime(item.expires_at)}` : ""}
          </p>
          {showCounts && (
            <p className={`mt-1 text-xs ${meta}`}>
              {item.ack_count ?? 0} confirmaram ciência · {item.read_count ?? 0} leram ·{" "}
              {item.receipts_count ?? 0} receberam
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {item.acked_at ? (
            <span className={ackOk}>Ciência em {formatDateTime(item.acked_at)}</span>
          ) : (
            item.requires_ack && <span className={ackPending}>Sua ciência pendente</span>
          )}
          {actions}
        </div>
      </div>
    </li>
  );
}
