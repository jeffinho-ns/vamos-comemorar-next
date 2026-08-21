"use client";

import { useId, useState } from "react";
import { J360_UPLOAD_ACCEPT, j360Upload } from "../../lib/justino360/api";
import {
  RUN_ITEM_STATUS_LABEL,
  formatDateTime,
  runItemStatusClass,
} from "../../lib/justino360/labels";
import type { ChecklistRunItem, RunItemStatus } from "../../lib/justino360/types";

export type AnswerPayload = {
  status: RunItemStatus;
  observation?: string;
  evidence_url?: string;
};

type Props = {
  item: ChecklistRunItem;
  onAnswer: (
    itemId: number,
    payload: AnswerPayload,
  ) => Promise<{ success: boolean; message?: string }>;
};

const ACCEPTED_FILES = J360_UPLOAD_ACCEPT;

export function ChecklistItemCard({ item, onAnswer }: Props) {
  const fieldId = useId();
  const [showForm, setShowForm] = useState(false);
  const [observation, setObservation] = useState(item.observation || "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answered = item.status !== "pendente";
  const requiresPhoto = Boolean(item.requires_photo);

  function resetForm() {
    setShowForm(false);
    setFile(null);
    setError(null);
  }

  async function submitSimple(status: "ok" | "na") {
    setError(null);
    setBusy(status === "ok" ? "Marcando OK…" : "Marcando N/A…");
    const res = await onAnswer(item.id, { status });
    setBusy(null);
    if (!res.success) setError(res.message || "Não foi possível salvar.");
    else resetForm();
  }

  async function submitNaoOk() {
    setError(null);
    const obs = observation.trim();
    if (obs.length < 3) {
      setError("Descreva o que está errado (mínimo 3 caracteres).");
      return;
    }
    if (requiresPhoto && !file && !item.evidence_url) {
      setError("Este item exige foto ou vídeo da evidência.");
      return;
    }

    let evidenceUrl: string | undefined;
    if (file) {
      setBusy("Enviando evidência…");
      const up = await j360Upload(file);
      if (!up.success || !up.data?.url) {
        setBusy(null);
        setError(up.message || "Falha ao enviar a evidência. Tente novamente.");
        return;
      }
      evidenceUrl = up.data.url;
    }

    setBusy("Registrando não conformidade…");
    const res = await onAnswer(item.id, {
      status: "nao_ok",
      observation: obs,
      evidence_url: evidenceUrl,
    });
    setBusy(null);
    if (!res.success) {
      setError(res.message || "Não foi possível registrar.");
      return;
    }
    resetForm();
  }

  return (
    <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 ring-1 ${runItemStatusClass(item.status)}`}
            >
              {RUN_ITEM_STATUS_LABEL[item.status] || item.status}
            </span>
            {requiresPhoto && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-gray-300 ring-1 ring-white/20">
                Foto obrigatória
              </span>
            )}
            {item.answered_by_name && (
              <span className="text-gray-500">
                {item.answered_by_name}
                {item.answered_at ? ` · ${formatDateTime(item.answered_at)}` : ""}
              </span>
            )}
          </div>
          {item.observation && (
            <p className="mt-2 text-sm text-gray-300">{item.observation}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {item.evidence_url && (
              <a
                href={item.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 underline decoration-amber-300/40 hover:decoration-amber-300"
              >
                Ver evidência
              </a>
            )}
            {item.incident_id && (
              <span className="text-gray-400">
                Ocorrência #{item.incident_id}
                {item.incident_status ? ` (${item.incident_status})` : ""}
              </span>
            )}
            {item.task_id && (
              <span className="text-gray-400">
                Tarefa #{item.task_id}
                {item.task_status ? ` (${item.task_status})` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => submitSimple("ok")}
            disabled={Boolean(busy)}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
            }}
            disabled={Boolean(busy)}
            aria-expanded={showForm}
            aria-controls={`${fieldId}-form`}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              showForm
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-red-500/80 text-white hover:bg-red-500"
            }`}
          >
            Não OK
          </button>
          <button
            type="button"
            onClick={() => submitSimple("na")}
            disabled={Boolean(busy)}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-gray-100 transition hover:bg-white/20 disabled:opacity-50"
          >
            N/A
          </button>
        </div>
      </div>

      {showForm && (
        <div
          id={`${fieldId}-form`}
          className="mt-4 space-y-3 rounded-lg bg-black/30 p-4 ring-1 ring-red-500/20"
        >
          <div>
            <label
              htmlFor={`${fieldId}-obs`}
              className="mb-1 block text-sm font-medium text-gray-200"
            >
              O que está errado?
            </label>
            <textarea
              id={`${fieldId}-obs`}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ex: câmara fria a 12°C, acima do limite. Avisei a manutenção."
              className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-file`}
              className="mb-1 block text-sm font-medium text-gray-200"
            >
              Foto ou vídeo da evidência
              {requiresPhoto ? " (obrigatório)" : " (opcional)"}
            </label>
            <input
              id={`${fieldId}-file`}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-lg bg-black/40 px-3 py-2 text-sm text-gray-300 ring-1 ring-white/10 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-900"
            />
            {file && (
              <p className="mt-1 text-xs text-gray-400">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitNaoOk}
              disabled={Boolean(busy)}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              Registrar não conformidade
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={Boolean(busy)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-gray-100 transition hover:bg-white/20 disabled:opacity-50"
            >
              Cancelar
            </button>
            <p className="text-xs text-gray-500">
              Gera ocorrência e tarefa de correção automaticamente.
            </p>
          </div>
        </div>
      )}

      <div aria-live="polite" className="mt-2 min-h-[1rem]">
        {busy && <p className="text-xs text-amber-300">{busy}</p>}
        {error && <p className="text-xs text-red-300">{error}</p>}
        {!busy && !error && answered && !showForm && (
          <p className="text-xs text-gray-500">
            Pode revisar a resposta se algo mudou.
          </p>
        )}
      </div>
    </li>
  );
}
