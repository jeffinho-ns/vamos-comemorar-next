"use client";

import { PRIORITY_LABEL } from "../../lib/justino360/labels";
import type { Priority } from "../../lib/justino360/types";
import { J360CalendarSector } from "./calendarMeta";
import { DecisionDraft } from "./meetingMeta";

export type J360Assignee = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

const FIELD =
  "w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-amber-400/60";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400";

const PRIORITIES: Priority[] = ["baixa", "media", "alta", "critica"];

/**
 * Uma decisão da ata. Por padrão gera tarefa: decisão sem responsável e prazo
 * é decisão esquecida. Desmarcar `create_task` registra só na ata.
 */
export function MeetingDecisionFields({
  index,
  idPrefix,
  draft,
  sectors,
  assignees,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  /** Prefixo estável dos ids dos campos (vem do useId do formulário). */
  idPrefix: string;
  draft: DecisionDraft;
  sectors: J360CalendarSector[];
  assignees: J360Assignee[];
  onChange: (patch: Partial<DecisionDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <li className="space-y-3 rounded-lg bg-black/20 p-3 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <label className={LABEL} htmlFor={`${idPrefix}-text`}>
          Decisão {index + 1}
        </label>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 underline hover:text-red-300"
          >
            Remover
          </button>
        )}
      </div>

      <textarea
        id={`${idPrefix}-text`}
        className={FIELD}
        value={draft.decision}
        onChange={(e) => onChange({ decision: e.target.value })}
        rows={2}
        placeholder="Ex.: Trocar o fornecedor de gelo a partir da semana que vem"
      />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={draft.create_task}
          onChange={(e) => onChange({ create_task: e.target.checked })}
          className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-500"
        />
        Gerar tarefa desta decisão
      </label>

      {draft.create_task && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className={LABEL} htmlFor={`${idPrefix}-sector`}>
              Setor
            </label>
            <select
              id={`${idPrefix}-sector`}
              className={FIELD}
              value={draft.sector_id}
              onChange={(e) => onChange({ sector_id: e.target.value })}
            >
              <option value="">Geral</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor={`${idPrefix}-owner`}>
              Responsável
            </label>
            <select
              id={`${idPrefix}-owner`}
              className={FIELD}
              value={draft.assigned_to}
              onChange={(e) => onChange({ assigned_to: e.target.value })}
            >
              <option value="">Definir depois</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email || `Usuário ${person.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor={`${idPrefix}-due`}>
              Prazo
            </label>
            <input
              id={`${idPrefix}-due`}
              type="datetime-local"
              className={FIELD}
              value={draft.due_at}
              onChange={(e) => onChange({ due_at: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor={`${idPrefix}-priority`}>
              Prioridade
            </label>
            <select
              id={`${idPrefix}-priority`}
              className={FIELD}
              value={draft.priority}
              onChange={(e) => onChange({ priority: e.target.value as Priority })}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </li>
  );
}
