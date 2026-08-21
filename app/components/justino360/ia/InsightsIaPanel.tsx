"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PRIORITY_LABEL,
  formatDateTime,
  priorityClass,
} from "../../../lib/justino360/labels";
import { IaBadge, IaPanel, IaPreview } from "./IaPanel";
import {
  IA_FIELD,
  IA_PRIMARY_BUTTON,
  IA_SECONDARY_BUTTON,
  type IaInsights,
} from "./iaMeta";
import { iaFetch, useIaAction } from "./useIaAction";

const WINDOWS = [30, 60, 90, 180] as const;

/**
 * Aba 4 — recorrência real de j360_incidents. Funciona sem OPENAI_API_KEY:
 * nesse caso a API devolve a leitura estatística (`meta.source = "fallback"`)
 * em vez de erro, e as ações sugeridas continuam viráveis em tarefa.
 */
export function InsightsIaPanel({ canManage }: { canManage: boolean }) {
  const [days, setDays] = useState<number>(60);
  const [minTimes, setMinTimes] = useState<number>(2);
  const [creating, setCreating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data, meta, error, loading, run } = useIaAction<IaInsights>();

  const load = useCallback(
    (windowDays: number, times: number) => {
      setFeedback(null);
      return run(`/ai/recurring-insights?days=${windowDays}&min_times=${times}`);
    },
    [run],
  );

  useEffect(() => {
    // A rota exige gestão: sem permissão, evitamos disparar um 403 na cara do usuário.
    if (!canManage) return;
    load(days, minTimes);
  }, [canManage, days, minTimes, load]);

  async function createTask(title: string, why: string | null, priority: string) {
    setCreating(title);
    setFeedback(null);
    const res = await iaFetch<{ id: number }>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: why,
        priority,
        origin: "recorrencia",
      }),
    });
    setCreating(null);
    if (!res.success) {
      setFeedback({ tone: "error", text: res.message || "Falha ao criar a tarefa." });
      return;
    }
    setFeedback({ tone: "ok", text: `Tarefa “${title}” criada. Acompanhe na aba Tarefas.` });
  }

  return (
    <IaPanel
      title="Insights de recorrência"
      hint="O que voltou a acontecer na casa e o que atacar primeiro. Base: ocorrências registradas no período."
      loading={loading}
      loadingLabel="Analisando ocorrências…"
      error={error}
      feedback={feedback}
      meta={meta}
      form={
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">Janela</span>
            <select
              className={IA_FIELD}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {WINDOWS.map((value) => (
                <option key={value} value={value}>
                  Últimos {value} dias
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">Mínimo de repetições</span>
            <select
              className={IA_FIELD}
              value={minTimes}
              onChange={(event) => setMinTimes(Number(event.target.value))}
            >
              {[2, 3, 5].map((value) => (
                <option key={value} value={value}>
                  {value}x ou mais
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => load(days, minTimes)}
            disabled={loading || !canManage}
            className={IA_PRIMARY_BUTTON}
          >
            {loading ? "Analisando…" : "Atualizar análise"}
          </button>
        </div>
      }
    >
      {data && data.items.length === 0 && (
        <p className="rounded-lg bg-white/5 px-4 py-3 text-sm text-gray-300 ring-1 ring-white/10">
          {data.note || "Nenhuma recorrência no período — sinal bom."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <>
          {data.note && <p className="text-xs text-amber-300">{data.note}</p>}

          <IaPreview
            heading="Ocorrências que se repetiram"
            badges={
              <>
                <IaBadge>{data.items.length} padrões</IaBadge>
                <IaBadge>últimos {data.window_days} dias</IaBadge>
              </>
            }
          >
            <ul className="space-y-2">
              {data.items.map((item) => (
                <li
                  key={`${item.title}-${item.sector_name || "geral"}`}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
                    {item.times}x
                  </span>
                  <span className="text-gray-100">{item.title}</span>
                  <span className="text-xs text-gray-500">
                    {item.sector_name || "Sem setor"}
                    {item.category ? ` · ${item.category}` : ""}
                    {item.last_seen ? ` · última em ${formatDateTime(item.last_seen)}` : ""}
                    {item.still_open > 0 ? ` · ${item.still_open} em aberto` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </IaPreview>

          {data.insights.length > 0 && (
            <IaPreview heading="Leitura">
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-200">
                {data.insights.map((insight, index) => (
                  <li key={`${insight}-${index}`}>{insight}</li>
                ))}
              </ul>
            </IaPreview>
          )}

          {data.suggested_actions.length > 0 && (
            <IaPreview heading="Ações sugeridas">
              <ul className="space-y-2">
                {data.suggested_actions.map((action, index) => (
                  <li
                    key={`${action.title}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10"
                  >
                    <span className="flex-1 text-sm">
                      <span className="block font-medium text-gray-100">{action.title}</span>
                      {action.why && (
                        <span className="mt-0.5 block text-xs text-gray-400">{action.why}</span>
                      )}
                      <span
                        className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs ring-1 ${priorityClass(action.priority)}`}
                      >
                        {PRIORITY_LABEL[action.priority] || action.priority}
                      </span>
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => createTask(action.title, action.why, action.priority)}
                        disabled={creating !== null}
                        className={IA_SECONDARY_BUTTON}
                      >
                        {creating === action.title ? "Criando…" : "Criar tarefa"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </IaPreview>
          )}
        </>
      )}
    </IaPanel>
  );
}
