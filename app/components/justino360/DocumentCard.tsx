"use client";

import { ReactNode } from "react";
import { formatDateTime } from "../../lib/justino360/labels";
import { J360Document, categoryLabel, roleLabel } from "./documentMeta";

function Badge({
  children,
  tone = "neutral",
  light,
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "muted";
  light?: boolean;
}) {
  const dark = {
    neutral: "bg-white/10 text-gray-200",
    amber: "bg-amber-500/20 text-amber-300",
    muted: "bg-black/30 text-gray-400",
  } as const;
  const lite = {
    neutral: "bg-stone-100 text-slate-700",
    amber: "bg-amber-50 text-amber-800",
    muted: "bg-stone-50 text-slate-500",
  } as const;
  const tones = light ? lite : dark;
  return <span className={`rounded-md px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

/** Cartão de documento reaproveitado pelas telas de gestão e de equipe. */
export function DocumentCard({
  doc,
  actions,
  categoryLabelFn = categoryLabel,
  roleLabelFn = roleLabel,
  tone = "dark",
}: {
  doc: J360Document;
  actions?: ReactNode;
  categoryLabelFn?: (value: string) => string;
  roleLabelFn?: (value?: string | null) => string;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const shell = light
    ? "rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "rounded-xl bg-white/5 p-4 ring-1 ring-white/10";
  const desc = light ? "text-slate-600" : "text-gray-300";
  const meta = light ? "text-slate-500" : "text-gray-500";
  const cta = light
    ? "rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-500"
    : "rounded-lg bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-400";

  return (
    <li className={shell}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`font-medium ${light ? "text-slate-900" : ""}`}>{doc.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge light={light} tone="amber">
              {categoryLabelFn(doc.category)}
            </Badge>
            <Badge light={light}>v{doc.version}</Badge>
            <Badge light={light} tone="muted">
              {roleLabelFn(doc.role_key)}
            </Badge>
            {doc.sector_name && (
              <Badge light={light} tone="muted">
                {doc.sector_name}
              </Badge>
            )}
            {!doc.is_current && (
              <Badge light={light} tone="muted">
                Arquivado
              </Badge>
            )}
          </div>
          {doc.description && (
            <p className={`mt-2 whitespace-pre-wrap text-sm ${desc}`}>{doc.description}</p>
          )}
          <p className={`mt-2 text-xs ${meta}`}>
            {doc.updated_at ? `Atualizado em ${formatDateTime(doc.updated_at)}` : ""}
            {doc.uploaded_by_name ? ` · por ${doc.uploaded_by_name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {doc.file_url ? (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={cta}>
              Abrir arquivo
            </a>
          ) : (
            <span className={`text-xs ${meta}`}>Sem arquivo anexado</span>
          )}
          {actions}
        </div>
      </div>
    </li>
  );
}
