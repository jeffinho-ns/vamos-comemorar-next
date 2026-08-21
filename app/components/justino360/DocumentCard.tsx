"use client";

import { ReactNode } from "react";
import { formatDateTime } from "../../lib/justino360/labels";
import { J360Document, categoryLabel, roleLabel } from "./documentMeta";

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "amber" | "muted" }) {
  const tones = {
    neutral: "bg-white/10 text-gray-200",
    amber: "bg-amber-500/20 text-amber-300",
    muted: "bg-black/30 text-gray-400",
  } as const;
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
  );
}

/** Cartão de documento reaproveitado pelas telas de gestão e de equipe. */
export function DocumentCard({
  doc,
  actions,
}: {
  doc: J360Document;
  actions?: ReactNode;
}) {
  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{doc.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="amber">{categoryLabel(doc.category)}</Badge>
            <Badge>v{doc.version}</Badge>
            <Badge tone="muted">{roleLabel(doc.role_key)}</Badge>
            {doc.sector_name && <Badge tone="muted">{doc.sector_name}</Badge>}
            {!doc.is_current && <Badge tone="muted">Arquivado</Badge>}
          </div>
          {doc.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{doc.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {doc.updated_at ? `Atualizado em ${formatDateTime(doc.updated_at)}` : ""}
            {doc.uploaded_by_name ? ` · por ${doc.uploaded_by_name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {doc.file_url ? (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-400"
            >
              Abrir arquivo
            </a>
          ) : (
            <span className="text-xs text-gray-500">Sem arquivo anexado</span>
          )}
          {actions}
        </div>
      </div>
    </li>
  );
}
