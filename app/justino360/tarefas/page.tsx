"use client";

import { useCallback, useEffect, useState } from "react";
import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { j360Fetch } from "../../lib/justino360/api";
import {
  PRIORITY_LABEL,
  TASK_NEXT_STATUSES,
  TASK_STATUS_LABEL,
  formatDateTime,
  priorityClass,
} from "../../lib/justino360/labels";
import type { J360Task, TaskStatus } from "../../lib/justino360/types";

export default function StaffTarefasPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const [items, setItems] = useState<J360Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await j360Fetch<J360Task[]>("/tasks?mine=1");
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar suas tarefas.");
    } else {
      setError(null);
      setItems(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

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

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso ao Justino360.</p>
      </div>
    );
  }

  const abertas = items.filter((t) => t.status !== "concluida" && t.status !== "validada");
  const fechadas = items.filter((t) => t.status === "concluida" || t.status === "validada");

  function renderTask(t: J360Task) {
    return (
      <li key={t.id} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{t.title}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${priorityClass(t.priority)}`}
          >
            {PRIORITY_LABEL[t.priority] || t.priority}
          </span>
          {t.is_overdue && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200 ring-1 ring-red-500/40">
              Atrasada
            </span>
          )}
        </div>
        {t.description && <p className="mt-1 text-sm text-gray-300">{t.description}</p>}
        <p className="mt-1 text-sm text-gray-500">
          {t.sector_name || "Geral"} · {t.origin} ·{" "}
          {TASK_STATUS_LABEL[t.status] || t.status}
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
          {(TASK_NEXT_STATUSES[t.status] || [])
            .filter((s) => s !== "validada")
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(t.id, s)}
                disabled={busy}
                className="rounded bg-amber-500/90 px-2 py-1 text-[11px] font-semibold uppercase text-gray-900 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {TASK_STATUS_LABEL[s]}
              </button>
            ))}
        </div>
      </li>
    );
  }

  return (
    <Justino360Shell mode="staff" title="Minhas tarefas">
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-medium">Em aberto</h2>
            <ul className="space-y-3">
              {abertas.map(renderTask)}
              {abertas.length === 0 && (
                <p className="text-sm text-gray-400">Nada em aberto para você agora.</p>
              )}
            </ul>
          </section>
          {fechadas.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Concluídas aguardando validação</h2>
              <ul className="space-y-3">{fechadas.map(renderTask)}</ul>
            </section>
          )}
        </div>
      )}
    </Justino360Shell>
  );
}
