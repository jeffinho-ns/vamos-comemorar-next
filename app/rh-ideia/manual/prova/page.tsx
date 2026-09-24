"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RhIdeiaShell } from "../../../components/rhIdeia/RhIdeiaShell";
import {
  IRI_ALERT,
  IRI_BTN_PRIMARY,
  IRI_CARD,
  IRI_INFO,
  IRI_MUTED,
  IRI_SOFT,
} from "../../../components/rhIdeia/ui";
import { useSaasAccess } from "../../../hooks/useSaasAccess";
import { iriFetch } from "../../../lib/rhIdeia/api";
import type { IriPlaybookQuestion } from "../../../lib/rhIdeia/types";

export default function RhIdeiaProvaPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [questions, setQuestions] = useState<IriPlaybookQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await iriFetch<IriPlaybookQuestion[]>("/playbook/quiz");
    if (!res.success || !res.data) setError(res.message || "Não foi possível abrir a prova.");
    else setQuestions(res.data);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = questions.map((question) => ({
      slug: question.slug,
      option: answers[question.slug],
    }));
    const res = await iriFetch<{ score: number; total: number; passed: boolean }>("/playbook/quiz", {
      method: "POST",
      body: JSON.stringify({ answers: payload }),
    });
    if (!res.success || !res.data) {
      setError(res.message || "Não foi possível corrigir a prova.");
      return;
    }
    setResult(
      res.data.passed
        ? `Você acertou ${res.data.score} de ${res.data.total}. Prova concluída.`
        : `Você acertou ${res.data.score} de ${res.data.total}. A nota mínima é 14. Pode tentar de novo.`,
    );
  }

  if (!allowed) return null;

  return (
    <RhIdeiaShell mode="staff" title="Prova do manual">
      {error && <p className={`mb-4 ${IRI_ALERT}`}>{error}</p>}
      {result && <p className={`mb-4 ${IRI_INFO}`}>{result}</p>}
      <form onSubmit={submit} className="space-y-4" onCopy={(event) => event.preventDefault()}>
        {questions.map((question, index) => (
          <fieldset key={question.slug} className={IRI_CARD}>
            <legend className="px-1 text-sm font-semibold text-slate-900">
              {index + 1}. {question.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={option} className={`flex items-center gap-2 text-sm ${IRI_SOFT}`}>
                  <input
                    type="radio"
                    name={question.slug}
                    className="accent-teal-600"
                    checked={answers[question.slug] === optionIndex}
                    onChange={() => setAnswers((current) => ({ ...current, [question.slug]: optionIndex }))}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {questions.length === 0 && !error && (
          <p className={`text-sm ${IRI_MUTED}`}>Carregando questões…</p>
        )}
        <button type="submit" className={IRI_BTN_PRIMARY}>
          Enviar prova
        </button>
      </form>
    </RhIdeiaShell>
  );
}
