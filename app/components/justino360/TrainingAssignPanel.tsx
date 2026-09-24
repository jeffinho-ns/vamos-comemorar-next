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

function statusClassLight(status?: string | null): string {
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
 * Painel de gestão de um curso: quem está atribuído, em que situação, e
 * atribuição em lote. `reassign` recicla até quem está com conclusão em dia.
 */
export function TrainingAssignPanel({
  training,
  team,
  onAssign,
  onCompleteFor,
  onClose,
  tone = "dark",
}: {
  training: J360TrainingDetail;
  team: J360TeamMember[];
  onAssign: (userIds: number[], dueAt: string | null, reassign: boolean) => Promise<boolean>;
  onCompleteFor: (userId: number) => Promise<void>;
  onClose: () => void;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  const FIELD = light
    ? "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
    : "rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
  const shell = light
    ? "mb-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
    : "mb-6 rounded-xl bg-black/30 p-4 ring-1 ring-white/10";
  const muted = light ? "text-slate-500" : "text-gray-400";
  const name = light ? "text-slate-800" : "text-gray-200";
  const listBox = light
    ? "max-h-64 space-y-1 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50 p-2"
    : "max-h-64 space-y-1 overflow-y-auto rounded-lg bg-white/5 p-2";
  const rowHover = light
    ? "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white"
    : "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white/5";
  const check = light
    ? "h-4 w-4 rounded border-stone-300 accent-teal-600"
    : "h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500";
  const ghost = light
    ? "rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-stone-50 disabled:opacity-50"
    : "rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20 disabled:opacity-50";
  const primary = light
    ? "rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-60"
    : "rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-400 disabled:opacity-60";
  const assignRow = light
    ? "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm"
    : "flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm";
  const miniBtn = light
    ? "rounded-md border border-stone-200 bg-white px-2 py-0.5 hover:bg-stone-50"
    : "rounded-md bg-white/10 px-2 py-0.5 hover:bg-white/20";
  const closeCls = light
    ? "text-xs text-slate-500 underline hover:text-slate-800"
    : "text-xs text-gray-400 underline hover:text-gray-200";
  const expired = light ? "text-rose-600" : "text-red-300";
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
    <section className={shell}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`font-medium ${light ? "text-slate-900" : ""}`}>{training.title}</h3>
          <p className={`mt-1 text-xs ${muted}`}>
            {training.completed_count ?? 0} de {training.assigned_count ?? 0} concluíram
            {" · "}
            {training.completion_rate ?? 0}%
            {(training.expired_count ?? 0) > 0 && (
              <span className={expired}> · {training.expired_count} vencido(s)</span>
            )}
            {" · "}
            {validityHint(training.validity_days)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={closeCls}
        >
          Fechar
        </button>
      </div>

      <div className="mb-5">
        <h4 className={`mb-2 text-xs font-medium uppercase tracking-wide ${muted}`}>
          Atribuir para a equipe
        </h4>
        {team.length === 0 ? (
          <p className={`text-sm ${muted}`}>
            Nenhuma pessoa com acesso ativo ao Justino360 nesta casa.
          </p>
        ) : (
          <>
            <div className={listBox}>
              {team.map((member) => (
                <label
                  key={member.id}
                  className={rowHover}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(member.id)}
                      onChange={() => toggle(member.id)}
                      className={check}
                    />
                    <span className={name}>{member.name || member.email}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs ring-1 ${light ? statusClassLight(member.assignment_status) : trainingStatusClass(member.assignment_status)}`}
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
                className={ghost}
              >
                Selecionar quem falta ({pendingTeam.length})
              </button>
              <label className={`text-xs ${muted}`}>
                Prazo
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className={`${FIELD} ml-2`}
                  aria-label="Prazo para conclusão"
                />
              </label>
              <label className={`flex cursor-pointer items-center gap-2 text-xs ${muted}`}>
                <input
                  type="checkbox"
                  checked={reassign}
                  onChange={(e) => setReassign(e.target.checked)}
                  className={check}
                />
                Reciclar quem já concluiu
              </label>
              <button
                type="button"
                onClick={handleAssign}
                disabled={selected.length === 0 || saving}
                className={primary}
              >
                {saving ? "Atribuindo…" : `Atribuir (${selected.length})`}
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <h4 className={`mb-2 text-xs font-medium uppercase tracking-wide ${muted}`}>
          Progresso por pessoa
        </h4>
        {training.assignments.length === 0 ? (
          <p className={`text-sm ${muted}`}>Ninguém atribuído ainda.</p>
        ) : (
          <ul className="space-y-1">
            {training.assignments.map((assignment) => (
              <li
                key={assignment.id}
                className={assignRow}
              >
                <span className={name}>
                  {assignment.user_name || assignment.user_email || `Usuário ${assignment.user_id}`}
                </span>
                <span className={`flex flex-wrap items-center gap-2 text-xs ${muted}`}>
                  {assignment.due_at && <span>prazo {formatDateTime(assignment.due_at)}</span>}
                  {assignment.completed_at && (
                    <span>concluído {formatDateTime(assignment.completed_at)}</span>
                  )}
                  {assignment.expires_at && (
                    <span>{validityHint(null, assignment.days_until_expiry)}</span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 ring-1 ${light ? statusClassLight(assignment.status) : trainingStatusClass(assignment.status)}`}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                  {assignment.status !== "concluido" && (
                    <button
                      type="button"
                      onClick={() => onCompleteFor(assignment.user_id)}
                      className={miniBtn}
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
