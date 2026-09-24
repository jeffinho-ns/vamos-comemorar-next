"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { IRI_FIELD, RhIdeiaShell } from "../../components/rhIdeia/RhIdeiaShell";
import { PlaybookTeamTable, roleLabel } from "../../components/rhIdeia/PlaybookTeamTable";
import {
  IRI_BTN_PRIMARY,
  IRI_BTN_SECONDARY,
  IRI_CARD,
  IRI_LINK,
  IRI_MUTED,
  IRI_SOFT,
} from "../../components/rhIdeia/ui";
import { useSaasAccess } from "../../hooks/useSaasAccess";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriPlaybookStatus, IriTeamRow } from "../../lib/rhIdeia/types";

const CRITERIA = [
  ["pontualidade", "Pontualidade"],
  ["uniforme", "Uniforme"],
  ["cardapio", "Cardápio"],
  ["agilidade", "Agilidade"],
  ["simpatia", "Simpatia"],
  ["venda", "Venda sugestiva"],
  ["zig", "Zig"],
  ["checklists", "Checklists"],
  ["material", "Material"],
  ["equipe", "Equipe"],
  ["postura", "Postura"],
  ["orientacao", "Orientação"],
] as const;

type Run = { id: number; user_id: number; user_name?: string; role_key: string; run_date: string };
type KeyRow = { slug: string; prompt: string; answer: string | null };

export default function RhIdeiaEquipePage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;
  const [status, setStatus] = useState<IriPlaybookStatus | null>(null);
  const [rows, setRows] = useState<IriTeamRow[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [answerKey, setAnswerKey] = useState<KeyRow[] | null>(null);
  const [subject, setSubject] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [statusRes, teamRes, runRes] = await Promise.all([
      iriFetch<IriPlaybookStatus>("/playbook/status"),
      iriFetch<IriTeamRow[]>("/playbook/team"),
      iriFetch<Run[]>("/playbook/checklist-runs"),
    ]);
    if (statusRes.success) setStatus(statusRes.data || null);
    if (teamRes.success && teamRes.data) setRows(teamRes.data);
    else setMessage(teamRes.message || null);
    if (runRes.success && runRes.data) setRuns(runRes.data);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  async function showKey() {
    const res = await iriFetch<KeyRow[]>("/playbook/quiz/key");
    if (!res.success || !res.data) setMessage(res.message || "Gabarito indisponível.");
    else setAnswerKey(res.data);
  }

  async function confirm(id: number) {
    const res = await iriFetch(`/playbook/checklist-runs/${id}/confirm`, { method: "POST" });
    setMessage(res.success ? "Checklist conferido." : res.message || "Não foi possível conferir.");
    load();
  }

  async function record(kind: "treino" | "ronda" | "padrinho") {
    const res = await iriFetch("/playbook/events", {
      method: "POST",
      body: JSON.stringify({ kind, subject_user_id: kind === "padrinho" ? Number(subject) : undefined }),
    });
    setMessage(res.success ? "Registro lançado na pontuação." : res.message || "Não foi possível registrar.");
    load();
  }

  async function evaluate(event: FormEvent) {
    event.preventDefault();
    const res = await iriFetch("/playbook/evaluations", {
      method: "POST",
      body: JSON.stringify({ subject_user_id: Number(subject), scores }),
    });
    setMessage(res.success ? "Avaliação registrada." : res.message || "Não foi possível avaliar.");
    load();
  }

  if (!allowed) return null;

  return (
    <RhIdeiaShell mode="staff" title="Equipe da área">
      {message && <p className={`mb-4 text-sm ${IRI_SOFT}`}>{message}</p>}
      {!status?.is_leader && !status?.sees_all ? (
        <p className={IRI_SOFT}>
          Este painel mostra o andamento da equipe para o líder da área. O texto das funções não
          aparece aqui.
        </p>
      ) : (
        <div className="space-y-6">
          <section className={IRI_CARD}>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Andamento</h2>
            <PlaybookTeamTable rows={rows} />
          </section>
          <section className={IRI_CARD}>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Checklists para conferir</h2>
            <ul className="space-y-2 text-sm">
              {runs.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-3 text-slate-700">
                  <span>
                    {run.user_name} · {roleLabel(run.role_key)} · {run.run_date}
                  </span>
                  <button type="button" onClick={() => confirm(run.id)} className={IRI_LINK}>
                    Conferir
                  </button>
                </li>
              ))}
              {runs.length === 0 && <li className={IRI_MUTED}>Nenhum checklist aguardando.</li>}
            </ul>
          </section>
          {status?.is_leader && (
            <section className={IRI_CARD}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Registros do líder</h2>
              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" onClick={showKey} className={IRI_BTN_SECONDARY}>
                  Ver gabarito da prova
                </button>
                <button type="button" onClick={() => record("treino")} className={IRI_BTN_SECONDARY}>
                  Treino de 30 minutos
                </button>
                <button type="button" onClick={() => record("ronda")} className={IRI_BTN_SECONDARY}>
                  Ronda olhar de cliente
                </button>
              </div>
              {answerKey && (
                <ol
                  className={`mb-4 list-decimal space-y-1 pl-5 text-sm ${IRI_SOFT} select-none`}
                  onCopy={(event) => event.preventDefault()}
                >
                  {answerKey.map((row) => (
                    <li key={row.slug}>
                      {row.prompt} <span className="font-medium text-teal-700">{row.answer}</span>
                    </li>
                  ))}
                </ol>
              )}
              <form onSubmit={evaluate} className="space-y-3">
                <select className={IRI_FIELD} value={subject} onChange={(event) => setSubject(event.target.value)}>
                  <option value="">Pessoa da equipe</option>
                  {rows
                    .filter((row) => row.user_id !== status?.profile?.user_id)
                    .map((row) => (
                      <option key={row.user_id} value={row.user_id}>
                        {row.user_name} · {roleLabel(row.role_key)}
                      </option>
                    ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CRITERIA.map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                      {label}
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className={`${IRI_FIELD} w-20`}
                        value={scores[key] || ""}
                        onChange={(event) =>
                          setScores((current) => ({ ...current, [key]: Number(event.target.value) }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => record("padrinho")} className={IRI_BTN_SECONDARY}>
                    Marcar a pessoa selecionada como padrinho
                  </button>
                  <button type="submit" className={IRI_BTN_PRIMARY}>
                    Salvar avaliação trimestral
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      )}
    </RhIdeiaShell>
  );
}
