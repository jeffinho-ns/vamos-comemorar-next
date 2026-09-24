"use client";

import { useState } from "react";
import { formatDateTime } from "../../lib/justino360/labels";
import {
  J360MyTraining,
  roleLabel,
  statusLabel,
  trainingStatusClass,
  validityHint,
} from "./trainingMeta";

function trainingStatusClassLight(status?: string | null): string {
  switch (status) {
    case "concluido":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "vencido":
      return "bg-red-50 text-red-700 ring-red-200";
    case "em_andamento":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "pendente":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-stone-100 text-slate-600 ring-stone-200";
  }
}

/**
 * Card do treinamento na visão da equipe: abre o conteúdo (o que já registra
 * "em andamento" na API) e marca conclusão.
 */
export function TrainingCard({
  item,
  onOpen,
  onComplete,
  tone = "dark",
}: {
  item: J360MyTraining;
  onOpen: (item: J360MyTraining) => void;
  onComplete: (item: J360MyTraining) => Promise<void>;
  tone?: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasContent = Boolean(item.content_url || item.content_body);
  const light = tone === "light";

  const shell = light
    ? "rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "rounded-xl bg-white/5 p-4 ring-1 ring-white/10";
  const desc = light ? "text-slate-500" : "text-gray-400";
  const meta = light ? "text-slate-500" : "text-gray-500";
  const secondary = light
    ? "rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-stone-50"
    : "rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20";
  const primary = light
    ? "rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-60"
    : "rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60";
  const contentBox = light
    ? "mt-3 whitespace-pre-line rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-relaxed text-slate-700"
    : "mt-3 whitespace-pre-line rounded-lg bg-black/30 p-3 text-sm leading-relaxed text-gray-200";
  const mandatory = light
    ? "ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
    : "ml-2 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200";

  async function handleComplete() {
    if (saving) return;
    setSaving(true);
    await onComplete(item);
    setSaving(false);
  }

  return (
    <li className={shell}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <p className={`font-medium ${light ? "text-slate-900" : ""}`}>
            {item.title}
            {item.is_mandatory && <span className={mandatory}>obrigatório</span>}
          </p>
          {item.description && <p className={`mt-1 text-sm ${desc}`}>{item.description}</p>}
          <p className={`mt-2 flex flex-wrap items-center gap-2 text-xs ${meta}`}>
            <span
              className={`rounded-md px-2 py-0.5 ring-1 ${
                light ? trainingStatusClassLight(item.status) : trainingStatusClass(item.status)
              }`}
            >
              {statusLabel(item.status)}
            </span>
            <span>{roleLabel(item.role_key)}</span>
            {item.due_at && <span>prazo {formatDateTime(item.due_at)}</span>}
            {item.status === "concluido" && item.completed_at && (
              <span>concluído {formatDateTime(item.completed_at)}</span>
            )}
            {item.expires_at && <span>{validityHint(null, item.days_until_expiry)}</span>}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {item.content_url && (
            <a
              href={item.content_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpen(item)}
              className={secondary}
            >
              Abrir material
            </a>
          )}
          {item.content_body && (
            <button
              type="button"
              onClick={() => {
                if (!open) onOpen(item);
                setOpen(!open);
              }}
              className={secondary}
            >
              {open ? "Fechar conteúdo" : "Ler conteúdo"}
            </button>
          )}
          {item.status !== "concluido" && (
            <button type="button" onClick={handleComplete} disabled={saving} className={primary}>
              {saving
                ? "Salvando…"
                : item.status === "vencido"
                  ? "Refiz o treinamento"
                  : "Marcar concluído"}
            </button>
          )}
        </div>
      </div>

      {open && item.content_body && <div className={contentBox}>{item.content_body}</div>}

      {!hasContent && (
        <p className={`mt-3 text-xs ${meta}`}>
          Treinamento presencial — combine com a gerência e marque como concluído depois.
        </p>
      )}
    </li>
  );
}
