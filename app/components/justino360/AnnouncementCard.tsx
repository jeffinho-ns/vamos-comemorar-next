"use client";

import { ReactNode } from "react";
import { formatDateTime, priorityClass } from "../../lib/justino360/labels";
import { J360Announcement, priorityLabel } from "./announcementMeta";

/** Cartão de comunicado reaproveitado pelas telas de gestão e de equipe. */
export function AnnouncementCard({
  item,
  actions,
  showCounts = false,
}: {
  item: J360Announcement;
  actions?: ReactNode;
  showCounts?: boolean;
}) {
  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{item.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(item.priority)}`}
            >
              {priorityLabel(item.priority)}
            </span>
            <span className="rounded-md bg-black/30 px-2 py-0.5 text-xs text-gray-400">
              {item.sector_name || "Geral"}
            </span>
            {item.requires_ack && (
              <span className="rounded-md bg-black/30 px-2 py-0.5 text-xs text-gray-400">
                Exige ciência
              </span>
            )}
            {!item.is_active && (
              <span className="rounded-md bg-black/30 px-2 py-0.5 text-xs text-gray-400">
                Encerrado
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{item.body}</p>
          <p className="mt-2 text-xs text-gray-500">
            {item.published_at ? `Publicado em ${formatDateTime(item.published_at)}` : ""}
            {item.created_by_name ? ` · por ${item.created_by_name}` : ""}
            {item.expires_at ? ` · expira em ${formatDateTime(item.expires_at)}` : ""}
          </p>
          {showCounts && (
            <p className="mt-1 text-xs text-gray-400">
              {item.ack_count ?? 0} confirmaram ciência · {item.read_count ?? 0} leram ·{" "}
              {item.receipts_count ?? 0} receberam
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {item.acked_at ? (
            <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              Ciência em {formatDateTime(item.acked_at)}
            </span>
          ) : (
            item.requires_ack && (
              <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                Sua ciência pendente
              </span>
            )
          )}
          {actions}
        </div>
      </div>
    </li>
  );
}
