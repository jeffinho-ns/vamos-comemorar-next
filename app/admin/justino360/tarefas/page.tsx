"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import {
  PRIORITY_LABEL,
  TASK_NEXT_STATUSES,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
  formatDateTime,
  priorityClass,
} from "../../../lib/justino360/labels";
import type { J360Task, Priority, TaskStatus } from "../../../lib/justino360/types";

type Sector = { id: number; name: string };

export default function AdminTarefasPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [items, setItems] = useState<J360Task[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [sectorId, setSectorId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const load = useCallback(async () => {
    const res = await j360Fetch<J360Task[]>("/tasks");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar as tarefas.");
    } else {
      setError(null);
      setItems(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    j360Fetch<Sector[]>("/sectors").then((res) => {
      if (res.success && res.data) setSectors(res.data);
    });
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await j360Fetch("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        priority,
        sector_id: sectorId ? Number(sectorId) : undefined,
        due_at: dueAt || undefined,
      }),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível criar a tarefa.");
      return;
    }
    setTitle("");
    setPriority("media");
    setSectorId("");
    setDueAt("");
    await load();
  }

  async function setStatus(id: number, status: TaskStatus) {
    setBusy(true);
    const res = await j360Fetch(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.success) {
      setError(res.message || "Não foi possível atualizar a tarefa.");
      return;
    }
    await load();
  }

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Shell mode="admin" title="Board de tarefas">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
            {error}
          </div>
        )}

        <form
          onSubmit={onCreate}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
          <div className="min-w-[220px] flex-1">
            <label htmlFor="task-title" className="mb-1 block text-xs text-gray-400">
              Nova tarefa
            </label>
            <input
              id="task-title"
              className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
              placeholder="Ex: trocar lâmpada do corredor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              required
            />
          </div>
          <div>
            <label htmlFor="task-priority" className="mb-1 block text-xs text-gray-400">
              Prioridade
            </label>
            <select
              id="task-priority"
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
          <div>
            <label htmlFor="task-sector" className="mb-1 block text-xs text-gray-400">
              Setor
            </label>
            <select
              id="task-sector"
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            >
              <option value="">Geral</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-due" className="mb-1 block text-xs text-gray-400">
              Prazo
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
          >
            Criar
          </button>
        </form>

        {loading ? (
          <p className="text-gray-400">Carregando…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TASK_STATUS_ORDER.map((status) => {
              const column = items.filter((t) => t.status === status);
              return (
                <div key={status} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  <h3 className="mb-2 flex items-center justify-between text-sm font-medium text-gray-300">
                    <span>{TASK_STATUS_LABEL[status]}</span>
                    <span className="text-xs text-gray-500">{column.length}</span>
                  </h3>
                  <ul className="space-y-2">
                    {column.map((t) => (
                      <li key={t.id} className="rounded-lg bg-black/20 p-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${priorityClass(t.priority)}`}
                          >
                            {PRIORITY_LABEL[t.priority] || t.priority}
                          </span>
                          {t.is_overdue && (
                            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200 ring-1 ring-red-500/40">
                              Atrasada
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {t.sector_name || "Geral"} · {t.origin}
                          {t.assigned_to_name ? ` · ${t.assigned_to_name}` : " · sem responsável"}
                          {t.due_at ? ` · até ${formatDateTime(t.due_at)}` : ""}
                        </p>
                        {t.evidence_url && (
                          <a
                            href={t.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-amber-300 underline"
                          >
                            Ver evidência
                          </a>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(TASK_NEXT_STATUSES[t.status] || []).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(t.id, s)}
                              disabled={busy}
                              className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase text-gray-100 transition hover:bg-white/20 disabled:opacity-50"
                            >
                              {TASK_STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                    {column.length === 0 && (
                      <p className="text-xs text-gray-500">Vazio.</p>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Justino360Shell>
    </AdminSaasGuard>
  );
}
