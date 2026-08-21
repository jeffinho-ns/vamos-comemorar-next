"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import {
  AnswerPayload,
  ChecklistItemCard,
} from "../../../components/justino360/ChecklistItemCard";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { j360Fetch } from "../../../lib/justino360/api";
import type { AnswerItemResult, ChecklistRunDetail } from "../../../lib/justino360/types";

export default function StaffChecklistRunPage() {
  const params = useParams();
  const runId = Number(params?.id);
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  const [run, setRun] = useState<ChecklistRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!runId) {
      setError("Checklist inválido.");
      setLoading(false);
      return;
    }
    const res = await j360Fetch<ChecklistRunDetail>(`/checklist-runs/${runId}`);
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível carregar o checklist.");
    } else {
      setError(null);
      setRun(res.data);
    }
    setLoading(false);
  }, [runId]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const answer = useCallback(
    async (itemId: number, payload: AnswerPayload) => {
      const res = await j360Fetch<AnswerItemResult>(`/checklist-run-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.success) {
        if (payload.status === "nao_ok") {
          const gerados: string[] = [];
          if (res.data?.incident?.id) gerados.push(`ocorrência #${res.data.incident.id}`);
          if (res.data?.task?.id) gerados.push(`tarefa #${res.data.task.id}`);
          setFeedback(
            gerados.length > 0
              ? `Não conformidade registrada — ${gerados.join(" e ")}.`
              : "Não conformidade registrada.",
          );
        } else {
          setFeedback("Item respondido.");
        }
        await load();
      }
      return { success: res.success, message: res.message };
    },
    [load],
  );

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso ao Justino360.</p>
      </div>
    );
  }

  const progress =
    run && run.total_items > 0
      ? Math.round((run.answered_items / run.total_items) * 100)
      : 0;

  return (
    <Justino360Shell mode="staff" title={run?.template_name || "Checklist"}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="mt-2 rounded bg-white/10 px-3 py-1 text-sm"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {loading && !run && <p className="text-gray-400">Carregando checklist…</p>}

      {run && (
        <div className="space-y-5">
          <section className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-400">
                  {run.sector_name || "Geral"}
                  {run.run_date
                    ? ` · ${new Date(`${run.run_date}`).toLocaleDateString("pt-BR")}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {run.answered_items} de {run.total_items} itens respondidos
                  {run.nao_ok_count > 0 ? ` · ${run.nao_ok_count} não OK` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  run.status === "concluido"
                    ? "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40"
                    : "bg-amber-500/20 text-amber-200 ring-amber-500/40"
                }`}
              >
                {run.status === "concluido" ? "Concluído" : "Em andamento"}
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do checklist"
            >
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {feedback && (
            <p className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-200" role="status">
              {feedback}
            </p>
          )}

          <ul className="space-y-3">
            {run.items.map((item) => (
              <ChecklistItemCard key={item.id} item={item} onAnswer={answer} />
            ))}
          </ul>

          {run.status === "concluido" && (
            <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-500/30">
              Checklist concluído. As não conformidades viraram ocorrências e tarefas —
              acompanhe em{" "}
              <Link href="/justino360/tarefas" className="underline">
                minhas tarefas
              </Link>
              .
            </div>
          )}
        </div>
      )}
    </Justino360Shell>
  );
}
