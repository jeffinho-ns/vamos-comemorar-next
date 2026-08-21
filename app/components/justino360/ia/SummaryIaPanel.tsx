"use client";

import { FormEvent, useEffect, useState } from "react";
import { PRIORITY_LABEL, priorityClass } from "../../../lib/justino360/labels";
import type { J360Sector } from "../../../lib/justino360/types";
import { IaBadge, IaPanel, IaPreview } from "./IaPanel";
import {
  IA_FIELD,
  IA_PRIMARY_BUTTON,
  IA_SECONDARY_BUTTON,
  SUMMARY_KINDS,
  type IaSummary,
} from "./iaMeta";
import { iaFetch, useIaAction } from "./useIaAction";

const MIN_TEXT = 40;

/**
 * Aba 3 — resumo de ata/relatório e criação das tarefas decorrentes.
 * As tarefas viram POST /tasks uma a uma: se alguma falhar, as demais já criadas
 * permanecem e o contador mostra exatamente o que entrou.
 */
export function SummaryIaPanel({
  aiEnabled,
  sectors,
}: {
  aiEnabled: boolean;
  sectors: J360Sector[];
}) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<string>("ata");
  const [sectorId, setSectorId] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data, meta, error, loading, run, reset } = useIaAction<IaSummary>();

  useEffect(() => {
    if (!data) return;
    setSelected(new Set(data.action_items.map((_, index) => index)));
  }, [data]);

  async function handleSummarize(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    await run("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text, kind }),
    });
  }

  function toggle(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function createTasks() {
    if (!data) return;
    const chosen = data.action_items.filter((_, index) => selected.has(index));
    if (chosen.length === 0) {
      setFeedback({ tone: "error", text: "Selecione pelo menos uma decisão." });
      return;
    }
    setCreating(true);
    setFeedback(null);

    let created = 0;
    const failures: string[] = [];
    for (const item of chosen) {
      const res = await iaFetch<{ id: number }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: item.suggested_task,
          description: item.owner ? `${item.decision}\nResponsável indicado: ${item.owner}` : item.decision,
          priority: item.priority,
          origin: "reuniao",
          sector_id: sectorId ? Number(sectorId) : undefined,
        }),
      });
      if (res.success) created += 1;
      else failures.push(res.message || item.suggested_task);
    }
    setCreating(false);

    if (created === 0) {
      setFeedback({ tone: "error", text: failures[0] || "Nenhuma tarefa foi criada." });
      return;
    }
    setFeedback({
      tone: failures.length > 0 ? "error" : "ok",
      text:
        failures.length > 0
          ? `${created} tarefa(s) criada(s), ${failures.length} falharam: ${failures[0]}`
          : `${created} tarefa(s) criada(s). Acompanhe na aba Tarefas.`,
    });
    if (failures.length === 0) reset();
  }

  const tooShort = text.trim().length > 0 && text.trim().length < MIN_TEXT;

  return (
    <IaPanel
      title="Resumir ata ou relatório"
      hint="Cole o texto da reunião ou do relatório. A IA devolve o resumo e as decisões que viram tarefa."
      loading={loading}
      loadingLabel="Lendo e resumindo…"
      error={error}
      feedback={feedback}
      meta={meta}
      disabledNotice={
        aiEnabled
          ? null
          : "O resumo por IA está desligado neste servidor (OPENAI_API_KEY não configurada). As atas continuam podendo ser registradas em Reuniões."
      }
      form={
        <form onSubmit={handleSummarize} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-300">Tipo de conteúdo</span>
              <select
                className={IA_FIELD}
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                {SUMMARY_KINDS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-300">Setor das tarefas (opcional)</span>
              <select
                className={IA_FIELD}
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
              >
                <option value="">Sem setor</option>
                {sectors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-300">Texto</span>
            <textarea
              className={IA_FIELD}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Cole aqui a ata da reunião, o relatório do turno ou o laudo recebido."
              rows={8}
              minLength={MIN_TEXT}
              required
            />
          </label>
          {tooShort && (
            <p className="text-xs text-amber-300">
              Faltam {MIN_TEXT - text.trim().length} caracteres para o mínimo de resumo.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !aiEnabled || tooShort}
            className={IA_PRIMARY_BUTTON}
          >
            {loading ? "Resumindo…" : "Resumir"}
          </button>
        </form>
      }
    >
      {data && (
        <IaPreview
          heading="Resumo"
          badges={<IaBadge>{data.action_items.length} decisões</IaBadge>}
          actions={
            data.action_items.length > 0 ? (
              <button
                type="button"
                onClick={createTasks}
                disabled={creating || selected.size === 0}
                className={IA_SECONDARY_BUTTON}
              >
                {creating ? "Criando…" : `Criar ${selected.size} tarefa(s)`}
              </button>
            ) : null
          }
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">{data.summary}</p>

          {data.action_items.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {data.action_items.map((item, index) => (
                <li
                  key={`${item.suggested_task}-${index}`}
                  className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10"
                >
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggle(index)}
                      className="mt-1 h-4 w-4 accent-amber-500"
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-gray-100">{item.suggested_task}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">{item.decision}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs ring-1 ${priorityClass(item.priority)}`}
                        >
                          {PRIORITY_LABEL[item.priority] || item.priority}
                        </span>
                        {item.owner && (
                          <span className="text-xs text-gray-500">Indicado: {item.owner}</span>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-400">
              O texto não fechou nenhuma decisão acionável.
            </p>
          )}
        </IaPreview>
      )}
    </IaPanel>
  );
}
