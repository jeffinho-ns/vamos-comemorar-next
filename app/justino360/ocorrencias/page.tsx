"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch, j360Upload } from "../../lib/justino360/api";
import {
  INCIDENT_STATUS_LABEL,
  PRIORITY_LABEL,
  formatDateTime,
  priorityClass,
} from "../../lib/justino360/labels";
import type { J360Incident, Priority } from "../../lib/justino360/types";

export default function StaffOcorrenciasPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const res = await j360Fetch<J360Incident[]>("/incidents?open=1");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar as ocorrências.");
    } else {
      setError(null);
      setItems(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let evidenceUrl: string | undefined;
    if (file) {
      setBusy("Enviando evidência…");
      const up = await j360Upload(file);
      if (!up.success || !up.data?.url) {
        setBusy(null);
        setError(up.message || "Falha ao enviar a evidência.");
        return;
      }
      evidenceUrl = up.data.url;
    }

    setBusy("Registrando ocorrência…");
    const res = await j360Fetch("/incidents", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        priority,
        evidence_url: evidenceUrl,
        create_task: true,
      }),
    });
    setBusy(null);
    if (!res.success) {
      setError(res.message || "Não foi possível registrar a ocorrência.");
      return;
    }
    setTitle("");
    setDescription("");
    setPriority("media");
    setFile(null);
    await load();
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso ao Justino360.</p>
      </div>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Ocorrências">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
          {error}
        </div>
      )}

      <form
        onSubmit={onCreate}
        className="mb-8 space-y-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
      >
        <h2 className="font-medium">Registrar ocorrência</h2>
        <input
          className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
          placeholder="O que aconteceu? (título)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
        />
        <textarea
          className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
          placeholder="Detalhes que ajudem a resolver"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={4000}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="staff-inc-priority" className="mb-1 block text-xs text-gray-400">
              Prioridade
            </label>
            <select
              id="staff-inc-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            >
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <label htmlFor="staff-inc-file" className="mb-1 block text-xs text-gray-400">
              Foto ou vídeo (opcional)
            </label>
            <input
              id="staff-inc-file"
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-lg bg-black/30 px-3 py-2 text-sm text-gray-300 ring-1 ring-white/10 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-900"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={Boolean(busy)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
          >
            Registrar
          </button>
          {busy && <p className="text-sm text-amber-300">{busy}</p>}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{i.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(i.priority)}`}
                >
                  {PRIORITY_LABEL[i.priority] || i.priority}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 ring-1 ring-white/20">
                  {INCIDENT_STATUS_LABEL[i.status] || i.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {i.sector_name || "Geral"} · {formatDateTime(i.created_at)}
              </p>
              {i.evidence_url && (
                <a
                  href={i.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-amber-300 underline"
                >
                  Ver evidência
                </a>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma ocorrência aberta.</p>
          )}
        </ul>
      )}
    </Justino360Shell>
  );
}
