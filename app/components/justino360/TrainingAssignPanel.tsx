"use client";

import { useState } from "react";
import { formatDateTime } from "../../lib/justino360/labels";
import {
  J360TeamMember,
  J360TrainingDetail,
  statusLabel,
  trainingStatusClass,
  validityHint,
} from "./trainingMeta";

const FIELD =
  "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";

/**
 * Painel de gestão de um curso: quem está atribuído, em que situação, e
 * atribuição em lote. `reassign` recicla até quem está com conclusão em dia.
 */
export function TrainingAssignPanel({
  training,
  team,
  onAssign,
  onCompleteFor,
  onClose,
}: {
  training: J360TrainingDetail;
  team: J360TeamMember[];
  onAssign: (userIds: number[], dueAt: string | null, reassign: boolean) => Promise<boolean>;
  onCompleteFor: (userId: number) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [reassign, setReassign] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggle(userId: number) {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  const pendingTeam = team.filter((member) => !member.assignment_status);

  async function handleAssign() {
    if (selected.length === 0 || saving) return;
    setSaving(true);
    const ok = await onAssign(selected, dueAt || null, reassign);
    setSaving(false);
    if (ok) {
      setSelected([]);
      setReassign(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{training.title}</h3>
          <p className="mt-1 text-xs text-gray-400">
            {training.completed_count ?? 0} de {training.assigned_count ?? 0} concluíram
            {" · "}
            {training.completion_rate ?? 0}%
            {(training.expired_count ?? 0) > 0 && (
              <span className="text-red-300"> · {training.expired_count} vencido(s)</span>
            )}
            {" · "}
            {validityHint(training.validity_days)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 underline hover:text-gray-200"
        >
          Fechar
        </button>
      </div>

      <div className="mb-5">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Atribuir para a equipe
        </h4>
        {team.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhuma pessoa com acesso ativo ao Justino360 nesta casa.
          </p>
        ) : (
          <>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg bg-white/5 p-2">
              {team.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(member.id)}
                      onChange={() => toggle(member.id)}
                      className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500"
                    />
                    <span className="text-gray-200">{member.name || member.email}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs ring-1 ${trainingStatusClass(
                      member.assignment_status,
                    )}`}
                  >
                    {statusLabel(member.assignment_status)}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(pendingTeam.map((m) => m.id))}
                disabled={pendingTeam.length === 0}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 disabled:opacity-50"
              >
                Selecionar quem falta ({pendingTeam.length})
              </button>
              <label className="text-xs text-gray-400">
                Prazo
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className={`${FIELD} ml-2`}
                  aria-label="Prazo para conclusão"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={reassign}
                  onChange={(e) => setReassign(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500"
                />
                Reciclar quem já concluiu
              </label>
              <button
                type="button"
                onClick={handleAssign}
                disabled={selected.length === 0 || saving}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {saving ? "Atribuindo…" : `Atribuir (${selected.length})`}
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Progresso por pessoa
        </h4>
        {training.assignments.length === 0 ? (
          <p className="text-sm text-gray-400">Ninguém atribuído ainda.</p>
        ) : (
          <ul className="space-y-1">
            {training.assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-gray-200">
                  {assignment.user_name || assignment.user_email || `Usuário ${assignment.user_id}`}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  {assignment.due_at && <span>prazo {formatDateTime(assignment.due_at)}</span>}
                  {assignment.completed_at && (
                    <span>concluído {formatDateTime(assignment.completed_at)}</span>
                  )}
                  {assignment.expires_at && (
                    <span>{validityHint(null, assignment.days_until_expiry)}</span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 ring-1 ${trainingStatusClass(
                      assignment.status,
                    )}`}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                  {assignment.status !== "concluido" && (
                    <button
                      type="button"
                      onClick={() => onCompleteFor(assignment.user_id)}
                      className="rounded-md bg-white/10 px-2 py-0.5 hover:bg-white/20"
                    >
                      Registrar conclusão
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
