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

/**
 * Card do treinamento na visão da equipe: abre o conteúdo (o que já registra
 * "em andamento" na API) e marca conclusão.
 */
export function TrainingCard({
  item,
  onOpen,
  onComplete,
}: {
  item: J360MyTraining;
  onOpen: (item: J360MyTraining) => void;
  onComplete: (item: J360MyTraining) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasContent = Boolean(item.content_url || item.content_body);

  async function handleComplete() {
    if (saving) return;
    setSaving(true);
    await onComplete(item);
    setSaving(false);
  }

  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="font-medium">
            {item.title}
            {item.is_mandatory && (
              <span className="ml-2 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                obrigatório
              </span>
            )}
          </p>
          {item.description && (
            <p className="mt-1 text-sm text-gray-400">{item.description}</p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className={`rounded-md px-2 py-0.5 ring-1 ${trainingStatusClass(item.status)}`}>
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
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
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
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              {open ? "Fechar conteúdo" : "Ler conteúdo"}
            </button>
          )}
          {item.status !== "concluido" && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {saving
                ? "Salvando…"
                : item.status === "vencido"
                  ? "Refiz o treinamento"
                  : "Marcar concluído"}
            </button>
          )}
        </div>
      </div>

      {open && item.content_body && (
        <div className="mt-3 whitespace-pre-line rounded-lg bg-black/30 p-3 text-sm leading-relaxed text-gray-200">
          {item.content_body}
        </div>
      )}

      {!hasContent && (
        <p className="mt-3 text-xs text-gray-500">
          Treinamento presencial — combine com a gerência e marque como concluído depois.
        </p>
      )}
    </li>
  );
}
