"use client";

import {
  PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  formatDateTime,
  priorityClass,
} from "../../lib/justino360/labels";
import { J360MeetingDecision } from "./meetingMeta";

/** Decisões da ata com o estado real da tarefa gerada. */
export function MeetingDecisionList({
  decisions,
}: {
  decisions: J360MeetingDecision[];
}) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Nenhuma decisão registrada nesta reunião.
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        Decisões
      </h3>
      <ul className="space-y-2">
        {decisions.map((decision) => (
          <li
            key={decision.id}
            className="rounded-lg bg-black/20 p-3 ring-1 ring-white/10"
          >
            <p className="text-sm text-gray-200">{decision.decision}</p>
            {decision.task_id ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-gray-200 ring-1 ring-white/20">
                  {decision.task_status
                    ? TASK_STATUS_LABEL[decision.task_status]
                    : "Tarefa"}
                </span>
                {decision.task_priority && (
                  <span
                    className={`rounded-md px-2 py-0.5 ring-1 ${priorityClass(decision.task_priority)}`}
                  >
                    {PRIORITY_LABEL[decision.task_priority]}
                  </span>
                )}
                {decision.task_is_overdue && (
                  <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-red-200 ring-1 ring-red-500/40">
                    Atrasada
                  </span>
                )}
                <span className="text-gray-500">
                  {decision.task_sector_name || "Geral"}
                  {decision.task_assigned_to_name
                    ? ` · ${decision.task_assigned_to_name}`
                    : " · sem responsável"}
                  {decision.task_due_at
                    ? ` · até ${formatDateTime(decision.task_due_at)}`
                    : ""}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Registrada apenas na ata (sem tarefa).
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
